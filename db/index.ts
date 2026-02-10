import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  // FALLBACK FOR DEBUGGING
  process.env.DATABASE_URL = "postgresql://postgres:REDACTED_DB_PASSWORD@localhost:4000/mission_control";
  console.log("⚠️ USING HARDCODED DATABASE_URL FOR DEBUGGING");
}

import * as schema from "@shared/schema";

// Create postgres client
const client = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
  max: 10,
});

export const db = drizzle(client, { schema });
