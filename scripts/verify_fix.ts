
import 'dotenv/config';
import { storage } from "../server/storage";

async function run() {
    console.log("Verifying fix...");
    try {
        const username = process.env.AUTH_USERNAME;
        if (!username) {
            throw new Error("AUTH_USERNAME is required.");
        }
        const user = await storage.getUserByUsername(username);
        if (!user) {
            throw new Error("Configured user was not found. No user was created.");
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
