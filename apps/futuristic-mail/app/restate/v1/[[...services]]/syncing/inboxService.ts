import * as restate from "@restatedev/restate-sdk";
import adminDb from "@/lib/instant_serverside_db";
import { id } from "@instantdb/admin";
import { fetchWithPipedreamProxy } from "../apiService";
import { Limiter } from "../ratelimit/limiter_client";

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

// Helper function to fetch a single message
async function fetchMessage(
  accountId: string,
  externalUserId: string,
  messageId: string
): Promise<GmailMessage> {
  return await fetchWithPipedreamProxy({
    accountId,
    externalUserId,
    url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
  });
}

// Helper function to process and store messages
async function saveMessageToDb(
  msg: GmailMessage,
  accountId: string,
  userId: string
): Promise<void> {

  // Check if message already exists
  const existingMessage = await adminDb.query({
    emails: {
      $: {
        where: {
          and: [
            { accountId: accountId },
            { messageId: msg.id }
          ]
        }
      }
    }
  });

  // Skip if message already exists
  if (existingMessage.emails && existingMessage.emails.length > 0) {
    console.log(`Message ${msg.id} already exists, skipping`);
    return;
  }

  // Otherwise we make a new one!
  const email = {
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
  };

  // save to db
  await adminDb.transact([
    adminDb.tx.emails[email.id].update(email)
  ]);
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
    init: async (ctx: restate.ObjectContext, req: {
      limit?: number;
      burst?: number;
    }) => {
      const limiter = Limiter.fromContext(ctx, "gmail-api");
      await limiter.setRate(req.limit || 3, req.burst || 12);
    },
    sync: async (ctx: restate.ObjectContext, req: {
      accountId: string;
      externalUserId: string;
    }) => {
      const { accountId, externalUserId } = req;

      let messagesProcessed = 0;

      // Fetch all messages
      let pageToken: string | undefined;
      do {
        const limiter = Limiter.fromContext(ctx, "gmail-api");
        await limiter.wait(5);

        const messageList = await fetchWithPipedreamProxy({
          accountId,
          externalUserId,
          url: `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100${pageToken ? `&pageToken=${pageToken}` : ''}`,
        });

        if (!messageList.messages || messageList.messages.length === 0) break;

        // Call processMail for each message in the batch
        await Promise.all(
          messageList.messages.map((msg: { id: string }) =>
            ctx.workflowClient(gmailProcessor, msg.id).run({
              accountId,
              externalUserId,
              messageId: msg.id
            })
          )
        );

        pageToken = messageList.nextPageToken;
      } while (pageToken);

      console.log(`Processed ${messagesProcessed} messages`);

      return { status: "success" };
    }
  },
});

export const gmailProcessor = restate.workflow({
  name: "gmail-processor",
  handlers: {
    run: async (ctx: restate.WorkflowContext, req: {
      accountId: string;
      externalUserId: string;
      messageId: string;
    }) => {
      const limiter = Limiter.fromContext(ctx, "gmail-api");
      await limiter.wait();

      console.log(`Processing message ${req.messageId}`);

      const { accountId, externalUserId, messageId } = req;
      const message = await fetchMessage(accountId, externalUserId, messageId)
      await saveMessageToDb(message, accountId, externalUserId);
    }
  }
});