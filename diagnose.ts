
import postgres from "postgres";
import fetch from "node-fetch";

const dbConfig = {
    host: "localhost",
    port: 4000,
    database: "mission_control",
    username: "postgres",
    password: "Cohete_AI_24!",
};

const sql = postgres(dbConfig);

async function diagnose() {
    console.log("--- DB DIAGNOSTICS ---");
    try {
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log("Tables found:", tables.map(t => t.table_name).sort());

        const agencyTable = tables.find(t => t.table_name === 'agency_role_catalog');
        if (!agencyTable) {
            console.error("CRITICAL: 'agency_role_catalog' table is MISSING!");
        } else {
            console.log("OK: 'agency_role_catalog' table exists.");
        }
    } catch (err) {
        console.error("DB Connection Failed:", err);
    }

    console.log("\n--- API DIAGNOSTICS ---");
    try {
        console.log("Fetching http://localhost:5000/api/agency/roles...");
        const res = await fetch("http://localhost:5000/api/agency/roles");
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("Body:", text);
    } catch (err) {
        console.error("API Request Failed:", err);
    }

    process.exit(0);
}

diagnose();
