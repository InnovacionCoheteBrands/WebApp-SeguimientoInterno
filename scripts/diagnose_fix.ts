
import 'dotenv/config';
import { db } from "../db";
import { sql } from "drizzle-orm";
import * as fs from 'fs';

async function run() {
    console.log("--- DIAGNOSE START ---");

    try {
        const cols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);

        // Write full output to file
        fs.writeFileSync("db_columns.txt", JSON.stringify(cols, null, 2));
        console.log("Columns written to db_columns.txt");

    } catch (e) {
        console.error("Diagnosis Error:", e);
    }

    console.log("--- DIAGNOSE END ---");
    process.exit(0);
}

run();
