import * as restate from "@restatedev/restate-sdk";
import adminDb from "@/lib/instant_serverside_db";
import { id } from "@instantdb/admin";
import { calendarSyncWorkflow } from "../workflows/calendarSyncWorkflow";

// Define the calendar sync virtual object
export const calendarSyncObject = restate.object({
  name: "calendarSync",
  handlers: {
    startSync: async (ctx: restate.ObjectContext, req: { externalUserId: string }) => {
      const accountId = ctx.key;
      const { externalUserId } = req;
      
      console.log(`Starting calendar sync for account ${accountId}, user ${externalUserId}`);
      
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
            type: "calendar",
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
      const workflowId = `calendar-sync-${accountId}-${timestamp}`;
      const handle = await ctx.workflowSendClient(calendarSyncWorkflow, workflowId).run({
        accountId,
        externalUserId,
        syncJobId
      });
      
      // Update state
      ctx.set("activeWorkflowHandle", handle);
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
        (await ctx.get("activeWorkflowHandle")).cancel();
        
        // Clear state
        ctx.clear("activeWorkflowId");
        ctx.clear("activeSyncJobId");
        
        return { status: "cancelled", workflowId };
      }
      
      return { status: "no_active_sync" };
    },
    
    completeSync: async (ctx: restate.ObjectContext, req: { 
      totalEvents: number, 
      syncJobId: string 
    }) => {
      ctx.clear("activeWorkflowId");
      ctx.clear("activeSyncJobId");
      ctx.set("lastSyncComplete", await ctx.date.now());
      ctx.set("lastEventCount", req.totalEvents);
      
      return { status: "completed" };
    },
    
    getSyncStatus: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext) => {
        const accountId = ctx.key;
        const activeWorkflowId = await ctx.get<string>("activeWorkflowId");
        const activeSyncJobId = await ctx.get<string>("activeSyncJobId");
        const lastSyncStart = await ctx.get<number>("lastSyncStart");
        const lastSyncComplete = await ctx.get<number>("lastSyncComplete");
        const lastEventCount = await ctx.get<number>("lastEventCount");
        const primaryCalendarId = await ctx.get<string>("primaryCalendarId");
        const primaryCalendarName = await ctx.get<string>("primaryCalendarName");
        
        return {
          accountId,
          isActive: !!activeWorkflowId,
          activeWorkflowId,
          activeSyncJobId,
          lastSyncStart,
          lastSyncComplete,
          lastEventCount,
          primaryCalendarId,
          primaryCalendarName
        };
      }
    ),
  },
});