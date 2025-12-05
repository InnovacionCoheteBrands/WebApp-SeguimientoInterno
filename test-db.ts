import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { sql } from 'drizzle-orm';

async function testConnection() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined');
        return;
    }

    // Hide password in logs
    console.log('🔌 Testing connection to:', connectionString.replace(/:([^:@]+)@/, ':****@'));

    // Configure WebSocket with SSL options (same as db/index.ts)
    const wsClient = class extends ws {
        constructor(address: any, protocols?: any, options?: any) {
            super(address, protocols, {
                ...options,
                rejectUnauthorized: false,
            });
        }
    };

    try {
        const db = drizzle({
            connection: connectionString,
            ws: wsClient as any,
        });

        const result = await db.execute(sql`SELECT NOW()`);
        console.log('✅ Connection successful!', result);
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error);
        process.exit(1);
    }
}

testConnection();
