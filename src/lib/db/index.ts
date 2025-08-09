import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Skip database connection during build if using placeholder URL
const isPlaceholderDb = process.env.DATABASE_URL.includes("placeholder");

// Create the postgres client only if not using placeholder
const client = isPlaceholderDb 
  ? null 
  : postgres(process.env.DATABASE_URL, {
      max: 10, // Maximum number of connections
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connect timeout in seconds
    });

// Create the drizzle instance
export const db = isPlaceholderDb 
  ? null as unknown as ReturnType<typeof drizzle> // This will be properly typed but won't actually run queries during build
  : drizzle(client!, { 
      schema,
      logger: process.env.NODE_ENV === "development",
    });

export type DbClient = typeof db;
export * from "./schema";