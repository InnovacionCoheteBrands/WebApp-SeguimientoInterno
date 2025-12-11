
import 'dotenv/config';
import { db } from "../db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Forcing migration...");

    const queries = [
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "settings" text DEFAULT '{}'`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key" text`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "webhook_url" text`
    ];

    for (const query of queries) {
        try {
            console.log(`Executing: ${query}`);
            await db.execute(sql.raw(query));
            console.log("Success.");
        } catch (e: any) {
            console.log(`Error executing query: ${e.message}`);
        }
    }

    console.log("Done.");
    process.exit(0);
}

main();
