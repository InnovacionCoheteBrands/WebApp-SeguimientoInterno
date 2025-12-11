
import 'dotenv/config';
import { db } from "../db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);

        console.log("Columns in 'users' table:");
        result.forEach((row: any) => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });

    } catch (error) {
        console.error("Dump failed:", error);
    }
    process.exit(0);
}

main();
