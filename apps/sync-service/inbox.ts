#!/usr/bin/env bun

import { parseArgs } from "util";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const PIPEDREAM_API_KEY = process.env.PIPEDREAM_API_KEY;
const PIPEDREAM_PROJECT_ID = process.env.PIPEDREAM_PROJECT_ID;
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

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
      parts?: Array<{
        mimeType: string;
        body?: { data?: string };
      }>;
    }>;
    body?: { data?: string };
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

interface ProcessedMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  date: Date;
  snippet: string;
  body: string;
  labels: string[];
  sizeEstimate: number;
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
        const errorBody = await response.text();
        console.log(`Rate limit hit (429). Response: ${errorBody}`);
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
        console.log(`Waiting ${waitTime / 1000} seconds before retry...`);
        await sleep(waitTime);
        delay *= 2; // Exponential backoff
        continue;
      }

      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Check for rate limit errors in response body
      if (response.ok) {
        const clonedResponse = response.clone();
        try {
          const body = await clonedResponse.json();
          if (body.error && body.error.code === 429) {
            console.log(`Rate limit error in response body: ${JSON.stringify(body.error)}`);
            await sleep(delay);
            delay *= 2;
            if (i < maxRetries) continue;
          }
        } catch {
          // If JSON parsing fails, just return the response
        }
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        console.log(`Request failed (${error.message}), retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
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

async function getGmailMessages(
  userId: string,
  accountId: string,
  pageToken?: string,
  maxResults = 100
): Promise<{ messages: GmailMessage[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
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
        target_url: `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
        options: {
          method: 'GET',
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list messages: ${response.statusText}`);
  }

  const responseData = await response.json();
  const data = unwrapProxyResponse(responseData);
  return {
    messages: data.messages || [],
    nextPageToken: data.nextPageToken,
  };
}

async function getMessageDetails(
  userId: string,
  accountId: string,
  messageId: string
): Promise<GmailMessage> {
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
        target_url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        options: {
          method: 'GET',
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get message details: ${response.statusText}`);
  }

  const responseData = await response.json();
  return unwrapProxyResponse(responseData);
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

function parseEmailAddresses(headerValue: string): string[] {
  if (!headerValue) return [];
  return headerValue.split(',').map(email => email.trim()).filter(Boolean);
}

function extractBodyFromParts(parts: any[]): string {
  let textBody = '';
  let htmlBody = '';

  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.parts) {
      const extracted = extractBodyFromParts(part.parts);
      if (extracted) {
        return extracted;
      }
    }
  }

  return textBody || htmlBody;
}

function processMessage(message: GmailMessage): ProcessedMessage {
  const headers = message.payload.headers;
  const subject = getHeader(headers, 'Subject');
  const from = getHeader(headers, 'From');
  const to = parseEmailAddresses(getHeader(headers, 'To'));
  const cc = parseEmailAddresses(getHeader(headers, 'Cc'));
  const bcc = parseEmailAddresses(getHeader(headers, 'Bcc'));
  const date = new Date(parseInt(message.internalDate));

  let body = '';
  if (message.payload.parts) {
    body = extractBodyFromParts(message.payload.parts);
  } else if (message.payload.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  }

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    from,
    to,
    cc,
    bcc,
    date,
    snippet: message.snippet,
    body,
    labels: message.labelIds || [],
    sizeEstimate: message.sizeEstimate,
  };
}

async function* downloadInbox(
  userId: string,
  accountId: string,
  batchSize = 50,
  delayMs = 200
): AsyncGenerator<ProcessedMessage> {
  let pageToken: string | undefined;
  let totalProcessed = 0;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5;

  console.log('Starting inbox download...');

  do {
    try {
      const { messages, nextPageToken } = await getGmailMessages(userId, accountId, pageToken, batchSize);
      pageToken = nextPageToken;

      if (!messages || messages.length === 0) {
        console.log('No more messages to process');
        break;
      }

      console.log(`Processing batch of ${messages.length} messages...`);

      for (let i = 0; i < messages.length; i++) {
        try {
          const messageDetails = await getMessageDetails(userId, accountId, messages[i].id);
          const processedMessage = processMessage(messageDetails);
          yield processedMessage;
          
          totalProcessed++;
          consecutiveErrors = 0;
          
          if (totalProcessed % 10 === 0) {
            console.log(`Processed ${totalProcessed} messages...`);
          }

          // Add delay to avoid hitting rate limits
          // Gmail API quotas:
          // - 250 quota units per user per second
          // - messages.get costs 5 units
          // - So max ~50 messages/second, but we'll be conservative
          await sleep(delayMs);
        } catch (error) {
          console.error(`Error processing message ${messages[i].id}:`, error);
          consecutiveErrors++;
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            throw new Error(`Too many consecutive errors (${maxConsecutiveErrors})`);
          }
          
          // Skip this message and continue
          continue;
        }
      }
    } catch (error) {
      console.error('Error fetching message batch:', error);
      throw error;
    }
  } while (pageToken);

  console.log(`Download complete. Total messages processed: ${totalProcessed}`);
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
        default: 'inbox.jsonl',
      },
      batchSize: {
        type: 'string',
        short: 'b',
        default: '50',
      },
      delay: {
        type: 'string',
        short: 'd',
        default: '200',
      },
    },
    allowPositionals: true,
  });

  if (positionals.length === 0) {
    console.error('Usage: bun run sync-service/inbox.ts <user-id> --email <email> --output <output-file> --batchSize <size> --delay <ms>');
    console.error('\nOptions:');
    console.error('  --email, -e     Email address to sync');
    console.error('  --output, -o    Output file (default: inbox.jsonl)');
    console.error('  --batchSize, -b Batch size per request (default: 50, max: 100)');
    console.error('  --delay, -d     Delay between messages in ms (default: 200)');
    console.error('\nGmail API Rate Limits:');
    console.error('  - 250 quota units per user per second');
    console.error('  - messages.list costs 5 units');
    console.error('  - messages.get costs 5 units');
    console.error('  - Default settings: ~5 messages/second');
    process.exit(1);
  }

  const userId = positionals[0] as string;
  const targetEmail = values.email;
  const outputFile = values.output as string;
  const batchSize = Math.min(100, parseInt(values.batchSize as string, 10));
  const delayMs = parseInt(values.delay as string, 10);

  // if (!PIPEDREAM_API_KEY || !PIPEDREAM_PROJECT_ID) {
  //   console.error('Missing required environment variables: PIPEDREAM_API_KEY, PIPEDREAM_PROJECT_ID');
  //   process.exit(1);
  // }

  try {
    // Get user accounts
    console.log(`Fetching accounts for user: ${userId}`);
    const accounts = await getUserAccounts(userId);
    
    // Filter Gmail accounts
    const gmailAccounts = accounts.filter(acc => acc.app.name_slug === 'gmail');
    
    if (gmailAccounts.length === 0) {
      console.error('No Gmail accounts found for this user');
      process.exit(1);
    }

    console.log('\nAvailable Gmail accounts:');
    gmailAccounts.forEach((acc, index) => {
      console.log(`${index + 1}. ${acc.name} (ID: ${acc.id})`);
    });

    // Find the requested account
    let selectedAccount: Account | undefined;
    if (targetEmail) {
      selectedAccount = gmailAccounts.find(acc => 
        acc.name.toLowerCase().includes(targetEmail.toLowerCase())
      );
      
      if (!selectedAccount) {
        console.error(`\nGmail account "${targetEmail}" not found`);
        process.exit(1);
      }
    } else {
      // If no email specified, use the first account
      selectedAccount = gmailAccounts[0];
    }

    console.log(`\nUsing account: ${selectedAccount.name}`);
    console.log(`Output file: ${outputFile}`);
    console.log(`Batch size: ${batchSize} messages per request`);
    console.log(`Delay: ${delayMs}ms between messages (~${Math.floor(1000/delayMs)} messages/second)`);
    console.log('Starting download...\n');

    // Create write stream
    const writeStream = createWriteStream(outputFile);
    
    // Download and write messages
    const messageGenerator = downloadInbox(userId, selectedAccount.id, batchSize, delayMs);
    
    const readableStream = Readable.from(
      (async function* () {
        for await (const message of messageGenerator) {
          yield JSON.stringify(message) + '\n';
        }
      })()
    );

    await pipeline(readableStream, writeStream);
    
    console.log(`\nDownload complete! Messages saved to ${outputFile}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}