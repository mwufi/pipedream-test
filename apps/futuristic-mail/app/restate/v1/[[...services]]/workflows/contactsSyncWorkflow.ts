import * as restate from "@restatedev/restate-sdk";
import adminDb from "@/lib/instant_serverside_db";
import { id } from "@instantdb/admin";
import { apiService } from "../apiService";

interface Contact {
  resourceName?: string;
  etag?: string;
  names?: Array<{ displayName?: string; familyName?: string; givenName?: string }>;
  emailAddresses?: Array<{ value?: string; type?: string }>;
  phoneNumbers?: Array<{ value?: string; type?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
}

interface ContactsSyncInput {
  accountId: string;
  externalUserId: string;
  syncJobId: string;
}

export const contactsSyncWorkflow = restate.workflow({
  name: "contactsSyncWorkflow",
  handlers: {
    run: async (ctx: restate.WorkflowContext, input: ContactsSyncInput) => {
      const { accountId, externalUserId, syncJobId } = input;

      // Update sync job status
      await ctx.run("update-status-starting", async () => {
        await adminDb.transact([
          adminDb.tx.syncJobs[syncJobId].update({
            status: "running",
            progress: {
              current: 0,
              total: 0,
              currentStep: "Fetching contacts",
              percentComplete: 0
            }
          })
        ]);
      });

      let totalProcessed = 0;
      let pageToken: string | undefined;
      const allContacts: Contact[] = [];

      // First request to get total count
      const firstPage = await ctx.run("fetch-first-page", async () => {
        return await ctx.serviceClient(apiService).fetch({
          accountId,
          externalUserId,
          url: `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations&pageSize=100`,
          rateLimiterKey: "google-contacts-api",
          tokensNeeded: 1
        });
      });

      const totalContacts = firstPage.totalPeople || 100; // Default estimate

      // Update total in InstantDB
      await ctx.run("update-total", async () => {
        await adminDb.transact([
          adminDb.tx.syncJobs[syncJobId].update({
            progress: {
              total: totalContacts,
              current: 0,
              currentStep: "Processing contacts",
              percentComplete: 5
            }
          })
        ]);
      });

      // Process first page
      if (firstPage.connections && firstPage.connections.length > 0) {
        allContacts.push(...firstPage.connections);
        pageToken = firstPage.nextPageToken;
      }

      // Process remaining pages
      while (pageToken) {
        const response = await ctx.run(`fetch-page-${pageToken}`, async () => {
          return await ctx.serviceClient(apiService).fetch({
            accountId,
            externalUserId,
            url: `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations&pageSize=100&pageToken=${pageToken}`,
            rateLimiterKey: "google-contacts-api",
            tokensNeeded: 1
          });
        });

        if (response.connections && response.connections.length > 0) {
          allContacts.push(...response.connections);
        }

        pageToken = response.nextPageToken;
      }

      // Process contacts in batches
      const batchSize = 50;
      for (let i = 0; i < allContacts.length; i += batchSize) {
        const batch = allContacts.slice(i, i + batchSize);

        const contactRecords = batch.map((contact: Contact) => {
          const primaryName = contact.names?.[0];
          const primaryEmail = contact.emailAddresses?.find(e => e.type === 'primary') || contact.emailAddresses?.[0];
          const primaryPhone = contact.phoneNumbers?.find(p => p.type === 'primary') || contact.phoneNumbers?.[0];
          const primaryOrg = contact.organizations?.[0];

          return {
            id: id(),
            contactId: contact.resourceName || '',
            accountId,
            userId: externalUserId,
            name: primaryName?.displayName || `${primaryName?.givenName || ''} ${primaryName?.familyName || ''}`.trim() || 'Unknown',
            email: primaryEmail?.value || '',
            phone: primaryPhone?.value || '',
            organization: primaryOrg?.name || '',
            title: primaryOrg?.title || '',
            syncedAt: Date.now()
          };
        });

        await ctx.run(`store-contacts-batch-${i}`, async () => {
          await adminDb.transact(
            contactRecords.map(contact =>
              adminDb.tx.contacts[contact.id].update(contact)
            )
          );
        });

        totalProcessed += batch.length;

        // Update progress
        await ctx.run(`update-progress-${totalProcessed}`, async () => {
          const percentComplete = Math.round((totalProcessed / totalContacts) * 100);
          await adminDb.transact([
            adminDb.tx.syncJobs[syncJobId].update({
              progress: {
                current: totalProcessed,
                total: totalContacts,
                currentStep: `Processed ${totalProcessed}/${totalContacts} contacts`,
                percentComplete: Math.min(percentComplete, 100)
              }
            })
          ]);
        });
      }

      // Mark as complete
      await ctx.run("complete-sync", async () => {
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
              contactsProcessed: totalProcessed,
              duration: Date.now() - parseInt(input.syncJobId.split('-').pop()!)
            }
          })
        ]);
      });

      return { status: "completed", totalProcessed };
    },
  }
});

function markCancelled(syncJobId: string) {
  return adminDb.transact([
    adminDb.tx.syncJobs[syncJobId].update({
      status: "cancelled",
      completedAt: Date.now()
    })
  ]);
}