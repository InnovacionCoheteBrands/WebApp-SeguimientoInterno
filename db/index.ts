import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import { logger } from "../server/utils/logger";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(databaseUrl, {
  ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
  max: 10,
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
