
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
}
const sql = postgres(databaseUrl);

async function patchSchema() {
    try {
        console.log("🛠️ Patching 'team' table schema...");

        // Add 'area' column if it doesn't exist
        await sql`
            ALTER TABLE team 
            ADD COLUMN IF NOT EXISTS area text;
        `;
        console.log("✅ Added 'area' column.");

        // Verify changes
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'team'
        `;
        console.log("Current columns:", columns.map(c => c.column_name));

    } catch (e) {
        console.error("❌ Patch failed:", e);
    } finally {
        await sql.end();
    }
}

patchSchema();
