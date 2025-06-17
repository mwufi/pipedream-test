/**
 * Gmail message operations
 */

import { SyncClient } from '../../core/client';
import { SyncError } from '../../core/errors';
import {
  GmailMessage,
  GmailListMessagesOptions,
  GmailListMessagesResponse,
  GmailFetchOptions,
  GmailBatchGetMessagesResponse
} from './types';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

/**
 * List messages in the user's mailbox
 */
export async function listMessages(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  options?: GmailListMessagesOptions
): Promise<GmailListMessagesResponse> {
  const params = new URLSearchParams();
  
  if (options?.query) params.append('q', options.query);
  if (options?.pageToken) params.append('pageToken', options.pageToken);
  if (options?.maxResults) params.append('maxResults', options.maxResults.toString());
  if (options?.labelIds) {
    options.labelIds.forEach(labelId => params.append('labelIds', labelId));
  }
  if (options?.includeSpamTrash !== undefined) {
    params.append('includeSpamTrash', options.includeSpamTrash.toString());
  }

  const url = `${GMAIL_API_BASE}/users/me/messages?${params.toString()}`;

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
 * Get a single message by ID
 */
export async function getMessage(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  messageId: string,
  options?: GmailFetchOptions
): Promise<GmailMessage> {
  const params = new URLSearchParams();
  
  if (options?.format) params.append('format', options.format);
  if (options?.metadataHeaders) {
    options.metadataHeaders.forEach(header => 
      params.append('metadataHeaders', header)
    );
  }

  const url = `${GMAIL_API_BASE}/users/me/messages/${messageId}?${params.toString()}`;

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
 * Batch get messages (more efficient for multiple messages)
 */
export async function batchGetMessages(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  messageIds: string[],
  options?: GmailFetchOptions
): Promise<GmailMessage[]> {
  if (messageIds.length === 0) {
    return [];
  }

  // Gmail batch API has a limit, so we need to chunk
  const BATCH_SIZE = 100;
  const results: GmailMessage[] = [];

  for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
    const batch = messageIds.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(id => getMessage(client, accountId, externalUserId, id, options))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Fetch all messages with pagination (returns an async generator)
 */
export async function* fetchAllMessages(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  options?: Omit<GmailListMessagesOptions, 'pageToken'>
): AsyncGenerator<GmailMessage, void, unknown> {
  let pageToken: string | undefined;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;

  do {
    try {
      // List messages
      const listResponse = await listMessages(client, accountId, externalUserId, {
        ...options,
        pageToken
      });

      if (!listResponse.messages || listResponse.messages.length === 0) {
        break;
      }

      // Fetch full message details in batches
      const messageIds = listResponse.messages.map(m => m.id);
      const messages = await batchGetMessages(
        client,
        accountId,
        externalUserId,
        messageIds,
        { format: 'full' }
      );

      // Yield each message
      for (const message of messages) {
        yield message;
      }

      // Reset error counter on success
      consecutiveErrors = 0;
      pageToken = listResponse.nextPageToken;

      // Small delay to avoid rate limits
      await sleep(200);

    } catch (error) {
      consecutiveErrors++;
      
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        throw new SyncError(
          `Failed to fetch messages after ${MAX_CONSECUTIVE_ERRORS} consecutive errors`,
          'MAX_ERRORS_EXCEEDED',
          false,
          'gmail',
          error
        );
      }

      // Log error but continue
      console.error(`Error fetching messages (attempt ${consecutiveErrors}):`, error);
      
      // Wait before retrying
      await sleep(1000 * consecutiveErrors);
    }
  } while (pageToken);
}

/**
 * Send a message
 */
export async function sendMessage(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  message: {
    raw: string; // Base64 encoded RFC 2822 formatted message
    threadId?: string;
  }
): Promise<GmailMessage> {
  const url = `${GMAIL_API_BASE}/users/me/messages/send`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: message
    }
  });
}

/**
 * Delete a message
 */
export async function deleteMessage(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  messageId: string
): Promise<void> {
  const url = `${GMAIL_API_BASE}/users/me/messages/${messageId}`;

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
 * Modify message labels
 */
export async function modifyMessageLabels(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  messageId: string,
  addLabelIds?: string[],
  removeLabelIds?: string[]
): Promise<GmailMessage> {
  const url = `${GMAIL_API_BASE}/users/me/messages/${messageId}/modify`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        addLabelIds,
        removeLabelIds
      }
    }
  });
}

// Utility function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}