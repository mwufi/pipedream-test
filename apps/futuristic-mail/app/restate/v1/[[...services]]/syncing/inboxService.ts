import * as restate from "@restatedev/restate-sdk";
import { createSyncClient, syncHelpers } from '@repo/sync-helpers';

// Initialize sync client
const syncClient = createSyncClient({
  pipedream: {
    projectId: process.env.PIPEDREAM_PROJECT_ID || '',
    clientId: process.env.PIPEDREAM_CLIENT_ID || '',
    clientSecret: process.env.PIPEDREAM_CLIENT_SECRET || '',
    environment: (process.env.PIPEDREAM_ENVIRONMENT as 'development' | 'production') || 'development'
  }
});

// Define the inbox sync virtual object
export const inboxSyncObject = restate.object({
  name: "inboxSync",
  handlers: {
    syncInbox: async (ctx: restate.ObjectContext, req: { externalUserId: string }) => {
      const accountId = ctx.key;
      const { externalUserId } = req;
      
      console.log(`Starting inbox sync for account ${accountId}, user ${externalUserId}`);
      
      // Get sync status to prevent concurrent syncs
      const isSyncing = await ctx.get<boolean>("isSyncing");
      if (isSyncing) {
        console.log("Sync already in progress, skipping");
        return { status: "already_syncing", accountId };
      }
      
      // Mark as syncing
      ctx.set("isSyncing", true);
      ctx.set("lastSyncStart", new Date().toISOString());
      
      try {
        // Get Gmail messages
        const messageList = await syncHelpers.gmail.listMessages(
          syncClient,
          accountId,
          externalUserId,
          { maxResults: 100 }
        );
        
        if (!messageList.messages || messageList.messages.length === 0) {
          console.log("No messages found");
          return { status: "no_messages", accountId };
        }
        
        console.log(`Found ${messageList.messages.length} messages to sync`);
        
        // Process each message
        for (const message of messageList.messages) {
          try {
            // Get message details
            const messageDetails = await syncHelpers.gmail.getMessage(
              syncClient,
              accountId,
              externalUserId,
              message.id,
              { format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] }
            );
            
            // Extract metadata
            const headers = messageDetails.payload?.headers || [];
            const fromHeader = headers.find(h => h.name === 'From');
            const subjectHeader = headers.find(h => h.name === 'Subject');
            const dateHeader = headers.find(h => h.name === 'Date');
            
            // Log the message details
            console.log(`📧 Message ID: ${message.id}`);
            console.log(`   Title: ${subjectHeader?.value || 'No subject'}`);
            console.log(`   Date: ${dateHeader?.value || 'No date'}`);
            console.log(`   Sender: ${fromHeader?.value || 'Unknown sender'}`);
            console.log('---');
            
          } catch (error) {
            console.error(`Error processing message ${message.id}:`, error);
          }
        }
        
        // Update sync metadata
        ctx.set("lastSyncComplete", new Date().toISOString());
        ctx.set("lastMessageCount", messageList.messages.length);
        
        return {
          status: "success",
          accountId,
          messagesProcessed: messageList.messages.length,
          nextPageToken: messageList.nextPageToken
        };
        
      } catch (error) {
        console.error("Sync failed:", error);
        ctx.set("lastSyncError", error instanceof Error ? error.message : 'Unknown error');
        return {
          status: "error",
          accountId,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      } finally {
        // Always clear the syncing flag
        ctx.set("isSyncing", false);
      }
    },
    
    getSyncStatus: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext) => {
        const accountId = ctx.key;
        const isSyncing = await ctx.get<boolean>("isSyncing") ?? "false";
        const lastSyncStart = await ctx.get<string>("lastSyncStart");
        const lastSyncComplete = await ctx.get<string>("lastSyncComplete");
        const lastMessageCount = await ctx.get<number>("lastMessageCount");
        const lastSyncError = await ctx.get<string>("lastSyncError");
        
        return {
          accountId,
          isSyncing,
          lastSyncStart,
          lastSyncComplete,
          lastMessageCount,
          lastSyncError
        };
      }
    ),
  },
});
