
import "dotenv/config";
import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function run() {
    console.log("🔍 Testing Local Schema Definition...");

    // Define minimal schema locally matching the DB
    const projects = pgTable("projects", {
        id: serial("id").primaryKey(),
        clientId: integer("client_id"),
        name: text("name"),
        serviceType: text("service_type"),
        status: text("status"),
    });

    const client = postgres(process.env.DATABASE_URL!);
    // Standard config, NO snake_case, relying on explicit column mapping
    const db = drizzle(client, { logger: true });

    try {
        console.log("Inserting with local schema...");
        const result = await db.insert(projects).values({
            clientId: 1, // Should map to client_id
            name: "Local Schema Test",
            serviceType: "Web",
            status: "Planificación"
        }).returning();

        console.log("✅ Local schema insert SUCCESS:", result[0]);

        // Cleanup
        // await db.delete(projects).where(eq(projects.id, result[0].id));
    } catch (e) {
        console.error("❌ Local schema insert FAILED:", e);
    } finally {
        process.exit(0);
    }
}
run();
