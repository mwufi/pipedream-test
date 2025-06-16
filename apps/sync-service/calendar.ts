#!/usr/bin/env bun

import { parseArgs } from "util";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

// const PIPEDREAM_API_KEY = process.env.PIPEDREAM_API_KEY;
// const PIPEDREAM_PROJECT_ID = process.env.PIPEDREAM_PROJECT_ID;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface Account {
  id: string;
  name: string;
  external_id: string;
  healthy: boolean;
  dead: boolean | null;
  app: {
    id: string;
    name_slug: string;
    name: string;
    auth_type: string;
    description: string;
    img_src: string;
    categories: string[];
  };
  created_at: string;
  updated_at: string;
}

interface Calendar {
  kind: string;
  etag: string;
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  colorId: string;
  backgroundColor: string;
  foregroundColor: string;
  selected?: boolean;
  accessRole: string;
  defaultReminders: Array<{ method: string; minutes: number }>;
  primary?: boolean;
}

interface CalendarEvent {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  creator: {
    email?: string;
    displayName?: string;
    self?: boolean;
  };
  organizer: {
    email?: string;
    displayName?: string;
    self?: boolean;
  };
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  endTimeUnspecified?: boolean;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  transparency?: string;
  visibility?: string;
  iCalUID: string;
  sequence?: number;
  attendees?: Array<{
    email: string;
    displayName?: string;
    organizer?: boolean;
    self?: boolean;
    resource?: boolean;
    optional?: boolean;
    responseStatus: string;
    comment?: string;
    additionalGuests?: number;
  }>;
  attendeesOmitted?: boolean;
  extendedProperties?: {
    private?: { [key: string]: string };
    shared?: { [key: string]: string };
  };
  hangoutLink?: string;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: { type: string };
      status: { statusCode: string };
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
      pin?: string;
      accessCode?: string;
      meetingCode?: string;
      passcode?: string;
      password?: string;
    }>;
    conferenceSolution?: {
      key: { type: string };
      name: string;
      iconUri: string;
    };
    conferenceId?: string;
    signature?: string;
    notes?: string;
  };
  gadget?: {
    type: string;
    title?: string;
    link?: string;
    iconLink?: string;
    width?: number;
    height?: number;
    display?: string;
    preferences?: { [key: string]: string };
  };
  anyoneCanAddSelf?: boolean;
  guestsCanInviteOthers?: boolean;
  guestsCanModify?: boolean;
  guestsCanSeeOtherGuests?: boolean;
  privateCopy?: boolean;
  locked?: boolean;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  source?: {
    url: string;
    title: string;
  };
  attachments?: Array<{
    fileUrl: string;
    title: string;
    mimeType?: string;
    iconLink?: string;
    fileId?: string;
  }>;
  eventType?: string;
}

interface ProcessedEvent {
  id: string;
  calendarId: string;
  calendarName: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date | string;
  end: Date | string;
  allDay: boolean;
  status: string;
  organizer?: {
    email?: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  recurrence?: string[];
  recurringEventId?: string;
  htmlLink: string;
  created: Date;
  updated: Date;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to unwrap proxy API responses
function unwrapProxyResponse(response: any): any {
  // If response has a data property with status/statusText, it's wrapped
  if (response && response.data && response.status && response.statusText) {
    return response.data;
  }
  return response;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
        console.log(`Rate limit hit. Waiting ${waitTime / 1000} seconds...`);
        await sleep(waitTime);
        delay *= 2;
        continue;
      }

      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        console.log(`Request failed, retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
        delay *= 2;
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

async function getUserAccounts(userId: string): Promise<Account[]> {
  const response = await fetchWithRetry(
    `${BASE_URL}/api/pipedream/accounts`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-external-user-id': userId,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error Response: ${errorText}`);
    throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle paginated response structure
  if (data && data.data) {
    return data.data;
  }
  
  // Handle direct accounts array
  if (data && data.accounts) {
    return data.accounts;
  }
  
  console.error('Unexpected API response structure:', data);
  return [];
}

async function getCalendarList(userId: string, accountId: string): Promise<Calendar[]> {
  console.log(`Getting calendar list for account ${accountId}...`);
  
  const response = await fetchWithRetry(
    `${BASE_URL}/api/pipedream/proxy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: accountId,
        external_user_id: userId,
        target_url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        options: {
          method: 'GET',
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Calendar list error: ${errorText}`);
    throw new Error(`Failed to list calendars: ${response.statusText}`);
  }

  const responseData = await response.json();
  console.log('Calendar list response:', JSON.stringify(responseData, null, 2).substring(0, 500));
  
  const data = unwrapProxyResponse(responseData);
  
  if (!data || typeof data !== 'object') {
    console.error('Invalid calendar list response');
    return [];
  }
  
  return data.items || [];
}

async function getCalendarEvents(
  userId: string,
  accountId: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
  pageToken?: string
): Promise<{ events: CalendarEvent[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
    ...(pageToken && { pageToken }),
  });

  const response = await fetchWithRetry(
    `${BASE_URL}/api/pipedream/proxy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: accountId,
        external_user_id: userId,
        target_url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        options: {
          method: 'GET',
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get events: ${response.statusText}`);
  }

  const responseData = await response.json();
  const data = unwrapProxyResponse(responseData);
  
  return {
    events: data.items || [],
    nextPageToken: data.nextPageToken,
  };
}

function processEvent(event: CalendarEvent, calendarId: string, calendarName: string): ProcessedEvent {
  const allDay = !!(event.start.date && !event.start.dateTime);
  const start = event.start.dateTime ? new Date(event.start.dateTime) : event.start.date!;
  const end = event.end.dateTime ? new Date(event.end.dateTime) : event.end.date!;

  return {
    id: event.id,
    calendarId,
    calendarName,
    summary: event.summary || '(No title)',
    description: event.description,
    location: event.location,
    start,
    end,
    allDay,
    status: event.status,
    organizer: event.organizer ? {
      email: event.organizer.email,
      displayName: event.organizer.displayName,
    } : undefined,
    attendees: event.attendees?.map(a => ({
      email: a.email,
      displayName: a.displayName,
      responseStatus: a.responseStatus,
    })),
    recurrence: event.recurrence,
    recurringEventId: event.recurringEventId,
    htmlLink: event.htmlLink,
    created: new Date(event.created),
    updated: new Date(event.updated),
    reminders: event.reminders,
    conferenceData: event.conferenceData ? {
      entryPoints: event.conferenceData.entryPoints?.map(ep => ({
        entryPointType: ep.entryPointType,
        uri: ep.uri,
      })),
    } : undefined,
  };
}

async function* downloadCalendarEvents(
  userId: string,
  accountId: string,
  monthsInFuture: number = 3
): AsyncGenerator<ProcessedEvent> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + monthsInFuture);
  
  const timeMin = now.toISOString();
  const timeMax = futureDate.toISOString();

  console.log(`Fetching events from ${now.toLocaleDateString()} to ${futureDate.toLocaleDateString()}`);

  // Get all calendars
  console.log('Fetching calendar list...');
  const calendars = await getCalendarList(userId, accountId);
  console.log(`Found ${calendars.length} calendars`);

  let totalEvents = 0;

  for (const calendar of calendars) {
    console.log(`\nProcessing calendar: ${calendar.summary}`);
    let pageToken: string | undefined;
    let calendarEvents = 0;

    do {
      try {
        const { events, nextPageToken } = await getCalendarEvents(
          userId,
          accountId,
          calendar.id,
          timeMin,
          timeMax,
          pageToken
        );
        
        pageToken = nextPageToken;

        if (events.length === 0) {
          break;
        }

        for (const event of events) {
          const processedEvent = processEvent(event, calendar.id, calendar.summary);
          yield processedEvent;
          calendarEvents++;
          totalEvents++;

          if (totalEvents % 50 === 0) {
            console.log(`Total events processed: ${totalEvents}`);
          }
        }

        // Small delay to avoid rate limits
        await sleep(100);
      } catch (error) {
        console.error(`Error fetching events from calendar ${calendar.summary}:`, error);
        // Continue with next calendar
        break;
      }
    } while (pageToken);

    console.log(`  Found ${calendarEvents} events in ${calendar.summary}`);
  }

  console.log(`\nDownload complete. Total events: ${totalEvents}`);
}

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      email: {
        type: 'string',
        short: 'e',
      },
      output: {
        type: 'string',
        short: 'o',
        default: 'calendar.jsonl',
      },
      months: {
        type: 'string',
        short: 'm',
        default: '3',
      },
    },
    allowPositionals: true,
  });

  if (positionals.length === 0) {
    console.error('Usage: bun run sync-service/calendar.ts <user-id> --email <email> --output <output-file> --months <months-in-future>');
    process.exit(1);
  }

  const userId = positionals[0] as string;
  const targetEmail = values.email;
  const outputFile = values.output as string;
  const monthsInFuture = parseInt(values.months as string, 10);

  try {
    // Get user accounts
    console.log(`Fetching accounts for user: ${userId}`);
    const accounts = await getUserAccounts(userId);
    
    console.log(`Total accounts found: ${accounts.length}`);
    
    // Filter Google Calendar accounts
    const calendarAccounts = accounts.filter(acc => acc.app.name_slug === 'google_calendar');
    console.log(`Google Calendar accounts found: ${calendarAccounts.length}`);
    
    if (calendarAccounts.length === 0) {
      console.error('No Google Calendar accounts found for this user');
      process.exit(1);
    }

    console.log('\nAvailable Google Calendar accounts:');
    calendarAccounts.forEach((acc, index) => {
      console.log(`${index + 1}. ${acc.name} (ID: ${acc.id})`);
    });

    // Find the requested account
    let selectedAccount: Account | undefined;
    
    // If only one account, use it regardless of email match
    if (calendarAccounts.length === 1) {
      selectedAccount = calendarAccounts[0];
      if (targetEmail) {
        console.log(`\nNote: Using the only available account: ${selectedAccount.name}`);
      }
    } else if (targetEmail) {
      // Try to match by name or external_id
      selectedAccount = calendarAccounts.find(acc => 
        acc.name.toLowerCase().includes(targetEmail.toLowerCase()) ||
        acc.external_id?.toLowerCase().includes(targetEmail.toLowerCase())
      );
      
      if (!selectedAccount) {
        console.error(`\nGoogle Calendar account matching "${targetEmail}" not found`);
        console.error('Please use one of the account names listed above');
        process.exit(1);
      }
    } else {
      selectedAccount = calendarAccounts[0];
    }

    console.log(`\nUsing account: ${selectedAccount.name}`);
    console.log(`Output file: ${outputFile}`);
    console.log(`Time range: Next ${monthsInFuture} months`);
    console.log('Starting download...\n');

    // Create write stream
    const writeStream = createWriteStream(outputFile);
    
    // Download and write events
    const eventGenerator = downloadCalendarEvents(userId, selectedAccount.id, monthsInFuture);
    
    const readableStream = Readable.from(
      (async function* () {
        for await (const event of eventGenerator) {
          yield JSON.stringify(event) + '\n';
        }
      })()
    );

    await pipeline(readableStream, writeStream);
    
    console.log(`\nDownload complete! Events saved to ${outputFile}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}