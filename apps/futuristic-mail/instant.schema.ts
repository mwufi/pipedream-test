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
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

type Todo = InstaQLEntity<typeof schema, "todos">;
export type { AppSchema, Todo };
export default schema;
