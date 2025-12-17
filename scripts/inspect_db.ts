
import 'dotenv/config';
import { db } from "../db";
import { sql } from "drizzle-orm";
import * as fs from 'fs';

async function run() {
    try {
        const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
        console.log("Columns in users table:");
        const output = JSON.stringify(result, null, 2);
        console.log(output);
        fs.writeFileSync("db_schema.json", output);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
