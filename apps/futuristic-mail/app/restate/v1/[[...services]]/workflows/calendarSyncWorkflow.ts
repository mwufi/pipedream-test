import * as restate from "@restatedev/restate-sdk";
import adminDb from "@/lib/instant_serverside_db";
import { id } from "@instantdb/admin";
import { apiService } from "../apiService";

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; responseStatus?: string }>;
  location?: string;
}

interface CalendarSyncInput {
  accountId: string;
  externalUserId: string;
  syncJobId: string;
}

export const calendarSyncWorkflow = restate.workflow({
  name: "calendarSyncWorkflow",
  handlers: {
    run: async (ctx: restate.WorkflowContext, input: CalendarSyncInput) => {
      const { accountId, externalUserId, syncJobId } = input;
      
      // Update sync job status
      await ctx.run("update-status-starting", async () => {
        await adminDb.transact([
          adminDb.tx.syncJobs[syncJobId].update({
            status: "running",
            progress: {
              current: 0,
              total: 0,
              currentStep: "Fetching calendar list",
              percentComplete: 0
            }
          })
        ]);
      });

      // Get list of calendars
      const calendars = await ctx.run("fetch-calendars", async () => {
        return await ctx.serviceClient(apiService).fetch({
          accountId,
          externalUserId,
          url: "https://www.googleapis.com/calendar/v3/users/me/calendarList",
          rateLimiterKey: "google-calendar-api",
          tokensNeeded: 1
        });
      });
      
      if (!calendars.items || calendars.items.length === 0) {
        await ctx.run("no-calendars", async () => {
          await adminDb.transact([
            adminDb.tx.syncJobs[syncJobId].update({
              status: "completed",
              completedAt: Date.now(),
              progress: {
                current: 0,
                total: 0,
                currentStep: "No calendars found",
                percentComplete: 100
              }
            })
          ]);
        });
        return { status: "no_calendars", totalProcessed: 0 };
      }

      // Find primary calendar
      const primaryCalendar = calendars.items.find(cal => cal.primary);
      if (!primaryCalendar) {
        await ctx.run("no-primary-calendar", async () => {
          await adminDb.transact([
            adminDb.tx.syncJobs[syncJobId].update({
              status: "completed",
              completedAt: Date.now(),
              progress: {
                current: 0,
                total: 0,
                currentStep: "No primary calendar found",
                percentComplete: 100
              }
            })
          ]);
        });
        return { status: "no_primary_calendar", totalProcessed: 0 };
      }

      // Update progress
      await ctx.run("update-fetching-events", async () => {
        await adminDb.transact([
          adminDb.tx.syncJobs[syncJobId].update({
            progress: {
              current: 0,
              total: 0,
              currentStep: `Fetching events from ${primaryCalendar.summary}`,
              percentComplete: 10
            }
          })
        ]);
      });

      let totalProcessed = 0;
      let pageToken: string | undefined;
      const allEvents: CalendarEvent[] = [];
      
      // Sync events from primary calendar
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 3); // 3 months ago
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 3); // 3 months ahead
      
      do {
        const eventsResponse = await ctx.run(`fetch-events-${pageToken || 'first'}`, async () => {
          let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(primaryCalendar.id)}/events?`;
          url += `timeMin=${timeMin.toISOString()}`;
          url += `&timeMax=${timeMax.toISOString()}`;
          url += `&singleEvents=true`;
          url += `&orderBy=startTime`;
          url += `&maxResults=100`;
          if (pageToken) url += `&pageToken=${pageToken}`;
          
          return await ctx.serviceClient(apiService).fetch({
            accountId,
            externalUserId,
            url,
            rateLimiterKey: "google-calendar-api",
            tokensNeeded: 1
          });
        });

        if (eventsResponse.items && eventsResponse.items.length > 0) {
          allEvents.push(...eventsResponse.items);
          
          // Store events in InstantDB
          const eventRecords = eventsResponse.items.map((event: CalendarEvent) => ({
            id: id(),
            eventId: event.id,
            calendarId: primaryCalendar.id,
            accountId,
            userId: externalUserId,
            summary: event.summary || '',
            description: event.description || '',
            start: event.start?.dateTime || event.start?.date || '',
            end: event.end?.dateTime || event.end?.date || '',
            attendees: event.attendees || [],
            location: event.location || '',
            syncedAt: Date.now()
          }));
          
          await ctx.run(`store-events-batch-${totalProcessed}`, async () => {
            await adminDb.transact(
              eventRecords.map(event => 
                adminDb.tx.events[event.id].update(event)
              )
            );
          });
          
          totalProcessed += eventsResponse.items.length;
          
          // Update progress
          await ctx.run(`update-progress-${totalProcessed}`, async () => {
            await adminDb.transact([
              adminDb.tx.syncJobs[syncJobId].update({
                progress: {
                  current: totalProcessed,
                  total: allEvents.length,
                  currentStep: `Processed ${totalProcessed} events`,
                  percentComplete: Math.min(90, Math.round((totalProcessed / 100) * 90))
                }
              })
            ]);
          });
        }
        
        pageToken = eventsResponse.nextPageToken;
        
      } while (pageToken);

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
              eventsProcessed: totalProcessed,
              duration: Date.now() - parseInt(input.syncJobId.split('-').pop()!)
            }
          })
        ]);
      });
      
      return { status: "completed", totalProcessed };
    }
  }
});