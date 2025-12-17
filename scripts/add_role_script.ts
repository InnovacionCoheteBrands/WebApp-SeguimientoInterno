
import 'dotenv/config';
import { db } from "../db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Starting add_role...");
    try {
        // 1. Check if role exists
        const check = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    `);

        if (check.length > 0) {
            console.log("Role column already exists.");
        } else {
            console.log("Role column missing. Adding...");
            await db.execute(sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' NOT NULL
        `);
            console.log("ALTER command sent.");
        }

        // 2. Verify
        const verify = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    `);
        console.log("Verification result:", verify);

    } catch (e) {
        console.error("Script Error:", e);
    }

    // Wait to ensure flush
    await new Promise(r => setTimeout(r, 1000));
    process.exit(0);
}

run();
