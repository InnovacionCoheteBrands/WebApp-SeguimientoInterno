
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function verifyBudgetColumn() {
    try {
        const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'budget';
    `);

        if (result.length > 0) {
            console.log("✅ SUCCESS: 'budget' column found in 'projects' table.");
            console.log(result[0]);
        } else {
            console.error("❌ FAILURE: 'budget' column NOT found in 'projects' table.");
        }
    } catch (error) {
        console.error("Error verifying schema:", error);
    } finally {
        process.exit(0);
    }
}

verifyBudgetColumn();
