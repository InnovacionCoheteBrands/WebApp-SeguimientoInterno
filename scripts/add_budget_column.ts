
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function addBudgetColumn() {
    try {
        console.log("Attempting to add 'budget' column to 'projects' table...");

        // Check if it exists first
        const check = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'budget';
    `);

        if (check.length > 0) {
            console.log("ℹ️ 'budget' column already exists directly (double check).");
            return;
        }

        // Add column
        await db.execute(sql`
      ALTER TABLE projects 
      ADD COLUMN budget numeric DEFAULT '0';
    `);

        console.log("✅ SUCCESS: Added 'budget' column via raw SQL.");

    } catch (error: any) {
        if (error.message && error.message.includes("already exists")) {
            console.log("ℹ️ Column already exists (caught error).");
        } else {
            console.error("❌ FAILURE: Could not add column.", error);
        }
    } finally {
        process.exit(0);
    }
}

addBudgetColumn();
