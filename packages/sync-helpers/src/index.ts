/**
 * Sync Helpers - Clean, functional sync helpers for Pipedream integration
 */

// Core exports
export { SyncClient, createSyncClient } from './core/client';
export * from './core/types';
export * from './core/errors';

// Provider exports
import { gmail } from './providers/gmail';
import * as googleContacts from './providers/contacts/google';
import * as googleCalendar from './providers/calendar/google';

// Create namespace exports for clean API
export const syncHelpers = {
  gmail,
  contacts: {
    google: googleContacts
  },
  calendar: {
    google: googleCalendar
  }
};

// Also export providers directly for flexibility
export { gmail } from './providers/gmail';
export * as googleContacts from './providers/contacts/google';
export * as googleCalendar from './providers/calendar/google';

// Export types from providers
export type {
  GmailMessage,
  GmailThread,
  GmailListMessagesOptions,
  GmailListThreadsOptions,
  GmailFetchOptions
} from './providers/gmail';

export type {
  GoogleContactsListOptions,
  GoogleContactsListResponse
} from './providers/contacts/google';

export type {
  GoogleCalendar,
  GoogleCalendarListOptions,
  GoogleEventListOptions,
  GoogleEventListResponse
} from './providers/calendar/google';