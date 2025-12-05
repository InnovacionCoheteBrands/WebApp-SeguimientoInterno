
import 'dotenv/config';
import { db } from "./db";
import { sql } from "drizzle-orm";

async function checkDb() {
    console.log("Testing DB connection...");
    console.log("URL:", process.env.DATABASE_URL?.replace(/:[^:@]*@/, ":***@"));
    try {
        const result = await db.execute(sql`SELECT 1 as val`);
        console.log("✅ DB Connection successful:", result);
        process.exit(0);
    } catch (error) {
        console.error("❌ DB Connection failed:", JSON.stringify(error, null, 2));
        process.exit(1);
    }
}

checkDb();
