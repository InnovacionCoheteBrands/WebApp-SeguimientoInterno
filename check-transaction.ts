import 'dotenv/config';
import { db } from "./server/db";
import { transactions } from "./shared/schema";
import { eq, desc } from "drizzle-orm";

async function checkTransaction() {
    console.log("Checking for recent transactions...");
    const recent = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(5);

    console.log("Recent transactions found:", recent.length);
    recent.forEach(t => {
        console.log(`- ID: ${t.id}, Desc: ${t.description}, Amount: ${t.amount}, Date: ${t.date}, PaidDate: ${t.paidDate}`);
    });

    const found = recent.find(t => t.description === "Verify Success");
    if (found) {
        console.log("✅ SUCCESS: Transaction 'Verify Success' found!");
        process.exit(0);
    } else {
        console.error("❌ FAILURE: Transaction 'Verify Success' NOT found.");
        process.exit(1);
    }
}

checkTransaction().catch(console.error);
