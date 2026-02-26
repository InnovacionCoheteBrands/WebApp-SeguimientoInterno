
import 'dotenv/config';
import { db } from "../db";
import { sql } from "drizzle-orm";
import * as fs from 'fs';

async function run() {
    try {
        const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
        console.log("Tables in database:");
        const output = JSON.stringify(result, null, 2);
        console.log(output);
        fs.writeFileSync("db_schema.json", output);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
