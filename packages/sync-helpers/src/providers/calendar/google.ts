/**
 * Google Calendar operations
 */

import { SyncClient } from '../../core/client';
import { CalendarEvent } from '../../core/types';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export interface GoogleCalendar {
  id: string;
  summary?: string;
  description?: string;
  timeZone?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  accessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  primary?: boolean;
}

export interface GoogleCalendarListOptions {
  maxResults?: number;
  pageToken?: string;
  showDeleted?: boolean;
  showHidden?: boolean;
}

export interface GoogleCalendarListResponse {
  items?: GoogleCalendar[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export interface GoogleEventListOptions {
  calendarId?: string;
  maxResults?: number;
  pageToken?: string;
  showDeleted?: boolean;
  singleEvents?: boolean;
  timeMin?: string; // RFC3339 timestamp
  timeMax?: string; // RFC3339 timestamp
  updatedMin?: string; // RFC3339 timestamp
  orderBy?: 'startTime' | 'updated';
  q?: string; // Free text search
  syncToken?: string;
}

export interface GoogleEventListResponse {
  items?: CalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
  summary?: string;
  description?: string;
  updated?: string;
  timeZone?: string;
  accessRole?: string;
}

/**
 * List calendars
 */
export async function listCalendars(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  options?: GoogleCalendarListOptions
): Promise<GoogleCalendarListResponse> {
  const params = new URLSearchParams();
  
  if (options?.maxResults) params.append('maxResults', options.maxResults.toString());
  if (options?.pageToken) params.append('pageToken', options.pageToken);
  if (options?.showDeleted !== undefined) params.append('showDeleted', options.showDeleted.toString());
  if (options?.showHidden !== undefined) params.append('showHidden', options.showHidden.toString());

  const url = `${CALENDAR_API_BASE}/users/me/calendarList?${params.toString()}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'GET'
    }
  });
}

/**
 * Get a single calendar
 */
export async function getCalendar(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  calendarId: string
): Promise<GoogleCalendar> {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'GET'
    }
  });
}

/**
 * List events in a calendar
 */
export async function listEvents(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  calendarId: string,
  options?: Omit<GoogleEventListOptions, 'calendarId'>
): Promise<GoogleEventListResponse> {
  const params = new URLSearchParams();
  
  if (options?.maxResults) params.append('maxResults', options.maxResults.toString());
  if (options?.pageToken) params.append('pageToken', options.pageToken);
  if (options?.showDeleted !== undefined) params.append('showDeleted', options.showDeleted.toString());
  if (options?.singleEvents !== undefined) params.append('singleEvents', options.singleEvents.toString());
  if (options?.timeMin) params.append('timeMin', options.timeMin);
  if (options?.timeMax) params.append('timeMax', options.timeMax);
  if (options?.updatedMin) params.append('updatedMin', options.updatedMin);
  if (options?.orderBy) params.append('orderBy', options.orderBy);
  if (options?.q) params.append('q', options.q);
  if (options?.syncToken) params.append('syncToken', options.syncToken);

  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'GET'
    }
  });
}

/**
 * Get a single event
 */
export async function getEvent(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  calendarId: string,
  eventId: string
): Promise<CalendarEvent> {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'GET'
    }
  });
}

/**
 * Create an event
 */
export async function createEvent(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  calendarId: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: event
    }
  });
}

/**
 * Update an event
 */
export async function updateEvent(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: event
    }
  });
}

/**
 * Delete an event
 */
export async function deleteEvent(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

  await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'DELETE'
    }
  });
}

/**
 * Fetch all events from all calendars (returns an async generator)
 */
export async function* fetchAllEvents(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  options?: {
    calendarId?: string; // If provided, only fetch from this calendar
    timeMin?: string;
    timeMax?: string;
    showDeleted?: boolean;
    singleEvents?: boolean;
  }
): AsyncGenerator<{ calendar: GoogleCalendar; event: CalendarEvent }, void, unknown> {
  // If specific calendar is provided, only fetch from that
  if (options?.calendarId) {
    const calendar = await getCalendar(client, accountId, externalUserId, options.calendarId);
    
    let pageToken: string | undefined;
    do {
      const response = await listEvents(client, accountId, externalUserId, options.calendarId, {
        ...options,
        pageToken,
        maxResults: 100
      });

      if (!response.items || response.items.length === 0) {
        break;
      }

      for (const event of response.items) {
        yield { calendar, event };
      }

      pageToken = response.nextPageToken;
      await sleep(100);
    } while (pageToken);
    
    return;
  }

  // Otherwise, fetch from all calendars
  const calendars = await fetchAllCalendars(client, accountId, externalUserId);
  
  for (const calendar of calendars) {
    // Skip calendars user doesn't have read access to
    if (!calendar.accessRole || calendar.accessRole === 'freeBusyReader') {
      continue;
    }

    let pageToken: string | undefined;
    do {
      try {
        const response = await listEvents(client, accountId, externalUserId, calendar.id, {
          ...options,
          pageToken,
          maxResults: 100
        });

        if (!response.items || response.items.length === 0) {
          break;
        }

        for (const event of response.items) {
          yield { calendar, event };
        }

        pageToken = response.nextPageToken;
        await sleep(100);
      } catch (error: any) {
        // Skip calendars that error (might not have permission)
        console.error(`Error fetching events from calendar ${calendar.id}:`, error.message);
        break;
      }
    } while (pageToken);
  }
}

/**
 * Fetch all calendars
 */
async function fetchAllCalendars(
  client: SyncClient,
  accountId: string,
  externalUserId: string
): Promise<GoogleCalendar[]> {
  const calendars: GoogleCalendar[] = [];
  let pageToken: string | undefined;

  do {
    const response = await listCalendars(client, accountId, externalUserId, {
      pageToken,
      maxResults: 100
    });

    if (response.items) {
      calendars.push(...response.items);
    }

    pageToken = response.nextPageToken;
  } while (pageToken);

  return calendars;
}

// Utility function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}