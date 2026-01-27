
import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function run() {
    try {
        console.log("Attempting Drizzle Raw SQL Insert...");

        if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");

        const client = postgres(process.env.DATABASE_URL);
        const db = drizzle(client, { logger: true });

        const result = await db.execute(sql`
            INSERT INTO projects (client_id, name, service_type, status, health, progress)
            VALUES (1, 'Drizzle Raw SQL', 'Web', 'Planificación', 'green', 0)
            RETURNING *
        `);

        console.log("✅ Insert Success:", result[0]);

    } catch (e) {
        console.error("❌ Drizzle Failed:", e);
    } finally {
        process.exit(0);
    }
}
run();
