import 'dotenv/config';
import postgres from 'postgres';

async function fixMissingColumns() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL not set');
    }

    const client = postgres(connectionString, { max: 1 });

    console.log('🔧 Adding missing columns to team table...\n');

    const alterStatements = [
        'ALTER TABLE team ADD COLUMN IF NOT EXISTS first_name TEXT',
        'ALTER TABLE team ADD COLUMN IF NOT EXISTS area TEXT',
    ];

    for (const stmt of alterStatements) {
        try {
            await client.unsafe(stmt);
            console.log(`✅ ${stmt.substring(30)}`);
        } catch (err: any) {
            console.error(`❌ ${stmt}: ${err.message}`);
        }
    }

    // Also ensure name column is nullable
    try {
        await client.unsafe('ALTER TABLE team ALTER COLUMN name DROP NOT NULL');
        console.log('✅ name column now nullable');
    } catch (err: any) {
        console.log(`⚠️ name column: ${err.message}`);
    }

    console.log('\n✅ Done!');
    await client.end();
}

fixMissingColumns().catch(console.error);
