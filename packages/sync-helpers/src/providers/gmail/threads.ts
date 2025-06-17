/**
 * Gmail thread operations
 */

import { SyncClient } from '../../core/client';
import {
  GmailThread,
  GmailListThreadsOptions,
  GmailListThreadsResponse
} from './types';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

/**
 * List threads in the user's mailbox
 */
export async function listThreads(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  options?: GmailListThreadsOptions
): Promise<GmailListThreadsResponse> {
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

  const url = `${GMAIL_API_BASE}/users/me/threads?${params.toString()}`;

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
 * Get a single thread by ID
 */
export async function getThread(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  threadId: string,
  options?: {
    format?: 'minimal' | 'full' | 'metadata';
    metadataHeaders?: string[];
  }
): Promise<GmailThread> {
  const params = new URLSearchParams();
  
  if (options?.format) params.append('format', options.format);
  if (options?.metadataHeaders) {
    options.metadataHeaders.forEach(header => 
      params.append('metadataHeaders', header)
    );
  }

  const url = `${GMAIL_API_BASE}/users/me/threads/${threadId}?${params.toString()}`;

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
 * Fetch all threads with pagination (returns an async generator)
 */
export async function* fetchAllThreads(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  options?: Omit<GmailListThreadsOptions, 'pageToken'>
): AsyncGenerator<GmailThread, void, unknown> {
  let pageToken: string | undefined;

  do {
    const response = await listThreads(client, accountId, externalUserId, {
      ...options,
      pageToken
    });

    if (!response.threads || response.threads.length === 0) {
      break;
    }

    for (const thread of response.threads) {
      yield thread;
    }

    pageToken = response.nextPageToken;

    // Small delay to avoid rate limits
    await sleep(100);
  } while (pageToken);
}

/**
 * Delete a thread
 */
export async function deleteThread(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  threadId: string
): Promise<void> {
  const url = `${GMAIL_API_BASE}/users/me/threads/${threadId}`;

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
 * Modify thread labels
 */
export async function modifyThreadLabels(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  threadId: string,
  addLabelIds?: string[],
  removeLabelIds?: string[]
): Promise<GmailThread> {
  const url = `${GMAIL_API_BASE}/users/me/threads/${threadId}/modify`;

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

/**
 * Get history of changes since a history ID
 */
export async function getHistory(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  startHistoryId: string,
  options?: {
    labelId?: string;
    maxResults?: number;
    pageToken?: string;
    historyTypes?: Array<'messageAdded' | 'messageDeleted' | 'labelAdded' | 'labelRemoved'>;
  }
): Promise<{
  history?: Array<{
    id: string;
    messages?: Array<{ id: string; threadId: string }>;
    messagesAdded?: Array<{ message: { id: string; threadId: string; labelIds: string[] } }>;
    messagesDeleted?: Array<{ message: { id: string; threadId: string } }>;
  }>;
  nextPageToken?: string;
  historyId?: string;
}> {
  const params = new URLSearchParams();
  params.append('startHistoryId', startHistoryId);
  
  if (options?.labelId) params.append('labelId', options.labelId);
  if (options?.maxResults) params.append('maxResults', options.maxResults.toString());
  if (options?.pageToken) params.append('pageToken', options.pageToken);
  if (options?.historyTypes) {
    options.historyTypes.forEach(type => params.append('historyTypes', type));
  }

  const url = `${GMAIL_API_BASE}/users/me/history?${params.toString()}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'GET'
    }
  });
}

// Utility function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}