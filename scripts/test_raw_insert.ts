
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("🔍 Starting Raw DB Diagnostics...");

    try {
        // 1. Check Table Structure
        console.log("1️⃣ Checking 'projects' table columns...");
        const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `);

        console.table(columns);

        // 2. Try Raw Insert
        console.log("\n2️⃣ Attempting Raw SQL Insert...");
        // We need a valid client ID first.
        const clients = await db.execute(sql`SELECT id FROM client_accounts LIMIT 1`);
        let clientId;

        if (clients.length === 0) {
            console.log("⚠️ No clients found. Creating one raw...");
            const newClient = await db.execute(sql`
            INSERT INTO client_accounts (company_name, industry, monthly_budget, current_spend, health_score, status)
            VALUES ('Raw Client', 'Tech', 1000, 0, 100, 'Active')
            RETURNING id
        `);
            clientId = newClient[0].id;
        } else {
            clientId = clients[0].id;
        }

        console.log(`   Using Client ID: ${clientId}`);

        // Insert
        const result = await db.execute(sql`
        INSERT INTO projects (client_id, name, service_type, status, health, progress)
        VALUES (${clientId}, 'Raw Insert Project', 'Web', 'Planificación', 'green', 0)
        RETURNING id
    `);

        console.log(`   ✅ Raw Insert Successful! Project ID: ${result[0].id}`);

        // Cleanup
        await db.execute(sql`DELETE FROM projects WHERE id = ${result[0].id}`);

    } catch (error) {
        console.error("🚨 Diagnostic failed:", error);
    } finally {
        process.exit(0);
    }
}

run();
