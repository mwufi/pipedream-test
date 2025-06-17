import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSyncClient, syncHelpers } from '@repo/sync-helpers';

// Initialize sync client
const syncClient = createSyncClient({
  pipedream: {
    projectId: process.env.PIPEDREAM_PROJECT_ID || '',
    clientId: process.env.PIPEDREAM_CLIENT_ID || '',
    clientSecret: process.env.PIPEDREAM_CLIENT_SECRET || '',
    environment: (process.env.PIPEDREAM_ENVIRONMENT as 'development' | 'production') || 'development'
  }
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    // const { userId } = await auth();
    const userId = 'test-user-123';
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get test type from query params
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('test') || 'accounts';

    switch (testType) {
      case 'accounts': {
        // Test: List user's connected accounts
        const accounts = await syncClient.getUserAccounts(userId);
        return NextResponse.json({
          test: 'getUserAccounts',
          userId,
          accounts: accounts.map(acc => ({
            id: acc.id,
            app: acc.app.name,
            email: acc.email,
            healthy: acc.healthy
          })),
          count: accounts.length
        });
      }

      case 'gmail-threads': {
        // Test: List Gmail threads
        const accounts = await syncClient.getUserAccounts(userId, 'gmail');
        if (accounts.length === 0) {
          return NextResponse.json({ 
            error: 'No Gmail accounts connected',
            hint: 'Connect a Gmail account via Pipedream first'
          }, { status: 400 });
        }

        const account = accounts[0];
        const threads = await syncHelpers.gmail.listThreads(
          syncClient,
          account.id,
          userId,
          { maxResults: 10 }
        );

        return NextResponse.json({
          test: 'gmail.listThreads',
          accountId: account.id,
          threads: threads.threads?.slice(0, 5), // First 5 threads
          totalThreads: threads.threads?.length || 0,
          nextPageToken: threads.nextPageToken
        });
      }

      case 'gmail-messages': {
        // Test: List Gmail messages
        const accounts = await syncClient.getUserAccounts(userId, 'gmail');
        if (accounts.length === 0) {
          return NextResponse.json({ 
            error: 'No Gmail accounts connected' 
          }, { status: 400 });
        }

        const account = accounts[0];
        const messageList = await syncHelpers.gmail.listMessages(
          syncClient,
          account.id,
          userId,
          { maxResults: 5 }
        );

        // Get details for first message
        let firstMessageDetails = null;
        if (messageList.messages && messageList.messages.length > 0) {
          firstMessageDetails = await syncHelpers.gmail.getMessage(
            syncClient,
            account.id,
            userId,
            messageList.messages[0].id,
            { format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] }
          );
        }

        return NextResponse.json({
          test: 'gmail.messages',
          accountId: account.id,
          messageCount: messageList.messages?.length || 0,
          firstMessage: firstMessageDetails,
          nextPageToken: messageList.nextPageToken
        });
      }

      case 'contacts': {
        // Test: List contacts
        const accounts = await syncClient.getUserAccounts(userId, 'google_contacts');
        if (accounts.length === 0) {
          return NextResponse.json({ 
            error: 'No Google Contacts account connected' 
          }, { status: 400 });
        }

        const account = accounts[0];
        const contacts = await syncHelpers.contacts.google.listContacts(
          syncClient,
          account.id,
          userId,
          { pageSize: 10 }
        );

        return NextResponse.json({
          test: 'contacts.google.listContacts',
          accountId: account.id,
          contactCount: contacts.connections?.length || 0,
          sampleContacts: contacts.connections?.slice(0, 3).map(c => ({
            name: c.names?.[0]?.displayName,
            email: c.emailAddresses?.[0]?.value
          })),
          totalPeople: contacts.totalPeople
        });
      }

      case 'calendar': {
        // Test: List calendars and events
        const accounts = await syncClient.getUserAccounts(userId, 'google_calendar');
        if (accounts.length === 0) {
          return NextResponse.json({ 
            error: 'No Google Calendar account connected' 
          }, { status: 400 });
        }

        const account = accounts[0];
        const calendars = await syncHelpers.calendar.google.listCalendars(
          syncClient,
          account.id,
          userId,
          { maxResults: 10 }
        );

        // Get events from primary calendar
        let events = null;
        const primaryCalendar = calendars.items?.find(cal => cal.primary);
        if (primaryCalendar) {
          events = await syncHelpers.calendar.google.listEvents(
            syncClient,
            account.id,
            userId,
            primaryCalendar.id,
            {
              maxResults: 5,
              timeMin: new Date().toISOString(),
              singleEvents: true,
              orderBy: 'startTime'
            }
          );
        }

        return NextResponse.json({
          test: 'calendar.google',
          accountId: account.id,
          calendarCount: calendars.items?.length || 0,
          primaryCalendar: primaryCalendar?.summary,
          upcomingEvents: events?.items?.map(e => ({
            summary: e.summary,
            start: e.start?.dateTime || e.start?.date,
            attendees: e.attendees?.length || 0
          }))
        });
      }

      case 'error-handling': {
        // Test: Error handling with invalid account
        try {
          await syncHelpers.gmail.listMessages(
            syncClient,
            'invalid-account-id',
            userId,
            { maxResults: 1 }
          );
          return NextResponse.json({ 
            error: 'Expected error but none was thrown' 
          });
        } catch (error: any) {
          return NextResponse.json({
            test: 'error-handling',
            errorType: error.constructor.name,
            errorCode: error.code,
            errorMessage: error.message,
            retryable: error.retryable,
            provider: error.provider
          });
        }
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid test type',
          availableTests: [
            'accounts',
            'gmail-threads',
            'gmail-messages',
            'contacts',
            'calendar',
            'error-handling'
          ]
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Test sync error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}