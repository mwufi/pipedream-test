import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const syncStatusEnum = pgEnum('sync_status', ['pending', 'processing', 'completed', 'failed'])
export const emailCategoryEnum = pgEnum('email_category', ['inbox', 'sent', 'draft', 'spam', 'trash', 'important', 'starred'])
export const sentimentEnum = pgEnum('sentiment', ['positive', 'negative', 'neutral', 'mixed'])

// Users table - integrates with Clerk
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  settings: jsonb('settings').default({}),
  features: jsonb('features').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}))

// Connected accounts via Pipedream
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pipedreamAccountId: text('pipedream_account_id').notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(), // 'google'
  scopes: jsonb('scopes').default([]),
  isActive: boolean('is_active').default(true),
  lastSyncedAt: timestamp('last_synced_at'),
  syncState: jsonb('sync_state').default({}), // Store sync tokens, etc
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
  pipedreamAccountIdIdx: uniqueIndex('accounts_pipedream_account_id_idx').on(table.pipedreamAccountId),
}))

// Emails table - partitioned by user_id and date
export const emails = pgTable('emails', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  gmailId: text('gmail_id').notNull(),
  threadId: text('thread_id').notNull(),
  
  // Message details
  subject: text('subject'),
  snippet: text('snippet'),
  body: text('body'),
  htmlBody: text('html_body'),
  
  // Participants
  from: jsonb('from').notNull(), // { email: string, name?: string }
  to: jsonb('to').default([]), // Array of { email: string, name?: string }
  cc: jsonb('cc').default([]),
  bcc: jsonb('bcc').default([]),
  
  // Metadata
  category: emailCategoryEnum('category'),
  labels: jsonb('labels').default([]),
  isRead: boolean('is_read').default(false),
  isStarred: boolean('is_starred').default(false),
  isImportant: boolean('is_important').default(false),
  hasAttachments: boolean('has_attachments').default(false),
  attachments: jsonb('attachments').default([]),
  
  // AI fields
  aiSummary: text('ai_summary'),
  aiCategory: text('ai_category'),
  aiSentiment: sentimentEnum('ai_sentiment'),
  aiExtractedData: jsonb('ai_extracted_data').default({}),
  aiEmbedding: jsonb('ai_embedding'), // Will store vector for semantic search
  
  // Timestamps
  sentAt: timestamp('sent_at'),
  receivedAt: timestamp('received_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('emails_user_id_idx').on(table.userId),
  accountIdIdx: index('emails_account_id_idx').on(table.accountId),
  threadIdIdx: index('emails_thread_id_idx').on(table.threadId),
  gmailIdIdx: uniqueIndex('emails_gmail_id_idx').on(table.gmailId, table.accountId),
  sentAtIdx: index('emails_sent_at_idx').on(table.sentAt),
}))

// Threads table - for grouping emails
export const threads = pgTable('threads', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  gmailThreadId: text('gmail_thread_id').notNull(),
  subject: text('subject'),
  snippet: text('snippet'),
  participants: jsonb('participants').default([]), // All unique participants
  messageCount: integer('message_count').default(0),
  hasAttachments: boolean('has_attachments').default(false),
  isRead: boolean('is_read').default(false),
  isStarred: boolean('is_starred').default(false),
  isImportant: boolean('is_important').default(false),
  labels: jsonb('labels').default([]),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('threads_user_id_idx').on(table.userId),
  accountIdIdx: index('threads_account_id_idx').on(table.accountId),
  gmailThreadIdIdx: uniqueIndex('threads_gmail_thread_id_idx').on(table.gmailThreadId, table.accountId),
  lastMessageAtIdx: index('threads_last_message_at_idx').on(table.lastMessageAt),
}))

// Contacts table
export const contacts = pgTable('contacts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  name: text('name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  company: text('company'),
  jobTitle: text('job_title'),
  avatarUrl: text('avatar_url'),
  
  // Relationship tracking
  relationshipStrength: integer('relationship_strength').default(0), // 0-100
  lastInteractionAt: timestamp('last_interaction_at'),
  interactionCount: integer('interaction_count').default(0),
  
  // Social and custom data
  socialProfiles: jsonb('social_profiles').default({}),
  customFields: jsonb('custom_fields').default({}),
  tags: jsonb('tags').default([]),
  notes: text('notes'),
  
  // Source tracking
  source: varchar('source', { length: 50 }), // 'gmail', 'manual', 'enriched'
  sourceAccountId: text('source_account_id').references(() => accounts.id),
  
  // AI fields
  aiEnrichedData: jsonb('ai_enriched_data').default({}),
  aiEmbedding: jsonb('ai_embedding'), // For semantic search
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('contacts_user_id_idx').on(table.userId),
  emailIdx: index('contacts_email_idx').on(table.email),
  uniqueUserEmail: uniqueIndex('contacts_user_email_idx').on(table.userId, table.email),
}))

// Calendar events table
export const calendarEvents = pgTable('calendar_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  googleEventId: text('google_event_id').notNull(),
  
  // Event details
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  
  // Timing
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  isAllDay: boolean('is_all_day').default(false),
  timezone: varchar('timezone', { length: 100 }),
  
  // Participants
  organizer: jsonb('organizer'), // { email: string, name?: string }
  attendees: jsonb('attendees').default([]), // Array of participants
  
  // Status and metadata
  status: varchar('status', { length: 50 }), // 'confirmed', 'tentative', 'cancelled'
  visibility: varchar('visibility', { length: 50 }), // 'public', 'private'
  isBusy: boolean('is_busy').default(true),
  
  // Meeting details
  meetingUrl: text('meeting_url'),
  conferenceData: jsonb('conference_data').default({}),
  
  // Recurrence
  isRecurring: boolean('is_recurring').default(false),
  recurringEventId: text('recurring_event_id'),
  recurrenceRule: text('recurrence_rule'),
  
  // AI fields
  aiSummary: text('ai_summary'),
  aiExtractedTopics: jsonb('ai_extracted_topics').default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('calendar_events_user_id_idx').on(table.userId),
  accountIdIdx: index('calendar_events_account_id_idx').on(table.accountId),
  googleEventIdIdx: uniqueIndex('calendar_events_google_event_id_idx').on(table.googleEventId, table.accountId),
  startTimeIdx: index('calendar_events_start_time_idx').on(table.startTime),
  endTimeIdx: index('calendar_events_end_time_idx').on(table.endTime),
}))

// Sync jobs table - track sync operations
export const syncJobs = pgTable('sync_jobs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  
  type: varchar('type', { length: 50 }).notNull(), // 'email', 'calendar', 'contacts'
  status: syncStatusEnum('status').notNull().default('pending'),
  
  // Progress tracking
  totalItems: integer('total_items').default(0),
  processedItems: integer('processed_items').default(0),
  failedItems: integer('failed_items').default(0),
  
  // Metadata
  config: jsonb('config').default({}), // Sync configuration
  result: jsonb('result').default({}), // Sync results
  error: text('error'),
  
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sync_jobs_user_id_idx').on(table.userId),
  accountIdIdx: index('sync_jobs_account_id_idx').on(table.accountId),
  statusIdx: index('sync_jobs_status_idx').on(table.status),
  createdAtIdx: index('sync_jobs_created_at_idx').on(table.createdAt),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  emails: many(emails),
  threads: many(threads),
  contacts: many(contacts),
  calendarEvents: many(calendarEvents),
  syncJobs: many(syncJobs),
}))

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  emails: many(emails),
  threads: many(threads),
  calendarEvents: many(calendarEvents),
  syncJobs: many(syncJobs),
}))

export const emailsRelations = relations(emails, ({ one }) => ({
  user: one(users, {
    fields: [emails.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [emails.accountId],
    references: [accounts.id],
  }),
  thread: one(threads, {
    fields: [emails.threadId],
    references: [threads.id],
  }),
}))

export const threadsRelations = relations(threads, ({ one, many }) => ({
  user: one(users, {
    fields: [threads.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [threads.accountId],
    references: [accounts.id],
  }),
  emails: many(emails),
}))

export const contactsRelations = relations(contacts, ({ one }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  sourceAccount: one(accounts, {
    fields: [contacts.sourceAccountId],
    references: [accounts.id],
  }),
}))

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [calendarEvents.accountId],
    references: [accounts.id],
  }),
}))

export const syncJobsRelations = relations(syncJobs, ({ one }) => ({
  user: one(users, {
    fields: [syncJobs.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [syncJobs.accountId],
    references: [accounts.id],
  }),
}))