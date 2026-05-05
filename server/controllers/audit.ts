import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";

const router = Router();

/**
 * GET /api/audit-logs
 * Retrieve audit logs with optional filtering.
 * Query params: limit, userId, entityType, action, agentOnly
 */
router.get("/audit-logs", async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const userId = req.query.userId as string | undefined;
        const entityType = req.query.entityType as string | undefined;
        const action = req.query.action as string | undefined;
        const agentOnly = req.query.agentOnly === "true";

        const logs = await storage.getAuditLogs({ limit, userId, entityType, action });

        const filtered = agentOnly
            ? logs.filter((log) => typeof log.details === "string" && log.details.includes("[Agente IA"))
            : logs;

        res.json(filtered);
    } catch (error) {
        logger.error({ err: error }, "Error fetching audit logs");
        res.status(500).json({ message: "Error retrieving audit logs" });
    }
});

export default router;
