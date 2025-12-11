
import 'dotenv/config';
import { db } from "../db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Testing DB operations...");
    try {
        // 1. Select
        console.log("Attempting SELECT...");
        const [user] = await db.select().from(users).limit(1);
        console.log("SELECT success. User found:", !!user);
        if (user) {
            console.log("Current settings:", user.settings);
            console.log("Current apiKey:", user.apiKey);
        }

        // 2. Update if user exists
        if (user) {
            console.log("Attempting UPDATE...");
            await db.update(users)
                .set({ settings: JSON.stringify({ theme: 'dark', test: true }) })
                .where(eq(users.id, user.id));
            console.log("UPDATE success.");
        }

    } catch (error) {
        console.error("DB Operation Failed:", error);
        process.exit(1);
    }
    process.exit(0);
}

main();
