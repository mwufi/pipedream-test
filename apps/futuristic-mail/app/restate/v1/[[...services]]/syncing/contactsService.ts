import * as restate from "@restatedev/restate-sdk";
import adminDb from "@/lib/instant_serverside_db";
import { id } from "@instantdb/admin";
import { contactsSyncWorkflow } from "../workflows/contactsSyncWorkflow";

// Define the contacts sync virtual object
export const contactsSyncObject = restate.object({
  name: "contactsSync",
  handlers: {
    startSync: async (ctx: restate.ObjectContext, req: { externalUserId: string }) => {
      const accountId = ctx.key;
      const { externalUserId } = req;
      
      console.log(`Starting contacts sync for account ${accountId}, user ${externalUserId}`);
      
      // Check if already syncing
      const activeWorkflowId = await ctx.get<string>("activeWorkflowId");
      if (activeWorkflowId) {
        console.log("Sync already in progress, skipping");
        return { status: "already_syncing", workflowId: activeWorkflowId };
      }
      
      // Create sync job in InstantDB
      const syncJobId = id();
      const timestamp = Date.now();
      
      await ctx.run("create-sync-job", async () => {
        await adminDb.transact([
          adminDb.tx.syncJobs[syncJobId].update({
            id: syncJobId,
            accountId,
            userId: externalUserId,
            type: "contacts",
            status: "pending",
            workflowId: "",
            startedAt: timestamp,
            progress: {
              current: 0,
              total: 0,
              currentStep: "Initializing",
              percentComplete: 0
            }
          })
        ]);
      });
      
      // Start workflow
      const workflowId = `contacts-sync-${accountId}-${timestamp}`;
      await ctx.workflowSendClient(contactsSyncWorkflow, workflowId).run({
        accountId,
        externalUserId,
        syncJobId
      });
      
      // Update state
      ctx.set("activeWorkflowId", workflowId);
      ctx.set("activeSyncJobId", syncJobId);
      ctx.set("lastSyncStart", await ctx.date.now());
      
      // Update sync job with workflow ID
      await ctx.run("update-workflow-id", async () => {
        await adminDb.transact([
          adminDb.tx.syncJobs[syncJobId].update({
            workflowId
          })
        ]);
      });
      
      return { 
        status: "started", 
        workflowId,
        syncJobId 
      };
    },
    
    cancelSync: async (ctx: restate.ObjectContext) => {
      const workflowId = await ctx.get<string>("activeWorkflowId");
      const syncJobId = await ctx.get<string>("activeSyncJobId");
      
      if (workflowId) {
        // Cancel the workflow
        await ctx.workflowSendClient(contactsSyncWorkflow, workflowId).cancel();
        
        // Clear state
        ctx.clear("activeWorkflowId");
        ctx.clear("activeSyncJobId");
        
        return { status: "cancelled", workflowId };
      }
      
      return { status: "no_active_sync" };
    },
    
    completeSync: async (ctx: restate.ObjectContext, req: { 
      totalContacts: number, 
      syncJobId: string 
    }) => {
      ctx.clear("activeWorkflowId");
      ctx.clear("activeSyncJobId");
      ctx.set("lastSyncComplete", await ctx.date.now());
      ctx.set("lastContactCount", req.totalContacts);
      ctx.set("totalContactsInSystem", req.totalContacts);
      
      return { status: "completed" };
    },
    
    getSyncStatus: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext) => {
        const accountId = ctx.key;
        const activeWorkflowId = await ctx.get<string>("activeWorkflowId");
        const activeSyncJobId = await ctx.get<string>("activeSyncJobId");
        const lastSyncStart = await ctx.get<number>("lastSyncStart");
        const lastSyncComplete = await ctx.get<number>("lastSyncComplete");
        const lastContactCount = await ctx.get<number>("lastContactCount");
        const totalContactsInSystem = await ctx.get<number>("totalContactsInSystem");
        
        return {
          accountId,
          isActive: !!activeWorkflowId,
          activeWorkflowId,
          activeSyncJobId,
          lastSyncStart,
          lastSyncComplete,
          lastContactCount,
          totalContactsInSystem
        };
      }
    ),
    
    searchContacts: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext, req: { query: string }) => {
        // This could be enhanced to maintain a local search index
        // For now, it's a placeholder that could query stored contacts
        const accountId = ctx.key;
        console.log(`Searching contacts for "${req.query}" in account ${accountId}`);
        
        // In a real implementation, you'd search through stored contacts
        return {
          accountId,
          query: req.query,
          results: [],
          message: "Search functionality not yet implemented"
        };
      }
    ),
  },
});