import { Router, type Request, type Response } from "express";
import { storage } from "../storage";

const router = Router();

/**
 * GET /api/audit-logs
 * Retrieve audit logs with optional filtering.
 * Query params: limit, userId, entityType
 */
router.get("/audit-logs", async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const userId = req.query.userId as string | undefined;
        const entityType = req.query.entityType as string | undefined;

        const logs = await storage.getAuditLogs({ limit, userId, entityType });
        res.json(logs);
    } catch (error: any) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ message: "Error retrieving audit logs" });
    }
});

export default router;
