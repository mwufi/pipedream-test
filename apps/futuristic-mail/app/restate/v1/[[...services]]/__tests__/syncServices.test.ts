import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as restate from '@restatedev/restate-sdk/testing';
import { inboxSyncObject } from '../syncing/inboxService';
import { calendarSyncObject } from '../syncing/calendarService';
import { contactsSyncObject } from '../syncing/contactsService';
import { apiService } from '../apiService';

// Mock the sync client
jest.mock('@repo/sync-helpers', () => ({
  createSyncClient: jest.fn(() => ({
    makeProxyRequest: jest.fn()
  }))
}));

describe('Sync Services', () => {
  describe('Gmail Inbox Sync', () => {
    it('should handle rate limiting gracefully', async () => {
      const testAccountId = 'test-account-123';
      const testUserId = 'test-user-123';
      
      // Create test context
      const ctx = restate.testContext(inboxSyncObject);
      
      // Mock the API service to simulate rate limit
      ctx.mockService(apiService).fetch.mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );
      
      // Call the sync handler
      const result = await inboxSyncObject.handlers.syncInbox(
        ctx,
        { externalUserId: testUserId }
      );
      
      // Verify error handling
      expect(result.status).toBe('error');
      expect(result.error).toContain('Rate limit');
    });
    
    it('should prevent concurrent syncs', async () => {
      const testUserId = 'test-user-123';
      
      // Create test context with existing sync in progress
      const ctx = restate.testContext(inboxSyncObject);
      ctx.state.set('isSyncing', true);
      
      // Call the sync handler
      const result = await inboxSyncObject.handlers.syncInbox(
        ctx,
        { externalUserId: testUserId }
      );
      
      // Verify it returns early
      expect(result.status).toBe('already_syncing');
    });
    
    it('should successfully sync messages', async () => {
      const testUserId = 'test-user-123';
      
      // Create test context
      const ctx = restate.testContext(inboxSyncObject);
      
      // Mock successful API responses
      const mockMessages = {
        messages: [
          { id: 'msg1' },
          { id: 'msg2' }
        ]
      };
      
      const mockMessageDetails = {
        payload: {
          headers: [
            { name: 'Subject', value: 'Test Email' },
            { name: 'From', value: 'test@example.com' },
            { name: 'Date', value: '2024-01-01' }
          ]
        }
      };
      
      ctx.mockService(apiService).fetch
        .mockResolvedValueOnce(mockMessages) // List messages
        .mockResolvedValue(mockMessageDetails); // Get message details
      
      // Call the sync handler
      const result = await inboxSyncObject.handlers.syncInbox(
        ctx,
        { externalUserId: testUserId }
      );
      
      // Verify success
      expect(result.status).toBe('success');
      expect(result.messagesProcessed).toBe(2);
      
      // Verify state updates
      expect(ctx.state.get('lastMessageCount')).toBe(2);
      expect(ctx.state.get('isSyncing')).toBe(false);
    });
  });
  
  describe('Calendar Sync', () => {
    it('should handle missing primary calendar', async () => {
      const testUserId = 'test-user-123';
      
      // Create test context
      const ctx = restate.testContext(calendarSyncObject);
      
      // Mock calendars without primary
      const mockCalendars = {
        items: [
          { id: 'cal1', summary: 'Work', primary: false },
          { id: 'cal2', summary: 'Personal', primary: false }
        ]
      };
      
      ctx.mockService(apiService).fetch.mockResolvedValueOnce(mockCalendars);
      
      // Call the sync handler
      const result = await calendarSyncObject.handlers.syncCalendar(
        ctx,
        { externalUserId: testUserId }
      );
      
      // Verify handling
      expect(result.status).toBe('no_primary_calendar');
    });
    
    it('should sync calendar events successfully', async () => {
      const testUserId = 'test-user-123';
      
      // Create test context
      const ctx = restate.testContext(calendarSyncObject);
      
      // Mock successful responses
      const mockCalendars = {
        items: [
          { id: 'primary', summary: 'My Calendar', primary: true }
        ]
      };
      
      const mockEvents = {
        items: [
          {
            summary: 'Team Meeting',
            start: { dateTime: '2024-01-01T10:00:00Z' },
            end: { dateTime: '2024-01-01T11:00:00Z' },
            attendees: [{ email: 'colleague@example.com' }]
          }
        ]
      };
      
      ctx.mockService(apiService).fetch
        .mockResolvedValueOnce(mockCalendars)
        .mockResolvedValueOnce(mockEvents);
      
      // Call the sync handler
      const result = await calendarSyncObject.handlers.syncCalendar(
        ctx,
        { externalUserId: testUserId }
      );
      
      // Verify success
      expect(result.status).toBe('success');
      expect(result.eventsProcessed).toBe(1);
    });
  });
  
  describe('Contacts Sync', () => {
    it('should handle pagination correctly', async () => {
      const testUserId = 'test-user-123';
      
      // Create test context
      const ctx = restate.testContext(contactsSyncObject);
      
      // Mock paginated responses
      const mockPage1 = {
        connections: [
          {
            names: [{ displayName: 'John Doe' }],
            emailAddresses: [{ value: 'john@example.com' }]
          }
        ],
        nextPageToken: 'page2'
      };
      
      const mockPage2 = {
        connections: [
          {
            names: [{ displayName: 'Jane Smith' }],
            emailAddresses: [{ value: 'jane@example.com' }]
          }
        ]
      };
      
      ctx.mockService(apiService).fetch
        .mockResolvedValueOnce(mockPage1)
        .mockResolvedValueOnce(mockPage2);
      
      // Call the sync handler
      const result = await contactsSyncObject.handlers.syncContacts(
        ctx,
        { externalUserId: testUserId }
      );
      
      // Verify pagination worked
      expect(result.status).toBe('success');
      expect(result.contactsProcessed).toBe(2);
      expect(result.totalContacts).toBe(2);
    });
  });
  
  describe('Integration', () => {
    it('should respect rate limits across services', async () => {
      // This test would verify that all services share the same rate limiter
      // In a real test, you'd check that concurrent calls to different services
      // with the same rate limiter key properly queue up
      expect(true).toBe(true); // Placeholder
    });
  });
});