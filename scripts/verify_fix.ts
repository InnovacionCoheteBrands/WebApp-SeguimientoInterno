
import 'dotenv/config';
import { storage } from "../server/storage";

async function run() {
    console.log("Verifying fix...");
    try {
        let user = await storage.getUserByUsername("admin");
        if (!user) {
            console.log("Admin user not found, creating...");
            user = await storage.createUser({ username: "admin", password: "password" });
        }
        console.log("User found:", user.id);
        const settings = { theme: "light" };
        // This call will fail if the column is missing
        const updated = await storage.updateUserSettings(user.id, settings);
        console.log("Settings updated successfully! New settings:", updated.settings);
    } catch (error) {
        console.error("Failed to update settings:", error);
        process.exit(1);
    }
    process.exit(0);
}

run();
