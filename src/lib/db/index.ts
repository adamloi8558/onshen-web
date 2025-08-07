import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create the postgres client
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connect timeout in seconds
});

// Create the drizzle instance
export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === "development",
});

export type DbClient = typeof db;
export * from "./schema";