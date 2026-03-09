
import "dotenv/config";
import { db } from "./db";
import { transactions } from "./shared/schema";
import { sql } from "drizzle-orm";

async function testQuery() {
    try {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);

        console.log(`Testing query with range: ${start.toISOString()} to ${end.toISOString()}`);

        const result = await db.execute(sql`
      SELECT 
        type,
        category,
        CAST(amount AS DECIMAL) as amount,
        TO_CHAR(date, 'YYYY-MM') as month
      FROM ${transactions}
      WHERE date >= ${start.toISOString()} AND date <= ${end.toISOString()}
      ORDER BY date DESC
    `);

        console.log("Query successful!");
        console.log(`Result type: ${typeof result}`);
        console.log(`Is array: ${Array.isArray(result)}`);
        console.log(`Count: ${Array.isArray(result) ? result.length : 'N/A'}`);

        if (Array.isArray(result) && result.length > 0) {
            console.log("First row samples:", result[0]);
        } else {
            console.log("No rows returned.");
        }

    } catch (error) {
        console.error("Query failed!");
        console.error(error);
    } finally {
        process.exit();
    }
}

testQuery();
