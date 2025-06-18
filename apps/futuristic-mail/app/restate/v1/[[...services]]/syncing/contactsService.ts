import * as restate from "@restatedev/restate-sdk";
import { apiService } from "../apiService";

// Google Contacts rate limiter key - shared across all Contacts operations
const CONTACTS_RATE_LIMITER = "google-contacts-api";

// Define the contacts sync virtual object
export const contactsSyncObject = restate.object({
  name: "contactsSync",
  handlers: {
    syncContacts: async (ctx: restate.ObjectContext, req: { externalUserId: string }) => {
      const accountId = ctx.key;
      const { externalUserId } = req;
      
      console.log(`Starting contacts sync for account ${accountId}, user ${externalUserId}`);
      
      // Get sync status to prevent concurrent syncs
      const isSyncing = await ctx.get<boolean>("isSyncing");
      if (isSyncing) {
        console.log("Sync already in progress, skipping");
        return { status: "already_syncing", accountId };
      }
      
      // Mark as syncing
      ctx.set("isSyncing", true);
      ctx.set("lastSyncStart", new Date(await ctx.date.now()).toISOString());
      
      try {
        let syncedCount = 0;
        let pageToken: string | undefined;
        const allContacts: any[] = [];
        
        // Paginate through all contacts
        do {
          // List contacts using the API service with rate limiting
          const response = await ctx.serviceClient(apiService).fetch({
            accountId,
            externalUserId,
            url: "https://people.googleapis.com/v1/people/me/connections",
            options: {
              method: "GET",
              headers: {
                "Content-Type": "application/json"
              }
            },
            rateLimiterKey: CONTACTS_RATE_LIMITER,
            tokensNeeded: 1
          });
          
          if (response.connections && response.connections.length > 0) {
            allContacts.push(...response.connections);
            
            // Process each contact
            for (const contact of response.connections) {
              const names = contact.names || [];
              const emails = contact.emailAddresses || [];
              const phones = contact.phoneNumbers || [];
              const organizations = contact.organizations || [];
              
              const primaryName = names.find(n => n.metadata?.primary) || names[0];
              const primaryEmail = emails.find(e => e.metadata?.primary) || emails[0];
              const primaryOrg = organizations.find(o => o.metadata?.primary) || organizations[0];
              
              console.log(`👤 Contact: ${primaryName?.displayName || 'No name'}`);
              if (primaryEmail) {
                console.log(`   Email: ${primaryEmail.value}`);
              }
              if (primaryOrg) {
                console.log(`   Organization: ${primaryOrg.name || ''} ${primaryOrg.title ? `(${primaryOrg.title})` : ''}`);
              }
              if (phones.length > 0) {
                console.log(`   Phone: ${phones[0].value}`);
              }
              console.log('---');
            }
            
            syncedCount += response.connections.length;
          }
          
          pageToken = response.nextPageToken;
          
        } while (pageToken);
        
        console.log(`Total contacts synced: ${syncedCount}`);
        
        // Update sync metadata
        ctx.set("lastSyncComplete", new Date(await ctx.date.now()).toISOString());
        ctx.set("lastContactCount", syncedCount);
        ctx.set("totalContactsInSystem", allContacts.length);
        
        return {
          status: "success",
          accountId,
          contactsProcessed: syncedCount,
          totalContacts: allContacts.length
        };
        
      } catch (error) {
        console.error("Contacts sync failed:", error);
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
        const isSyncing = await ctx.get<boolean>("isSyncing") ?? false;
        const lastSyncStart = await ctx.get<string>("lastSyncStart");
        const lastSyncComplete = await ctx.get<string>("lastSyncComplete");
        const lastContactCount = await ctx.get<number>("lastContactCount");
        const totalContactsInSystem = await ctx.get<number>("totalContactsInSystem");
        const lastSyncError = await ctx.get<string>("lastSyncError");
        
        return {
          accountId,
          isSyncing,
          lastSyncStart,
          lastSyncComplete,
          lastContactCount,
          totalContactsInSystem,
          lastSyncError
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