
import "dotenv/config";
import { db } from "./db";
import { agencyRoleCatalog } from "./shared/schema";

async function verifyLogic() {
    console.log("Verifying Agency Logic...");

    try {
        // 1. Try INSERT
        console.log("Attempting INSERT...");
        const newRole = await db.insert(agencyRoleCatalog).values({
            roleName: "Test Role " + Date.now(),
            department: "Tech",
            defaultBillableRate: "100",
            allowedActivities: JSON.stringify(["Coding"])
        }).returning();
        console.log("DEBUG: Insert Result:", newRole);

        if (newRole.length === 0) throw new Error("Insert returned empty array (row not created?)");

        // 2. Try SELECT
        console.log("Attempting SELECT...");
        const roles = await db.select().from(agencyRoleCatalog);
        console.log("DEBUG: Select Result Count:", roles.length);

        if (roles.length === 0) throw new Error("Select returned 0 roles after insert.");

        console.log("SUCCESS: Logic verified.");
        process.exit(0);
    } catch (error) {
        console.error("FAILURE:", error);
        process.exit(1);
    }
}

verifyLogic();
