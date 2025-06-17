/**
 * Gmail provider exports
 */

export * from './types';
export * from './messages';
export * from './threads';

// Re-export commonly used functions with gmail namespace
import * as messages from './messages';
import * as threads from './threads';

export const gmail = {
  // Message operations
  listMessages: messages.listMessages,
  getMessage: messages.getMessage,
  batchGetMessages: messages.batchGetMessages,
  fetchAllMessages: messages.fetchAllMessages,
  sendMessage: messages.sendMessage,
  deleteMessage: messages.deleteMessage,
  modifyMessageLabels: messages.modifyMessageLabels,
  
  // Thread operations
  listThreads: threads.listThreads,
  getThread: threads.getThread,
  fetchAllThreads: threads.fetchAllThreads,
  deleteThread: threads.deleteThread,
  modifyThreadLabels: threads.modifyThreadLabels,
  getHistory: threads.getHistory
};