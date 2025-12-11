
import postgres from "postgres";

const DATABASE_URL = "postgresql://postgres:Cohete_AI_24!@localhost:4000/mission_control";

const user = "postgres";
const pass = "Cohete_AI_24!";
const host = "localhost";
const port = 4000;
const dbName = "mission_control";

// Using explicit connection params to avoid dotenv issues if any
const sql = postgres({
    host,
    port,
    database: dbName,
    username: user,
    password: pass,
});

async function migrate() {
    console.log("Connecting to DB...");
    try {
        await sql`
      CREATE TABLE IF NOT EXISTS agency_role_catalog (
        id SERIAL PRIMARY KEY,
        role_name TEXT NOT NULL,
        department TEXT NOT NULL,
        default_billable_rate NUMERIC NOT NULL DEFAULT '0',
        allowed_activities TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
        console.log("Success! Table 'agency_role_catalog' ensured.");
        process.exit(0);
    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    }
}

migrate();
