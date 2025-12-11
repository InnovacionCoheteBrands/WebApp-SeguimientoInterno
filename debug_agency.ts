
import { db } from "./db";
import { agencyRoleCatalog } from "./shared/schema";

const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Connection timeout")), 5000)
);

async function checkAgencyRoles() {
    console.log("Starting check...");
    console.log("DB URL (masked):", process.env.DATABASE_URL ? "Set" : "Not Set");

    try {
        console.log("Attempting query...");
        const roles = await Promise.race([
            db.select().from(agencyRoleCatalog),
            timeout
        ]);
        console.log("Success! Roles found:", roles);
        process.exit(0);
    } catch (error) {
        console.error("Database Error:", error);
        process.exit(1);
    }
}

checkAgencyRoles();
