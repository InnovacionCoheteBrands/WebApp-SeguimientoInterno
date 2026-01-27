
import { db } from "../server/db.ts";
import { sql } from "drizzle-orm";

async function inspectTeamTable() {
    try {
        console.log("🔍 Checking if 'team' table exists...");
        const tableCheck = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'team';
        `);

        console.log("Table check result:", tableCheck.rows);

        if (tableCheck.rows.length === 0) {
            console.error("❌ CRITICAL: 'team' table does not exist!");
            process.exit(1);
        }

        console.log("✅ 'team' table exists. Checking columns...");
        const columnCheck = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'team';
        `);
        console.log("Columns:", columnCheck.rows.map(r => `${r.column_name} (${r.data_type})`));

        process.exit(0);
    } catch (error) {
        console.error("❌ Database inspection failed:", error);
        process.exit(1);
    }
}

inspectTeamTable();
