// Docs: https://www.instantdb.com/docs/modeling-data

import { i, InstaQLEntity } from "@instantdb/react";

const _schema = i.schema({
  // We inferred 3 attributes!
  // Take a look at this schema, and if everything looks good,
  // run `push schema` again to enforce the types.
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    todos: i.entity({
      createdAt: i.number().optional(),
      done: i.boolean().optional(),
      text: i.string().optional(),
    }),
    enrichments: i.entity({
      id: i.string().unique().indexed(),
      personDetails: i.any(),
      linkedinProfiles: i.any(),
      professionalInfo: i.any(),
      recentNews: i.any(),
      socialProfiles: i.any(),
      summary: i.string().optional(),
      status: i.string().indexed(),
      phase: i.string().optional(),
      createdAt: i.number().indexed(),
      completedAt: i.number().optional(),
      error: i.string().optional(),
    }),
    profiles: i.entity({
      userId: i.string().unique().indexed(), // Clerk user ID
      connectedAccounts: i.json<any[]>(),
      onboarding: i.json<{
        currentStep: string;
        completedSteps: string[];
        stepData: Record<string, any>;
        completed: boolean;
        completedAt?: number;
      }>(),
      preferences: i.json<{
        goals: string[];
        emailRules?: string;
      }>(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    syncJobs: i.entity({
      id: i.string().unique().indexed(),
      accountId: i.string().indexed(),
      userId: i.string().indexed(),
      type: i.string().indexed(), // 'gmail' | 'calendar' | 'contacts'
      status: i.string().indexed(), // 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
      workflowId: i.string(),
      progress: i.json<{
        current: number;
        total: number;
        currentStep: string;
        percentComplete: number;
      }>(),
      startedAt: i.number(),
      completedAt: i.number().optional(),
      error: i.string().optional(),
      stats: i.json<{
        messagesProcessed?: number;
        eventsProcessed?: number;
        contactsProcessed?: number;
        duration?: number;
      }>().optional(),
    }),
    emails: i.entity({
      id: i.string().unique().indexed(),
      messageId: i.string().indexed(),
      threadId: i.string().indexed(),
      accountId: i.string().indexed(),
      userId: i.string().indexed(),
      subject: i.string(),
      from: i.string(),
      date: i.string(),
      snippet: i.string().optional(),
      labelIds: i.json<string[]>().optional(),
      historyId: i.string().optional(),
      internalDate: i.string().optional(),
      syncedAt: i.number(),
    }),
    events: i.entity({
      id: i.string().unique().indexed(),
      eventId: i.string().indexed(),
      calendarId: i.string().indexed(),
      accountId: i.string().indexed(),
      userId: i.string().indexed(),
      summary: i.string().optional(),
      description: i.string().optional(),
      start: i.string(),
      end: i.string(),
      attendees: i.json<Array<{ email: string, responseStatus?: string }>>().optional(),
      location: i.string().optional(),
      etag: i.string().optional(),
      updated: i.string().optional(),
      syncedAt: i.number(),
    }),
    contacts: i.entity({
      id: i.string().unique().indexed(),
      contactId: i.string().indexed(),
      accountId: i.string().indexed(),
      userId: i.string().indexed(),
      name: i.string().optional(),
      email: i.string().optional().indexed(),
      phone: i.string().optional(),
      organization: i.string().optional(),
      title: i.string().optional(),
      etag: i.string().optional(),
      syncedAt: i.number(),
    }),
  },
  links: {
    todosAuthor: {
      forward: {
        on: "todos",
        has: "one",
        label: "author",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "todos",
      },
    },
    enrichmentsAuthor: {
      forward: {
        on: "enrichments",
        has: "one",
        label: "author",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "enrichments",
      },
    },
    profilesUser: {
      forward: {
        on: "profiles",
        has: "one",
        label: "user",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "one",
        label: "profile",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

type Todo = InstaQLEntity<typeof schema, "todos">;
type Enrichment = InstaQLEntity<typeof schema, "enrichments">;
type Profile = InstaQLEntity<typeof schema, "profiles">;
type SyncJob = InstaQLEntity<typeof schema, "syncJobs">;
type Email = InstaQLEntity<typeof schema, "emails">;
type Event = InstaQLEntity<typeof schema, "events">;
type Contact = InstaQLEntity<typeof schema, "contacts">;
export type { AppSchema, Todo, Enrichment, Profile, SyncJob, Email, Event, Contact };
export default schema;
