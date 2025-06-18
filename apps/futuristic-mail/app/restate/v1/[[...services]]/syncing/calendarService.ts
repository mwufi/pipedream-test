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
  etag?: string;
  updated?: string;
}

interface Calendar {
  id: string;
  summary?: string;
  primary?: boolean;
}

// Helper function to fetch events from a calendar
async function fetchCalendarEvents(
  ctx: restate.ObjectContext,
  accountId: string,
  externalUserId: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
  pageToken?: string
): Promise<{ items: CalendarEvent[]; nextPageToken?: string }> {
  let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?`;
  url += `timeMin=${timeMin}`;
  url += `&timeMax=${timeMax}`;
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
}

// Helper function to store events in database
async function storeEvents(
  events: CalendarEvent[],
  calendarId: string,
  accountId: string,
  userId: string
): Promise<void> {
  const eventRecords = events.map((event) => ({
    id: id(),
    eventId: event.id,
    calendarId,
    accountId,
    userId,
    summary: event.summary || '',
    description: event.description || '',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    attendees: event.attendees || [],
    location: event.location || '',
    etag: event.etag || '',
    updated: event.updated || '',
    syncedAt: Date.now()
  }));

  await adminDb.transact(
    eventRecords.map(event =>
      adminDb.tx.events[event.id].update(event)
    )
  );
}

// Helper function to delete events from database
async function deleteEventsFromCalendar(
  calendarId: string,
  accountId: string
): Promise<void> {
  const result = await adminDb.query({
    events: {
      $: {
        where: {
          and: [
            { accountId: accountId },
            { calendarId: calendarId }
          ]
        }
      }
    }
  });

  if (result.events && result.events.length > 0) {
    await adminDb.transact(
      result.events.map(event =>
        adminDb.tx.events[event.id].delete()
      )
    );
  }
}

// Define the Google Calendar virtual object
export const googleCalendarObject = restate.object({
  name: "Google_Calendar",
  handlers: {
    sync: async (ctx: restate.ObjectContext, req: {
      accountId: string;
      externalUserId: string;
      forceFullSync?: boolean;
      syncMonthsBack?: number;
      syncMonthsForward?: number;
    }) => {
      const { 
        accountId, 
        externalUserId, 
        forceFullSync,
        syncMonthsBack = 3,
        syncMonthsForward = 3
      } = req;
      const userId = ctx.key;

      // Get stored sync state
      const lastSyncedAt = await ctx.get<number>("lastSyncedAt");
      const isSyncing = await ctx.get<boolean>("isSyncing");
      const primaryCalendarId = await ctx.get<string>("primaryCalendarId");

      // Check if already syncing
      if (isSyncing) {
        console.log("[GoogleCalendar] Sync already in progress, returning current state");
        return {
          status: "already_syncing",
          lastSyncedAt,
          primaryCalendarId
        };
      }

      // Mark as syncing
      ctx.set("isSyncing", true);
      const syncStartTime = await ctx.date.now();

      try {
        let totalEventsProcessed = 0;

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
          ctx.clear("isSyncing");
          return { status: "no_calendars", totalEventsProcessed: 0 };
        }

        // Find primary calendar
        const primaryCalendar = calendars.items.find((cal: Calendar) => cal.primary);
        if (!primaryCalendar) {
          ctx.clear("isSyncing");
          return { status: "no_primary_calendar", totalEventsProcessed: 0 };
        }

        // Store primary calendar info
        ctx.set("primaryCalendarId", primaryCalendar.id);
        ctx.set("primaryCalendarName", primaryCalendar.summary || "Primary Calendar");

        // Calculate time range
        const timeMin = new Date();
        timeMin.setMonth(timeMin.getMonth() - syncMonthsBack);
        const timeMax = new Date();
        timeMax.setMonth(timeMax.getMonth() + syncMonthsForward);

        // If force full sync, clear existing events first
        if (forceFullSync) {
          await ctx.run("clear-existing-events", async () => {
            await deleteEventsFromCalendar(primaryCalendar.id, accountId);
          });
        }

        // Sync events from primary calendar
        let pageToken: string | undefined;
        let pageCount = 0;

        do {
          const eventsResponse = await ctx.run(`fetch-events-page-${pageCount}`, async () => {
            return await fetchCalendarEvents(
              ctx,
              accountId,
              externalUserId,
              primaryCalendar.id,
              timeMin.toISOString(),
              timeMax.toISOString(),
              pageToken
            );
          });

          if (eventsResponse.items && eventsResponse.items.length > 0) {
            await ctx.run(`store-events-page-${pageCount}`, async () => {
              await storeEvents(
                eventsResponse.items,
                primaryCalendar.id,
                accountId,
                userId
              );
            });

            totalEventsProcessed += eventsResponse.items.length;
          }

          pageToken = eventsResponse.nextPageToken;
          pageCount++;
        } while (pageToken);

        // Update sync state
        ctx.set("lastSyncedAt", syncStartTime);
        ctx.set("totalEventsLastSync", totalEventsProcessed);
        ctx.clear("isSyncing");

        return {
          status: "completed",
          totalEventsProcessed,
          primaryCalendarId: primaryCalendar.id,
          primaryCalendarName: primaryCalendar.summary || "Primary Calendar",
          lastSyncedAt: syncStartTime,
          syncType: forceFullSync ? "full" : "incremental"
        };

      } catch (error) {
        // Clear syncing flag on error
        ctx.clear("isSyncing");
        throw error;
      }
    },

    getSyncStatus: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext) => {
        const lastSyncedAt = await ctx.get<number>("lastSyncedAt");
        const isSyncing = await ctx.get<boolean>("isSyncing");
        const primaryCalendarId = await ctx.get<string>("primaryCalendarId");
        const primaryCalendarName = await ctx.get<string>("primaryCalendarName");
        const totalEventsLastSync = await ctx.get<number>("totalEventsLastSync");

        return {
          userId: ctx.key,
          isSyncing: !!isSyncing,
          lastSyncedAt,
          primaryCalendarId,
          primaryCalendarName,
          totalEventsLastSync,
          hasSyncedBefore: !!lastSyncedAt
        };
      }
    ),

    reset: async (ctx: restate.ObjectContext) => {
      // Clear all state for fresh sync
      ctx.clear("lastSyncedAt");
      ctx.clear("isSyncing");
      ctx.clear("primaryCalendarId");
      ctx.clear("primaryCalendarName");
      ctx.clear("totalEventsLastSync");

      return { status: "reset" };
    }
  },
});