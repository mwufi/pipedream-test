import { describe, it, expect, jest } from '@jest/globals';
import { createSyncClient } from '../core/client';
import { gmail } from '../providers/gmail';

describe('Gmail Provider', () => {
  const mockClient = createSyncClient({
    pipedream: {
      projectId: 'test',
      clientId: 'test',
      clientSecret: 'test',
      environment: 'development'
    }
  });

  // Mock the makeProxyRequest method
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listMessages', () => {
    it('should list messages with proper parameters', async () => {
      const mockResponse = {
        messages: [
          { id: 'msg1', threadId: 'thread1' },
          { id: 'msg2', threadId: 'thread2' }
        ],
        nextPageToken: 'token123'
      };

      jest.spyOn(mockClient, 'makeProxyRequest').mockResolvedValue(mockResponse);

      const result = await gmail.listMessages(
        mockClient,
        'account123',
        'user456',
        { maxResults: 50, query: 'is:unread' }
      );

      expect(result).toEqual(mockResponse);
      expect(mockClient.makeProxyRequest).toHaveBeenCalledWith({
        accountId: 'account123',
        externalUserId: 'user456',
        targetUrl: expect.stringContaining('https://gmail.googleapis.com/gmail/v1/users/me/messages'),
        options: { method: 'GET' }
      });
    });
  });

  describe('getMessage', () => {
    it('should fetch a single message', async () => {
      const mockMessage = {
        id: 'msg1',
        threadId: 'thread1',
        labelIds: ['INBOX'],
        payload: {
          headers: [
            { name: 'From', value: 'test@example.com' },
            { name: 'Subject', value: 'Test Email' }
          ]
        }
      };

      jest.spyOn(mockClient, 'makeProxyRequest').mockResolvedValue(mockMessage);

      const result = await gmail.getMessage(
        mockClient,
        'account123',
        'user456',
        'msg1',
        { format: 'full' }
      );

      expect(result).toEqual(mockMessage);
      expect(mockClient.makeProxyRequest).toHaveBeenCalledWith({
        accountId: 'account123',
        externalUserId: 'user456',
        targetUrl: expect.stringContaining('messages/msg1'),
        options: { method: 'GET' }
      });
    });
  });
});