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
}

interface GmailSyncInput {
  accountId: string;
  externalUserId: string;
  syncJobId: string;
}

export const gmailSyncWorkflow = restate.workflow({
  name: "gmailSyncWorkflow",
  handlers: {
    run: async (ctx: restate.WorkflowContext, input: GmailSyncInput) => {
      const { accountId, externalUserId, syncJobId } = input;

      // Update sync job status in InstantDB
      await ctx.run("update-status-starting", async () => {
        await adminDb.transact([
          adminDb.tx.syncJobs[syncJobId].update({
            status: "running",
            progress: {
              current: 0,
              total: 0,
              currentStep: "Fetching message list",
              percentComplete: 0
            }
          })
        ]);
      });

      let pageToken: string | undefined;
      let totalProcessed = 0;
      let totalMessages = 0;

      // First, get total count with a minimal request
      const firstPage = await ctx.run("fetch-total-count", async () => {
        return await ctx.serviceClient(apiService).fetch({
          accountId,
          externalUserId,
          url: "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1",
          rateLimiterKey: "gmail-api",
          tokensNeeded: 1
        });
      });

      totalMessages = firstPage.resultSizeEstimate || 100; // Default to 100 if not available

      // Update total in InstantDB
      await ctx.run("update-total", async () => {
        await adminDb.transact([
          adminDb.tx.syncJobs[syncJobId].update({
            progress: {
              total: totalMessages,
              current: 0,
              currentStep: "Processing messages",
              percentComplete: 0
            }
          })
        ]);
      });

      // Process all messages
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

        // Process in batches
        const batchSize = 10;
        for (let i = 0; i < messageList.messages.length; i += batchSize) {
          const batch = messageList.messages.slice(i, i + batchSize);

          const processedMessages = await ctx.run(`process-batch-${totalProcessed}`, async () => {
            const results = await Promise.all(
              batch.map((msg: GmailMessage) =>
                ctx.serviceClient(apiService).fetch({
                  accountId,
                  externalUserId,
                  url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
                  rateLimiterKey: "gmail-api",
                  tokensNeeded: 1
                })
              )
            );

            // Store messages in InstantDB
            const emailRecords = results.map((msg: GmailMessage) => ({
              id: id(),
              messageId: msg.id,
              threadId: msg.threadId,
              accountId,
              userId: externalUserId,
              subject: msg.payload?.headers?.find(h => h.name === 'Subject')?.value || '',
              from: msg.payload?.headers?.find(h => h.name === 'From')?.value || '',
              date: msg.payload?.headers?.find(h => h.name === 'Date')?.value || '',
              snippet: msg.snippet || '',
              labelIds: msg.labelIds || [],
              syncedAt: Date.now()
            }));

            await adminDb.transact(
              emailRecords.map(email =>
                adminDb.tx.emails[email.id].update(email)
              )
            );

            return results;
          });

          totalProcessed += batch.length;

          // Update progress in InstantDB
          await ctx.run(`update-progress-${totalProcessed}`, async () => {
            const percentComplete = Math.round((totalProcessed / totalMessages) * 100);
            await adminDb.transact([
              adminDb.tx.syncJobs[syncJobId].update({
                progress: {
                  current: totalProcessed,
                  total: totalMessages,
                  currentStep: `Processing messages (${totalProcessed}/${totalMessages})`,
                  percentComplete: Math.min(percentComplete, 100)
                }
              })
            ]);
          });
        }

        pageToken = messageList.nextPageToken;

      } while (pageToken);

      // Mark as complete
      await ctx.run("complete-sync", async () => {
        const duration = Date.now() - parseInt(input.syncJobId.split('-').pop()!); // Extract timestamp from ID
        await adminDb.transact([
          adminDb.tx.syncJobs[syncJobId].update({
            status: "completed",
            completedAt: Date.now(),
            progress: {
              current: totalProcessed,
              total: totalProcessed,
              currentStep: "Completed",
              percentComplete: 100
            },
            stats: {
              messagesProcessed: totalProcessed,
              duration
            }
          })
        ]);
      });

      return { status: "completed", totalProcessed };
    }
  }
});