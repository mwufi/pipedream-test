#!/usr/bin/env tsx

/**
 * CLI test script for sync-helpers package
 * 
 * Usage:
 *   tsx test-cli.ts <userId> [test-type]
 * 
 * Test types: accounts, gmail, contacts, calendar
 */

import { createSyncClient, syncHelpers } from './src/index';

// Check for required environment variables
const requiredEnvVars = [
  'PIPEDREAM_PROJECT_ID',
  'PIPEDREAM_CLIENT_ID',
  'PIPEDREAM_CLIENT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please set up your .env file with Pipedream credentials');
    process.exit(1);
  }
}

// Get command line arguments
const [userId, testType = 'accounts'] = process.argv.slice(2);

if (!userId) {
  console.error('Usage: tsx test-cli.ts <userId> [test-type]');
  console.error('Test types: accounts, gmail, contacts, calendar');
  process.exit(1);
}

// Initialize sync client
const syncClient = createSyncClient({
  pipedream: {
    projectId: process.env.PIPEDREAM_PROJECT_ID!,
    clientId: process.env.PIPEDREAM_CLIENT_ID!,
    clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
    environment: (process.env.PIPEDREAM_ENVIRONMENT as 'development' | 'production') || 'development'
  }
});

async function runTests() {
  console.log(`🧪 Testing sync-helpers with user: ${userId}\n`);

  try {
    switch (testType) {
      case 'accounts': {
        console.log('📋 Testing: Get User Accounts');
        const accounts = await syncClient.getUserAccounts(userId);
        console.log(`Found ${accounts.length} accounts:`);
        accounts.forEach(acc => {
          console.log(`  - ${acc.app.name} (${acc.email || 'No email'}) - ${acc.healthy ? '✅' : '❌'}`);
        });
        break;
      }

      case 'gmail': {
        console.log('📧 Testing: Gmail Integration');
        const accounts = await syncClient.getUserAccounts(userId, 'gmail');
        
        if (accounts.length === 0) {
          console.log('❌ No Gmail accounts found. Please connect a Gmail account first.');
          return;
        }

        const account = accounts[0];
        console.log(`Using account: ${account.email}\n`);

        // Test 1: List threads
        console.log('1️⃣ Listing threads...');
        const threads = await syncHelpers.gmail.listThreads(
          syncClient,
          account.id,
          userId,
          { maxResults: 5 }
        );
        console.log(`Found ${threads.threads?.length || 0} threads`);

        // Test 2: List messages
        console.log('\n2️⃣ Listing messages...');
        const messages = await syncHelpers.gmail.listMessages(
          syncClient,
          account.id,
          userId,
          { maxResults: 3 }
        );
        console.log(`Found ${messages.messages?.length || 0} messages`);

        // Test 3: Get message details
        if (messages.messages && messages.messages.length > 0) {
          console.log('\n3️⃣ Getting first message details...');
          const message = await syncHelpers.gmail.getMessage(
            syncClient,
            account.id,
            userId,
            messages.messages[0].id,
            { format: 'metadata', metadataHeaders: ['From', 'Subject'] }
          );
          
          const fromHeader = message.payload?.headers?.find(h => h.name === 'From');
          const subjectHeader = message.payload?.headers?.find(h => h.name === 'Subject');
          
          console.log(`From: ${fromHeader?.value || 'Unknown'}`);
          console.log(`Subject: ${subjectHeader?.value || 'No subject'}`);
        }

        // Test 4: Async generator
        console.log('\n4️⃣ Testing async generator (first 3 messages)...');
        let count = 0;
        for await (const message of syncHelpers.gmail.fetchAllMessages(
          syncClient,
          account.id,
          userId,
          { maxResults: 3 }
        )) {
          count++;
          console.log(`  Message ${count}: ${message.snippet?.substring(0, 50)}...`);
        }
        break;
      }

      case 'contacts': {
        console.log('👥 Testing: Google Contacts');
        const accounts = await syncClient.getUserAccounts(userId, 'google_contacts');
        
        if (accounts.length === 0) {
          console.log('❌ No Google Contacts accounts found.');
          return;
        }

        const account = accounts[0];
        console.log(`Using account: ${account.email}\n`);

        const contacts = await syncHelpers.contacts.google.listContacts(
          syncClient,
          account.id,
          userId,
          { pageSize: 10 }
        );

        console.log(`Found ${contacts.connections?.length || 0} contacts:`);
        contacts.connections?.slice(0, 5).forEach(contact => {
          const name = contact.names?.[0]?.displayName || 'No name';
          const email = contact.emailAddresses?.[0]?.value || 'No email';
          console.log(`  - ${name} (${email})`);
        });
        break;
      }

      case 'calendar': {
        console.log('📅 Testing: Google Calendar');
        const accounts = await syncClient.getUserAccounts(userId, 'google_calendar');
        
        if (accounts.length === 0) {
          console.log('❌ No Google Calendar accounts found.');
          return;
        }

        const account = accounts[0];
        console.log(`Using account: ${account.email}\n`);

        // List calendars
        const calendars = await syncHelpers.calendar.google.listCalendars(
          syncClient,
          account.id,
          userId
        );

        console.log(`Found ${calendars.items?.length || 0} calendars:`);
        calendars.items?.forEach(cal => {
          console.log(`  - ${cal.summary} ${cal.primary ? '(Primary)' : ''}`);
        });

        // Get events from primary calendar
        const primaryCal = calendars.items?.find(c => c.primary);
        if (primaryCal) {
          console.log(`\nUpcoming events in ${primaryCal.summary}:`);
          
          const events = await syncHelpers.calendar.google.listEvents(
            syncClient,
            account.id,
            userId,
            primaryCal.id,
            {
              maxResults: 5,
              timeMin: new Date().toISOString(),
              singleEvents: true,
              orderBy: 'startTime'
            }
          );

          events.items?.forEach(event => {
            const start = event.start?.dateTime || event.start?.date;
            console.log(`  - ${event.summary} (${start})`);
          });
        }
        break;
      }

      default:
        console.log(`❌ Unknown test type: ${testType}`);
        console.log('Available types: accounts, gmail, contacts, calendar');
    }

    console.log('\n✅ Tests completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Test failed:');
    console.error(`Error: ${error.message}`);
    if (error.code) console.error(`Code: ${error.code}`);
    if (error.provider) console.error(`Provider: ${error.provider}`);
    if (error.retryable !== undefined) console.error(`Retryable: ${error.retryable}`);
    
    if (process.env.DEBUG) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the tests
runTests();