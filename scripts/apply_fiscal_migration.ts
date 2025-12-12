
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Running manual migration...");
    try {
        await db.execute(sql`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "rfc" text;`);
        console.log("Added rfc");
        await db.execute(sql`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "invoice_number" text;`);
        console.log("Added invoice_number");
        await db.execute(sql`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "provider" text;`);
        console.log("Added provider");
        await db.execute(sql`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "subtotal" numeric(12, 2);`);
        console.log("Added subtotal");
        await db.execute(sql`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "iva" numeric(12, 2);`);
        console.log("Added iva");
        await db.execute(sql`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "notes" text;`);
        console.log("Added notes");
        console.log("Migration applied successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error applying migration:", err);
        process.exit(1);
    }
}

main();
