import { storage } from "../server/storage";
import { hashPassword } from "../server/utils/crypto";

async function main() {
    console.log("🔐 Mission Control - Admin Reset Utility");

    const username = "admin";
    const password = "admin123";
    const hashedPassword = await hashPassword(password);

    const existingUser = await storage.getUserByUsername(username);

    if (existingUser) {
        console.log(`[Update] User '${username}' found. Updating password...`);
        await storage.updateUserPassword(existingUser.id, hashedPassword);
    } else {
        console.log(`[Create] User '${username}' not found. Creating...`);
        await storage.createUser({
            username,
            password: hashedPassword,
            role: "admin"
        });
    }

    console.log(`✅ Success! User '${username}' is now active with password '${password}'`);
    process.exit(0);
}

main().catch(err => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
});
