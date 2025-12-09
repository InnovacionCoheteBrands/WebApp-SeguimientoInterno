import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";

const router = Router();

// Helper to get or create the default user
async function getDefaultUser() {
    const username = "admin";
    let user = await storage.getUserByUsername(username);
    if (!user) {
        user = await storage.createUser({
            username,
            password: "password", // Default password, simple for now
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
        res.status(500).json({ error: "Failed to update settings" });
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
