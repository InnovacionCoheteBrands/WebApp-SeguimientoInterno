import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

import * as schema from "@shared/schema";

// Create postgres client
const client = postgres(databaseUrl, {
  ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
  max: 10,
});

export const db = drizzle(client, { schema });
