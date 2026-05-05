import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import { logger } from "../server/utils/logger";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

/** Supabase transaction pooler (6543) requires prepared statements off (PgBouncer). */
const usePooler =
  databaseUrl.includes("pooler.supabase") || /:6543\b/.test(databaseUrl);

const client = postgres(databaseUrl, {
  ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
  max: 10,
  ...(usePooler ? { prepare: false as const } : {}),
});

export const db = drizzle(client, { schema });

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ err: error }, "Database connectivity check failed");
    return false;
  }
}
