
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
}

import { db } from "../db";
import { projects, updateProjectSchema } from "../shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function testUpdateProject() {
    console.log("🔍 TESTING UPDATE PROJECT PAYLOAD...");

    // 1. Fetch an existing project to update
    const existingProject = await db.query.projects.findFirst();

    if (!existingProject) {
        console.error("❌ No projects found in DB to test with.");
        process.exit(1);
    }

    const projectId = existingProject.id;
    console.log(`📋 Testing with Project ID: ${projectId}`);
    console.log("Current state:", existingProject);

    // 2. Define the payload - mimicking what the frontend sends on Drag & Drop
    const payload = { status: "En Curso" };
    console.log("\n📋 Payload to be sent:", payload);

    try {
        // 3. Simulate Controller Parsing (Zod)
        console.log("🧩 Parsing with updateProjectSchema...");
        const validatedData = updateProjectSchema.parse(payload);

        console.log("✅ Parsed Data (What Zod returns):", validatedData);
        // CRITICAL CHECK: Does validatedData contain 'level' or other fields with defaults?

        // 4. Simulate Storage Update
        console.log("💾 Attempting DB Update...");

        const [updated] = await db
            .update(projects)
            .set({ ...validatedData, updatedAt: new Date() })
            .where(eq(projects.id, projectId))
            .returning();

        console.log("✅ Update Successful! New state:", updated);

    } catch (error) {
        console.error("❌ ERROR DURING TEST:", error);
        if (error instanceof z.ZodError) {
            console.error("Validation Errors:", error.errors);
        }
    }
    process.exit(0);
}

testUpdateProject().catch(console.error);
