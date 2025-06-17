/**
 * Gmail-specific types
 */

export interface GmailThread {
  id: string;
  historyId?: string;
  snippet?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: GmailMessagePayload;
  sizeEstimate?: number;
  historyId?: string;
  internalDate?: string;
  raw?: string;
}

export interface GmailMessagePayload {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailMessagePart;
  parts?: GmailMessagePart[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: {
    attachmentId?: string;
    size?: number;
    data?: string;
  };
  parts?: GmailMessagePart[];
}

export interface GmailListMessagesOptions {
  query?: string;
  pageToken?: string;
  maxResults?: number;
  labelIds?: string[];
  includeSpamTrash?: boolean;
}

export interface GmailListMessagesResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailListThreadsOptions {
  query?: string;
  pageToken?: string;
  maxResults?: number;
  labelIds?: string[];
  includeSpamTrash?: boolean;
}

export interface GmailListThreadsResponse {
  threads?: GmailThread[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailBatchGetMessagesResponse {
  messages: GmailMessage[];
}

export interface GmailFetchOptions {
  format?: 'minimal' | 'full' | 'raw' | 'metadata';
  metadataHeaders?: string[];
}

export interface GmailSyncState {
  historyId?: string;
  lastSyncTime?: Date;
}