
import postgres from 'postgres';

const sql = postgres('postgresql://postgres:REDACTED_DB_PASSWORD@localhost:4000/mission_control');

async function main() {
    try {
        console.log("🔍 Inspecting 'team' table...");

        // Check table
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'team'
        `;

        if (tables.length === 0) {
            console.error("❌ Table 'team' NOT found!");
        } else {
            console.log("✅ Table 'team' found.");

            // Check columns
            const columns = await sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'team'
            `;
            console.log("Columns:", columns.map(c => `${c.column_name} (${c.data_type})`));

            // Try to select
            console.log("Trying to SELECT * FROM team LIMIT 1...");
            const rows = await sql`SELECT * FROM team LIMIT 1`;
            console.log("Rows:", rows);
        }
    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await sql.end();
    }
}

main();
