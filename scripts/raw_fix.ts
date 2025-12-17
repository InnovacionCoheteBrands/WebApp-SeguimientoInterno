
import 'dotenv/config';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL");
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function run() {
    console.log("Adding missing columns...");
    try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' NOT NULL`;
        console.log("Column 'role' added (if not exists).");

        await sql.end();
        console.log("Migration done.");
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

run();
