/**
 * Core types for sync-helpers package
 */

export interface SyncClientConfig {
  pipedream: {
    projectId: string;
    clientId: string;
    clientSecret: string;
    environment: 'development' | 'production';
  };
}

export interface ProxyRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

export interface ProxyRequest {
  accountId: string;
  externalUserId: string;
  targetUrl: string;
  options?: ProxyRequestOptions;
}

export interface ProxyResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
}

export interface PipedreamAccount {
  id: string;
  app: {
    id: string;
    name: string;
    name_slug: string;
  };
  email?: string;
  name?: string;
  external_id?: string;
  healthy?: boolean;
  dead?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FetchOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

export interface PaginationOptions {
  pageSize?: number;
  pageToken?: string;
  maxResults?: number;
}

// Provider-specific types
export interface Thread {
  id: string;
  historyId?: string;
  snippet?: string;
}

export interface Message {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: any;
  internalDate?: string;
}

export interface Contact {
  resourceName: string;
  etag?: string;
  names?: Array<{
    displayName?: string;
    familyName?: string;
    givenName?: string;
  }>;
  emailAddresses?: Array<{
    value: string;
    type?: string;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
  }>;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}