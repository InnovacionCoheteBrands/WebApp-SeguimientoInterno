import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL not set');
    }

    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client);

    console.log('🔄 Running team schema migration...');

    const migrationPath = path.join(__dirname, '../migrations/0003_sync_team_schema.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    // Split by statement and execute each
    const statements = migrationSql
        .split(/;[\r\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        if (statement.length > 0) {
            try {
                console.log(`  Executing: ${statement.substring(0, 60)}...`);
                await client.unsafe(statement);
                console.log('  ✅ Success');
            } catch (err: any) {
                // Ignore "already exists" type errors
                if (err.code === '42701' || err.code === '42P07') {
                    console.log(`  ⚠️ Already exists, skipping`);
                } else {
                    console.error(`  ❌ Error: ${err.message}`);
                }
            }
        }
    }

    console.log('✅ Migration complete!');
    await client.end();
}

runMigration().catch(console.error);
