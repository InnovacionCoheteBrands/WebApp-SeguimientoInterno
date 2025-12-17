import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";

const router = Router();

/**
 * @deprecated Hardcoded credentials are a security risk and prevent multi-user support.
 * 
 * TODO: Migrate to proper authentication system:
 * 1. Implement user authentication with hashed passwords (bcrypt/argon2)
 * 2. Add session management (JWT or session cookies)
 * 3. Move credentials to environment variables or secure secret management
 * 4. Add user registration/login endpoints
 * 5. Protect settings routes with authentication middleware
 * 6. Support per-user settings instead of single "admin" user
 * 
 * For now, this function creates a single default user for development/demo purposes.
 */
async function getDefaultUser() {
    const username = "admin";
    let user = await storage.getUserByUsername(username);
    if (!user) {
        user = await storage.createUser({
            username,
            password: "password", // SECURITY WARNING: Hardcoded password for demo only
        });
    }
    return user;
}

router.get("/settings", async (req, res) => {
    try {
        const user = await getDefaultUser();

        // Parse settings JSON if it's a string (it might be depending on DB driver return)
        // Parse settings JSON
        let parsedSettings = {};
        if (user.settings && typeof user.settings === 'string') {
            try {
                parsedSettings = JSON.parse(user.settings);
            } catch (e) {
                parsedSettings = {};
            }
        }

        res.json({
            settings: parsedSettings,
            apiKey: user.apiKey,
            webhookUrl: user.webhookUrl,
            // Return other user info if needed
            username: user.username,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

router.put("/settings", async (req, res) => {
    try {
        const user = await getDefaultUser();
        const { settings, webhookUrl } = req.body;

        if (settings) {
            await storage.updateUserSettings(user.id, settings);
        }

        // @deprecated webhookUrl feature not implemented
        if (webhookUrl !== undefined) {
            await storage.updateUserWebhook(user.id, webhookUrl);
        }

        const updatedUser = await storage.getUser(user.id);

        let parsedUpdatedSettings = {};
        if (updatedUser?.settings && typeof updatedUser.settings === 'string') {
            try {
                parsedUpdatedSettings = JSON.parse(updatedUser.settings);
            } catch (e) {
                parsedUpdatedSettings = {};
            }
        }

        res.json({
            settings: parsedUpdatedSettings,
            apiKey: updatedUser?.apiKey,
            webhookUrl: updatedUser?.webhookUrl
        });
    } catch (error) {
        res.status(500).json({
            error: "Failed to update settings",
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

router.post("/settings/api-key", async (req, res) => {
    try {
        const user = await getDefaultUser();
        const newKey = await storage.regenerateApiKey(user.id);
        res.json({ apiKey: newKey });
    } catch (error) {
        res.status(500).json({ error: "Failed to regenerate API key" });
    }
});

export default router;
