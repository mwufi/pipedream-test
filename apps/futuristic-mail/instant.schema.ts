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
export type { AppSchema, Todo, Enrichment, Profile };
export default schema;
