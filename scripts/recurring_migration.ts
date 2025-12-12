
import { db } from "../server/db"; // Adjust import path
import { sql } from "drizzle-orm";

async function main() {
    console.log("Applying Schema Migration to 'recurring_transactions'...");

    try {
        await db.execute(sql`
            ALTER TABLE recurring_transactions
            ADD COLUMN IF NOT EXISTS rfc text,
            ADD COLUMN IF NOT EXISTS provider text,
            ADD COLUMN IF NOT EXISTS subtotal numeric(12, 2),
            ADD COLUMN IF NOT EXISTS iva numeric(12, 2),
            ADD COLUMN IF NOT EXISTS notes text,
            ADD COLUMN IF NOT EXISTS description text
        `);
        console.log("Migration successful: Added fiscal columns to recurring_transactions");
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit(0);
}

main().catch(console.error);
