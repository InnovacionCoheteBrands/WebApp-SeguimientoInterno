import { Router, Request } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { requireAuth } from "../middleware/auth";
import { createApiKeySummary, createApiKeySummaryFromRaw } from "../utils/api-key";

const router = Router();

function parseUserSettings(settings: unknown): Record<string, unknown> {
    if (typeof settings !== "string" || settings.trim().length === 0) {
        return {};
    }

    try {
        const parsed = JSON.parse(settings);
        if (parsed && typeof parsed === "object") {
            return parsed as Record<string, unknown>;
        }
        return {};
    } catch {
        return {};
    }
}

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

        res.json({
            settings: parseUserSettings(user.settings),
            apiKey: createApiKeySummary(user.apiKey),
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

        if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "apiKey")) {
            return res.status(400).json({
                error: "ApiKeyCannotBeUpdatedHere",
                message: "Use POST /api/settings/api-key to rotate your API key."
            });
        }

        const { settings } = req.body ?? {};

        if (settings !== undefined) {
            await storage.updateUserSettings(userId, settings);
        }

        const updatedUser = await storage.getUser(userId);
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            settings: parseUserSettings(updatedUser.settings),
            apiKey: createApiKeySummary(updatedUser.apiKey)
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
        res.json({
            newApiKey: newKey,
            apiKey: createApiKeySummaryFromRaw(newKey)
        });
    } catch (error) {
        logger.error({ err: error }, "Failed to regenerate API key");
        res.status(500).json({ error: "Failed to regenerate API key" });
    }
});

export default router;
