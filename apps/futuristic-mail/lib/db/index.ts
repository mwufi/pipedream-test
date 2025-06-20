import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// For development, use a local PostgreSQL instance
// For production, use the DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/futuristic_mail'

// Create the connection
const queryClient = postgres(connectionString)

// Create the drizzle instance
export const db = drizzle(queryClient, { schema })

// Export schema for convenience
export * from './schema'