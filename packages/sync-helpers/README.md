# @repo/sync-helpers

Clean, functional sync helpers for Pipedream integration. This package provides a type-safe, testable abstraction over Pipedream's Connect API Proxy.

## Installation

```bash
npm install @repo/sync-helpers
```

## Quick Start

```typescript
import { createSyncClient, syncHelpers } from '@repo/sync-helpers';

// Initialize the client
const client = createSyncClient({
  pipedream: {
    projectId: process.env.PIPEDREAM_PROJECT_ID!,
    clientId: process.env.PIPEDREAM_CLIENT_ID!,
    clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
    environment: 'production'
  }
});

// Fetch Gmail messages
const messages = await syncHelpers.gmail.listMessages(
  client,
  'account_123',     // Pipedream account ID
  'user_456',        // Your app's user ID
  { maxResults: 50 }
);

// Fetch contacts
for await (const contact of syncHelpers.contacts.google.fetchAllContacts(
  client,
  'account_123',
  'user_456'
)) {
  console.log(contact.names?.[0]?.displayName);
}
```

## Core Concepts

### Pure Functions
All functions are pure - they fetch data and return it without side effects:

```typescript
// ✅ Good: Pure function
const threads = await syncHelpers.gmail.fetchThreads(client, accountId, userId);

// ❌ Bad: This package doesn't do I/O
// await syncHelpers.gmail.saveThreadsToDatabase(threads);
```

### Explicit Dependencies
Always pass the client and IDs explicitly:

```typescript
// Client is passed in, not imported globally
const message = await syncHelpers.gmail.getMessage(
  client,      // Always pass the client
  accountId,   // Pipedream account ID
  userId,      // Your user ID
  messageId    // Message to fetch
);
```

### Error Handling
Rich error types for proper handling:

```typescript
import { RateLimitError, AuthenticationError } from '@repo/sync-helpers';

try {
  await syncHelpers.gmail.fetchMessages(client, accountId, userId);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof AuthenticationError) {
    console.log('User needs to reconnect their account');
  }
}
```

## API Reference

### Gmail

```typescript
// List messages
syncHelpers.gmail.listMessages(client, accountId, userId, options?)

// Get single message
syncHelpers.gmail.getMessage(client, accountId, userId, messageId, options?)

// Fetch all messages (async generator)
syncHelpers.gmail.fetchAllMessages(client, accountId, userId, options?)

// Send message
syncHelpers.gmail.sendMessage(client, accountId, userId, { raw: base64Message })

// List threads
syncHelpers.gmail.listThreads(client, accountId, userId, options?)

// Get history changes
syncHelpers.gmail.getHistory(client, accountId, userId, startHistoryId, options?)
```

### Google Contacts

```typescript
// List contacts
syncHelpers.contacts.google.listContacts(client, accountId, userId, options?)

// Get single contact
syncHelpers.contacts.google.getContact(client, accountId, userId, resourceName)

// Fetch all contacts (async generator)
syncHelpers.contacts.google.fetchAllContacts(client, accountId, userId, options?)

// Create contact
syncHelpers.contacts.google.createContact(client, accountId, userId, contact)

// Update contact
syncHelpers.contacts.google.updateContact(client, accountId, userId, resourceName, contact, updateFields)
```

### Google Calendar

```typescript
// List calendars
syncHelpers.calendar.google.listCalendars(client, accountId, userId, options?)

// List events
syncHelpers.calendar.google.listEvents(client, accountId, userId, calendarId, options?)

// Fetch all events (async generator)
syncHelpers.calendar.google.fetchAllEvents(client, accountId, userId, options?)

// Create event
syncHelpers.calendar.google.createEvent(client, accountId, userId, calendarId, event)
```

## Usage with Restate

This package is designed to work perfectly with Restate's durable execution:

```typescript
const emailSync = workflow({
  name: 'emailSync',
  
  async syncGmail(ctx: Context, accountId: string) {
    // Durably fetch messages
    const messages = await ctx.run('fetch-messages', async () => {
      const results = [];
      for await (const message of syncHelpers.gmail.fetchAllMessages(
        client, accountId, userId, { maxResults: 100 }
      )) {
        results.push(message);
      }
      return results;
    });
    
    // Process messages...
  }
});
```

## Testing

Mock the client for easy testing:

```typescript
const mockClient = {
  makeProxyRequest: jest.fn().mockResolvedValue({
    messages: [{ id: '123', threadId: '456' }]
  }),
  getUserAccounts: jest.fn().mockResolvedValue([
    { id: 'acc_123', app: { name_slug: 'gmail' } }
  ])
};

const messages = await syncHelpers.gmail.listMessages(
  mockClient as any,
  'account_123',
  'user_456'
);
```

## Rate Limiting

The package includes automatic retry logic with exponential backoff. For production use with Restate, implement higher-level rate limiting:

```typescript
// In your Restate service
if (!await rateLimiter.checkLimit()) {
  await ctx.sleep(60000); // Wait a minute
}

const messages = await syncHelpers.gmail.fetchMessages(...);
await rateLimiter.recordRequest();
```

## License

MIT