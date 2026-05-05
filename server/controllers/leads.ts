/**
 * Leads Controller - CRM Kanban Module
 * Part of Cohete Brands Replica
 */

import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertLeadSchema, updateLeadSchema } from "@shared/schema";
import { logAction } from "../utils/audit-helper";
import { AppError, asyncHandler } from "../middleware/error-handler";

const router = Router();

const parseLeadId = (rawId: string): number => {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("Lead ID must be a positive integer.", 400, "INVALID_LEAD_ID");
    }
    return id;
};

// GET /api/leads - Get all leads
router.get("/", asyncHandler(async (_req: Request, res: Response) => {
    const leads = await storage.getLeads();
    res.json(leads);
}));

// GET /api/leads/metrics - Get leads metrics for dashboard
router.get("/metrics", asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await storage.getLeadsMetrics();
    res.json(metrics);
}));

// GET /api/leads/origin/:origin - Get leads by origin (for Kanban columns)
router.get("/origin/:origin", asyncHandler(async (req: Request, res: Response) => {
    const leads = await storage.getLeadsByOrigin(req.params.origin);
    res.json(leads);
}));

// GET /api/leads/:id - Get single lead
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
    const id = parseLeadId(req.params.id);
    const lead = await storage.getLeadById(id);
    if (!lead) {
        throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
    }
    res.json(lead);
}));

// POST /api/leads - Create new lead
router.post("/", asyncHandler(async (req: Request, res: Response) => {
    const validated = insertLeadSchema.parse(req.body);
    const lead = await storage.createLead(validated);
    logAction(req, "CREATE", "LEAD", lead.id.toString(), `Creó el prospecto '${lead.name}'`);
    res.status(201).json(lead);
}));

// PATCH /api/leads/:id - Update lead
router.patch("/:id", asyncHandler(async (req: Request, res: Response) => {
    const id = parseLeadId(req.params.id);
    const validated = updateLeadSchema.parse(req.body);
    const lead = await storage.updateLead(id, validated);
    if (!lead) {
        throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
    }
    logAction(req, "UPDATE", "LEAD", lead.id.toString(), `Actualizó al prospecto '${lead.name}'`, validated as Record<string, any>);
    res.json(lead);
}));

// DELETE /api/leads/:id - Delete lead
router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
    const id = parseLeadId(req.params.id);
    const deleted = await storage.deleteLead(id);
    if (!deleted) {
        throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
    }
    logAction(req, "DELETE", "LEAD", id.toString(), `Eliminó al prospecto #${id}`);
    res.status(204).send();
}));

// POST /api/leads/:id/convert - Convert lead to client
router.post("/:id/convert", asyncHandler(async (req: Request, res: Response) => {
    const id = parseLeadId(req.params.id);
    try {
        const result = await storage.convertLeadToClient(id);
        logAction(req, "CONVERT", "LEAD", id.toString(), `Convirtió al prospecto en cliente`);
        res.json(result);
    } catch (error) {
        logger.error({ err: error, id }, "Error converting lead");
        if (error instanceof Error && error.message.includes("ya fue convertido")) {
            throw new AppError(error.message, 409, "LEAD_ALREADY_CONVERTED");
        }
        if (error instanceof Error && error.message === "Lead not found") {
            throw new AppError("Lead not found.", 404, "LEAD_NOT_FOUND");
        }
        throw error;
    }
}));

export default router;
