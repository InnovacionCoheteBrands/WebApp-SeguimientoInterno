
import 'dotenv/config';
import { db } from "../db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Forcing migration...");
    try {
        await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS settings text DEFAULT '{}';
    `);
        console.log("Fix applied: Checked/Added settings column.");
    } catch (e) {
        console.error("Fix failed:", e);
    }
    process.exit(0);
}
run();
