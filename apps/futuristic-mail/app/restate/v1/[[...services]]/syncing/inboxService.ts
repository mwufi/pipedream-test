import * as restate from "@restatedev/restate-sdk";
import adminDb from "@/lib/instant_serverside_db";
import { id } from "@instantdb/admin";
import { apiService } from "../apiService";

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
  historyId?: string;
  internalDate?: string;
}

interface GmailHistory {
  messages?: Array<{ id: string }>;
  messagesAdded?: Array<{ message: GmailMessage }>;
  messagesDeleted?: Array<{ message: { id: string } }>;
  labelsAdded?: Array<{ message: { id: string }; labelIds: string[] }>;
  labelsRemoved?: Array<{ message: { id: string }; labelIds: string[] }>;
}

// Helper function to fetch a single message
async function fetchMessage(
  ctx: restate.ObjectContext,
  accountId: string,
  externalUserId: string,
  messageId: string
): Promise<GmailMessage> {
  return await ctx.serviceClient(apiService).fetch({
    accountId,
    externalUserId,
    url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
    rateLimiterKey: "gmail-api",
    tokensNeeded: 1
  });
}

// Helper function to process and store messages
async function storeMessages(
  messages: GmailMessage[],
  accountId: string,
  userId: string
): Promise<void> {
  const emailRecords = messages.map((msg) => ({
    id: id(),
    messageId: msg.id,
    threadId: msg.threadId,
    accountId,
    userId,
    subject: msg.payload?.headers?.find(h => h.name === 'Subject')?.value || '',
    from: msg.payload?.headers?.find(h => h.name === 'From')?.value || '',
    date: msg.payload?.headers?.find(h => h.name === 'Date')?.value || '',
    snippet: msg.snippet || '',
    labelIds: msg.labelIds || [],
    historyId: msg.historyId || '',
    internalDate: msg.internalDate || '',
    syncedAt: Date.now()
  }));

  await adminDb.transact(
    emailRecords.map(email =>
      adminDb.tx.emails[email.id].update(email)
    )
  );
}

// Helper function to delete messages from database
async function deleteMessages(
  messageIds: string[],
  accountId: string
): Promise<void> {
  const result = await adminDb.query({
    emails: {
      $: {
        where: {
          and: [
            { accountId: accountId },
            { messageId: { $in: messageIds } }
          ]
        }
      }
    }
  });

  if (result.emails && result.emails.length > 0) {
    await adminDb.transact(
      result.emails.map(email =>
        adminDb.tx.emails[email.id].delete()
      )
    );
  }
}

// Define the Gmail inbox virtual object
export const gmailInboxObject = restate.object({
  name: "Gmail_Inbox",
  handlers: {
    sync: async (ctx: restate.ObjectContext, req: {
      accountId: string;
      externalUserId: string;
      forceFullSync?: boolean;
    }) => {
      const { accountId, externalUserId, forceFullSync } = req;
      const userId = ctx.key;

      // Get stored sync state
      const lastHistoryId = await ctx.get<string>("lastHistoryId");
      const lastSyncedAt = await ctx.get<number>("lastSyncedAt");
      const isSyncing = await ctx.get<boolean>("isSyncing");

      // Check if already syncing
      if (isSyncing) {
        console.log("\n\n[GmailInbox] Sync already in progress, returning current state");
        return {
          status: "already_syncing",
          lastSyncedAt,
          lastHistoryId
        };
      }

      // Mark as syncing
      ctx.set("isSyncing", true);
      const syncStartTime = await ctx.date.now();

      try {
        let currentHistoryId = lastHistoryId;
        let messagesProcessed = 0;

        // Determine if we need a full sync
        const needsFullSync = !lastHistoryId || forceFullSync;

        if (needsFullSync) {
          console.log("Performing full sync");

          const profile = await ctx.run("get-profile", async () => {
            // Get the current history ID first
            return await ctx.serviceClient(apiService).fetch({
              accountId,
              externalUserId,
              url: "https://gmail.googleapis.com/gmail/v1/users/me/profile",
              rateLimiterKey: "gmail-api",
              tokensNeeded: 1
            });
          });

          currentHistoryId = profile.historyId;

          // Fetch all messages
          let pageToken: string | undefined;
          do {
            const messageList = await ctx.run(`fetch-page-${pageToken || 'first'}`, async () => {
              return await ctx.serviceClient(apiService).fetch({
                accountId,
                externalUserId,
                url: `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100${pageToken ? `&pageToken=${pageToken}` : ''}`,
                rateLimiterKey: "gmail-api",
                tokensNeeded: 5
              });
            });

            if (!messageList.messages || messageList.messages.length === 0) break;

            // Process messages in batches
            const batchSize = 10;
            for (let i = 0; i < messageList.messages.length; i += batchSize) {
              const batch = messageList.messages.slice(i, i + batchSize);

              const messages = await ctx.run(`fetch-batch-${messagesProcessed}`, async () => {
                return await Promise.all(
                  batch.map((msg: { id: string }) =>
                    fetchMessage(ctx, accountId, externalUserId, msg.id)
                  )
                );
              });

              await ctx.run(`store-batch-${messagesProcessed}`, async () => {
                await storeMessages(messages, accountId, userId);
              });

              messagesProcessed += messages.length;
            }

            pageToken = messageList.nextPageToken;
          } while (pageToken);

        } else {
          console.log(`Performing incremental sync from history ID: ${lastHistoryId}`);

          // Fetch history changes
          let pageToken: string | undefined;
          const messagesToFetch = new Set<string>();
          const messagesToDelete = new Set<string>();

          do {
            const historyList = await ctx.run(`fetch-history-${pageToken || 'first'}`, async () => {
              return await ctx.serviceClient(apiService).fetch({
                accountId,
                externalUserId,
                url: `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${lastHistoryId}&maxResults=100${pageToken ? `&pageToken=${pageToken}` : ''}`,
                rateLimiterKey: "gmail-api",
                tokensNeeded: 5
              });
            });

            if (!historyList.history || historyList.history.length === 0) {
              currentHistoryId = historyList.historyId || lastHistoryId;
              break;
            }

            // Process history records
            for (const record of historyList.history) {
              const history = record as GmailHistory;

              // Handle messages added
              if (history.messagesAdded) {
                history.messagesAdded.forEach(item => {
                  messagesToFetch.add(item.message.id);
                  messagesToDelete.delete(item.message.id);
                });
              }

              // Handle messages deleted
              if (history.messagesDeleted) {
                history.messagesDeleted.forEach(item => {
                  messagesToDelete.add(item.message.id);
                  messagesToFetch.delete(item.message.id);
                });
              }

              // Handle modified messages (labels added/removed)
              if (history.labelsAdded || history.labelsRemoved) {
                const modifiedIds = [
                  ...(history.labelsAdded || []).map(item => item.message.id),
                  ...(history.labelsRemoved || []).map(item => item.message.id)
                ];
                modifiedIds.forEach(id => messagesToFetch.add(id));
              }
            }

            currentHistoryId = historyList.historyId;
            pageToken = historyList.nextPageToken;
          } while (pageToken);

          // Delete removed messages
          if (messagesToDelete.size > 0) {
            await ctx.run("delete-messages", async () => {
              await deleteMessages(Array.from(messagesToDelete), accountId);
            });
          }

          // Fetch and store new/modified messages
          if (messagesToFetch.size > 0) {
            const messageIds = Array.from(messagesToFetch);
            const batchSize = 10;

            for (let i = 0; i < messageIds.length; i += batchSize) {
              const batch = messageIds.slice(i, i + batchSize);

              const messages = await ctx.run(`fetch-modified-batch-${i}`, async () => {
                return await Promise.all(
                  batch.map(messageId =>
                    fetchMessage(ctx, accountId, externalUserId, messageId)
                  )
                );
              });

              await ctx.run(`store-modified-batch-${i}`, async () => {
                await storeMessages(messages, accountId, userId);
              });

              messagesProcessed += messages.length;
            }
          }
        }

        // Update sync state
        ctx.set("lastHistoryId", currentHistoryId);
        ctx.set("lastSyncedAt", syncStartTime);
        ctx.clear("isSyncing");

        return {
          status: "completed",
          messagesProcessed,
          lastHistoryId: currentHistoryId,
          lastSyncedAt: syncStartTime,
          syncType: needsFullSync ? "full" : "incremental"
        };

      } catch (error) {
        // Clear syncing flag on error
        ctx.clear("isSyncing");
        throw error;
      }
    },

    getSyncStatus: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext) => {
        const lastHistoryId = await ctx.get<string>("lastHistoryId");
        const lastSyncedAt = await ctx.get<number>("lastSyncedAt");
        const isSyncing = await ctx.get<boolean>("isSyncing");

        return {
          userId: ctx.key,
          isSyncing: !!isSyncing,
          lastHistoryId,
          lastSyncedAt,
          hasSyncedBefore: !!lastHistoryId
        };
      }
    ),

    reset: async (ctx: restate.ObjectContext) => {
      // Clear all state for fresh sync
      ctx.clear("lastHistoryId");
      ctx.clear("lastSyncedAt");
      ctx.clear("isSyncing");

      return { status: "reset" };
    }
  },
});