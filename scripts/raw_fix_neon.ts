
import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("No DATABASE_URL");
    process.exit(1);
}

// Configure WebSocket with SSL options (same as test-db.ts)
const wsClient = class extends ws {
    constructor(address: any, protocols?: any, options?: any) {
        super(address, protocols, {
            ...options,
            rejectUnauthorized: false,
        });
    }
};

const db = drizzle({
    connection: connectionString,
    ws: wsClient as any,
});

async function run() {
    console.log("Adding missing 'role' column via Neon driver...");
    try {
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' NOT NULL`);
        console.log("Column 'role' added (if not exists).");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

run();
