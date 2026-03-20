import { Router, Request } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * SEC-001 REFACTOR: Settings are now scoped to the authenticated user.
 * The old singleton "admin" fallback has been removed entirely.
 * All routes require authentication via requireAuth middleware.
 */

router.get("/settings", requireAuth, async (req: Request, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Parse settings JSON if it is a string
        let parsedSettings = {};
        if (user.settings && typeof user.settings === "string") {
            try {
                parsedSettings = JSON.parse(user.settings);
            } catch (e) {
                parsedSettings = {};
            }
        }

        res.json({
            settings: parsedSettings,
            apiKey: user.apiKey,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch settings");
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

router.put("/settings", requireAuth, async (req: Request, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { settings } = req.body;

        if (settings) {
            await storage.updateUserSettings(userId, settings);
        }

        const updatedUser = await storage.getUser(userId);

        let parsedUpdatedSettings = {};
        if (updatedUser?.settings && typeof updatedUser.settings === "string") {
            try {
                parsedUpdatedSettings = JSON.parse(updatedUser.settings);
            } catch (e) {
                parsedUpdatedSettings = {};
            }
        }

        res.json({
            settings: parsedUpdatedSettings,
            apiKey: updatedUser?.apiKey
        });
    } catch (error) {
        logger.error({ err: error }, "Failed to update settings");
        res.status(500).json({ error: "Failed to update settings" });
    }
});

router.post("/settings/api-key", requireAuth, async (req: Request, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const newKey = await storage.regenerateApiKey(userId);
        res.json({ apiKey: newKey });
    } catch (error) {
        logger.error({ err: error }, "Failed to regenerate API key");
        res.status(500).json({ error: "Failed to regenerate API key" });
    }
});

export default router;
