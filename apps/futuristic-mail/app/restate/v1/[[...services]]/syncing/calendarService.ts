import * as restate from "@restatedev/restate-sdk";
import { apiService } from "../apiService";

// Google Calendar rate limiter key - shared across all Calendar operations
const CALENDAR_RATE_LIMITER = "google-calendar-api";

// Define the calendar sync virtual object
export const calendarSyncObject = restate.object({
  name: "calendarSync",
  handlers: {
    syncCalendar: async (ctx: restate.ObjectContext, req: { externalUserId: string }) => {
      const accountId = ctx.key;
      const { externalUserId } = req;
      
      console.log(`Starting calendar sync for account ${accountId}, user ${externalUserId}`);
      
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
        // List calendars using the API service with rate limiting
        const calendars = await ctx.serviceClient(apiService).fetch({
          accountId,
          externalUserId,
          url: "https://www.googleapis.com/calendar/v3/users/me/calendarList",
          options: {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          },
          rateLimiterKey: CALENDAR_RATE_LIMITER,
          tokensNeeded: 1
        });
        
        if (!calendars.items || calendars.items.length === 0) {
          console.log("No calendars found");
          return { status: "no_calendars", accountId };
        }
        
        console.log(`Found ${calendars.items.length} calendars`);
        
        // Find primary calendar
        const primaryCalendar = calendars.items.find(cal => cal.primary);
        if (!primaryCalendar) {
          console.log("No primary calendar found");
          return { status: "no_primary_calendar", accountId };
        }
        
        console.log(`Syncing events from primary calendar: ${primaryCalendar.summary}`);
        
        // Get events from primary calendar
        const now = new Date(await ctx.date.now());
        const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const events = await ctx.serviceClient(apiService).fetch({
          accountId,
          externalUserId,
          url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(primaryCalendar.id)}/events`,
          options: {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          },
          rateLimiterKey: CALENDAR_RATE_LIMITER,
          tokensNeeded: 1
        });
        
        if (!events.items || events.items.length === 0) {
          console.log("No events found");
          ctx.set("lastEventCount", 0);
        } else {
          console.log(`Found ${events.items.length} events`);
          
          // Process events
          for (const event of events.items) {
            const eventStart = event.start?.dateTime || event.start?.date;
            const eventEnd = event.end?.dateTime || event.end?.date;
            
            console.log(`📅 Event: ${event.summary || 'No title'}`);
            console.log(`   Start: ${eventStart || 'No start time'}`);
            console.log(`   End: ${eventEnd || 'No end time'}`);
            console.log(`   Attendees: ${event.attendees?.length || 0}`);
            console.log('---');
          }
          
          ctx.set("lastEventCount", events.items.length);
        }
        
        // Update sync metadata
        ctx.set("lastSyncComplete", new Date(await ctx.date.now()).toISOString());
        ctx.set("primaryCalendarId", primaryCalendar.id);
        ctx.set("primaryCalendarName", primaryCalendar.summary);
        
        return {
          status: "success",
          accountId,
          calendarsFound: calendars.items.length,
          eventsProcessed: events.items?.length || 0,
          nextSyncToken: events.nextSyncToken
        };
        
      } catch (error) {
        console.error("Calendar sync failed:", error);
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
        const lastEventCount = await ctx.get<number>("lastEventCount");
        const lastSyncError = await ctx.get<string>("lastSyncError");
        const primaryCalendarId = await ctx.get<string>("primaryCalendarId");
        const primaryCalendarName = await ctx.get<string>("primaryCalendarName");
        
        return {
          accountId,
          isSyncing,
          lastSyncStart,
          lastSyncComplete,
          lastEventCount,
          lastSyncError,
          primaryCalendarId,
          primaryCalendarName
        };
      }
    ),
  },
});