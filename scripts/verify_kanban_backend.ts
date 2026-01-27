
import "dotenv/config";
import { storage } from "../server/storage";
import { insertClientAccountSchema, insertProjectSchema } from "@shared/schema";

async function run() {
    console.log("🔍 Starting Kanban Backend Verification...");

    let projectId: number | undefined;
    let clientId: number | undefined;

    try {
        // 1. Create a Test Client
        console.log("1️⃣ Creating Test Client...");
        const clientData = {
            companyName: "Test Backend Client " + Date.now(),
            industry: "Tech",
            monthlyBudget: 1000,
            currentSpend: 0,
            healthScore: 100,
            status: "Active"
        };
        // safeParse to ensure it matches schema defaults if any
        const clientParse = insertClientAccountSchema.safeParse(clientData);
        if (!clientParse.success) throw new Error("Client Validation Failed: " + JSON.stringify(clientParse.error));

        const client = await storage.createClientAccount(clientParse.data);
        clientId = client.id;
        console.log(`   ✅ Client Created: ID ${client.id}`);

        // 2. Create Test Project
        console.log("2️⃣ Creating Test Project...");
        const projectData = {
            name: "Test Kanban Project",
            clientId: client.id,
            serviceType: "Web",
            status: "Planificación",
            health: "green",
            progress: 0
        };
        const projectParse = insertProjectSchema.safeParse(projectData);
        if (!projectParse.success) throw new Error("Project Validation Failed: " + JSON.stringify(projectParse.error));

        const project = await storage.createProject(projectParse.data);
        projectId = project.id;
        console.log(`   ✅ Project Created: ID ${project.id}, Status: ${project.status}`);

        // 3. Update Status (The Core Test)
        console.log("3️⃣ Testing Update Project Status to 'En Curso'...");
        const updated = await storage.updateProject(project.id, { status: "En Curso" });

        if (updated?.status === "En Curso") {
            console.log("   ✅ SUCCESS: Project status persisted as 'En Curso'");
        } else {
            console.error(`   ❌ FAILED: Expected 'En Curso', got '${updated?.status}'`);
            process.exit(1);
        }

        // 4. Verify Partial Update (just in case)
        console.log("4️⃣ Testing Partial Update (Budget)...");
        const updated2 = await storage.updateProject(project.id, { budget: "5000" });
        if (updated2?.budget === "5000.00" || updated2?.budget === "5000") {
            console.log("   ✅ SUCCESS: Budget updated.");
        } else {
            console.log(`   ⚠️ WARNING: Budget update check: ${updated2?.budget}`);
        }

    } catch (error) {
        console.error("🚨 Test failed with error:", error);
        process.exit(1);
    } finally {
        // Cleanup
        console.log("🧹 Cleaning up...");
        if (projectId) await storage.deleteProject(projectId);
        if (clientId) await storage.deleteClientAccount(clientId);
        console.log("✨ Test Complete");
        process.exit(0);
    }
}

run();
