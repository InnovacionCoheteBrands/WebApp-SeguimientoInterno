/**
 * Migration script to add missing columns to client_accounts table
 */
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function migrate() {
    console.log("🔧 Adding missing columns to client_accounts table...");

    try {
        // Add missing columns one by one to avoid syntax issues
        const columns = [
            "ADD COLUMN IF NOT EXISTS trade_name TEXT",
            "ADD COLUMN IF NOT EXISTS sector TEXT",
            "ADD COLUMN IF NOT EXISTS company_size TEXT",
            "ADD COLUMN IF NOT EXISTS lead_origin TEXT",
            "ADD COLUMN IF NOT EXISTS website_url TEXT",
            "ADD COLUMN IF NOT EXISTS address_street TEXT",
            "ADD COLUMN IF NOT EXISTS address_city TEXT",
            "ADD COLUMN IF NOT EXISTS address_state TEXT",
            "ADD COLUMN IF NOT EXISTS address_zip TEXT",
            "ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'México'",
            "ADD COLUMN IF NOT EXISTS logo_url TEXT",
        ];

        for (const col of columns) {
            try {
                await db.execute(sql.raw(`ALTER TABLE client_accounts ${col}`));
                console.log(`  ✓ ${col.split(" ")[4]}`);
            } catch (e: any) {
                if (e.code === "42701") {
                    // column already exists
                    console.log(`  ⚠ ${col.split(" ")[4]} already exists`);
                } else {
                    throw e;
                }
            }
        }

        console.log("✅ Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
