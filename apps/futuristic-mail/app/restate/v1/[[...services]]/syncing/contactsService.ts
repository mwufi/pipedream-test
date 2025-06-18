import * as restate from "@restatedev/restate-sdk";
import adminDb from "@/lib/instant_serverside_db";
import { id } from "@instantdb/admin";
import { fetchWithPipedreamProxy } from "../apiService";


interface Contact {
  resourceName?: string;
  etag?: string;
  names?: Array<{ displayName?: string; familyName?: string; givenName?: string }>;
  emailAddresses?: Array<{ value?: string; type?: string }>;
  phoneNumbers?: Array<{ value?: string; type?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
}

// Helper function to fetch contacts page
async function fetchContactsPage(
  ctx: restate.ObjectContext,
  accountId: string,
  externalUserId: string,
  pageToken?: string,
  pageSize: number = 100
): Promise<{ connections?: Contact[]; nextPageToken?: string; totalPeople?: number }> {
  let url = `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations&pageSize=${pageSize}`;
  if (pageToken) url += `&pageToken=${pageToken}`;

  return await fetchWithPipedreamProxy({
    accountId,
    externalUserId,
    url,
    rateLimiterKey: "google-contacts-api",
    tokensNeeded: 1
  });
}

// Helper function to store contacts in database
async function storeContacts(
  contacts: Contact[],
  accountId: string,
  userId: string
): Promise<void> {
  const contactRecords = contacts.map((contact) => {
    const primaryName = contact.names?.[0];
    const primaryEmail = contact.emailAddresses?.find(e => e.type === 'primary') || contact.emailAddresses?.[0];
    const primaryPhone = contact.phoneNumbers?.find(p => p.type === 'primary') || contact.phoneNumbers?.[0];
    const primaryOrg = contact.organizations?.[0];

    return {
      id: id(),
      contactId: contact.resourceName || '',
      accountId,
      userId,
      name: primaryName?.displayName || `${primaryName?.givenName || ''} ${primaryName?.familyName || ''}`.trim() || 'Unknown',
      email: primaryEmail?.value || '',
      phone: primaryPhone?.value || '',
      organization: primaryOrg?.name || '',
      title: primaryOrg?.title || '',
      etag: contact.etag || '',
      syncedAt: Date.now()
    };
  });

  await adminDb.transact(
    contactRecords.map(contact =>
      adminDb.tx.contacts[contact.id].update(contact)
    )
  );
}

// Helper function to clear all contacts for an account
async function clearAllContacts(accountId: string): Promise<void> {
  const result = await adminDb.query({
    contacts: {
      $: {
        where: {
          accountId: accountId
        }
      }
    }
  });

  if (result.contacts && result.contacts.length > 0) {
    await adminDb.transact(
      result.contacts.map(contact =>
        adminDb.tx.contacts[contact.id].delete()
      )
    );
  }
}

// Define the Google Contacts virtual object
export const googleContactsObject = restate.object({
  name: "Google_Contacts",
  handlers: {
    sync: async (ctx: restate.ObjectContext, req: {
      accountId: string;
      externalUserId: string;
      forceFullSync?: boolean;
    }) => {
      const { accountId, externalUserId, forceFullSync } = req;
      const userId = ctx.key;

      // Get stored sync state
      const lastSyncedAt = await ctx.get<number>("lastSyncedAt");
      const isSyncing = await ctx.get<boolean>("isSyncing");

      // Check if already syncing
      if (isSyncing) {
        console.log("\n\n[GoogleContacts] Sync already in progress, returning current state");
        // return {
        //   status: "already_syncing",
        //   lastSyncedAt
        // };
      }

      // Mark as syncing
      ctx.set("isSyncing", true);
      const syncStartTime = await ctx.date.now();

      try {
        let totalProcessed = 0;
        const allContacts: Contact[] = [];

        // If force full sync, clear existing contacts first
        if (forceFullSync) {
          await clearAllContacts(accountId);
        }

        // Fetch first page to get total count
        const firstPage = await fetchContactsPage(ctx, accountId, externalUserId);

        const totalContacts = firstPage.totalPeople || 0;
        ctx.set("totalContactsEstimate", totalContacts);

        // Process first page
        if (firstPage.connections && firstPage.connections.length > 0) {
          allContacts.push(...firstPage.connections);
        }

        // Fetch remaining pages
        let pageToken = firstPage.nextPageToken;
        let pageCount = 1;

        while (pageToken) {
          const response = await fetchContactsPage(ctx, accountId, externalUserId, pageToken);

          if (response.connections && response.connections.length > 0) {
            allContacts.push(...response.connections);
          }

          pageToken = response.nextPageToken;
          pageCount++;
        }

        // Process contacts in batches
        const batchSize = 50;
        for (let i = 0; i < allContacts.length; i += batchSize) {
          const batch = allContacts.slice(i, i + batchSize);

          await storeContacts(batch, accountId, userId);

          totalProcessed += batch.length;
        }

        // Update sync state
        ctx.set("lastSyncedAt", syncStartTime);
        ctx.set("totalContactsLastSync", totalProcessed);
        ctx.clear("isSyncing");

        return {
          status: "completed",
          totalContactsProcessed: totalProcessed,
          lastSyncedAt: syncStartTime,
          syncType: forceFullSync ? "full" : "incremental"
        };

      } catch (error) {
        // Clear syncing flag on error
        console.error(JSON.stringify(error, null, 2));
        ctx.clear("isSyncing");
        throw error;
      }
    },

    getSyncStatus: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext) => {
        const lastSyncedAt = await ctx.get<number>("lastSyncedAt");
        const isSyncing = await ctx.get<boolean>("isSyncing");
        const totalContactsLastSync = await ctx.get<number>("totalContactsLastSync");
        const totalContactsEstimate = await ctx.get<number>("totalContactsEstimate");

        return {
          userId: ctx.key,
          isSyncing: !!isSyncing,
          lastSyncedAt,
          totalContactsLastSync,
          totalContactsEstimate,
          hasSyncedBefore: !!lastSyncedAt
        };
      }
    ),

    searchContacts: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext, req: {
        query: string;
        accountId: string;
      }) => {
        const { query, accountId } = req;

        // Search in InstantDB
        const result = await adminDb.query({
          contacts: {
            $: {
              where: {
                and: [
                  { accountId: accountId },
                  { userId: ctx.key },
                  {
                    or: [
                      { name: { $like: `%${query}%` } },
                      { email: { $like: `%${query}%` } },
                      { organization: { $like: `%${query}%` } }
                    ]
                  }
                ],
                limit: 20
              }
            }
          }
        });

        return {
          query,
          results: result.contacts || [],
          count: result.contacts?.length || 0
        };
      }
    ),

    reset: async (ctx: restate.ObjectContext) => {
      // Clear all state for fresh sync
      ctx.clear("lastSyncedAt");
      ctx.clear("isSyncing");
      ctx.clear("totalContactsLastSync");
      ctx.clear("totalContactsEstimate");

      return { status: "reset" };
    }
  },
});