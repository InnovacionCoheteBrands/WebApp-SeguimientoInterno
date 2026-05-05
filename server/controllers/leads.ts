/**
 * Leads Controller - CRM Kanban Module
 * Part of Cohete Brands Replica
 */

import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertLeadSchema, updateLeadSchema } from "@shared/schema";
import { ZodError } from "zod";
import { logAction } from "../utils/audit-helper";

const router = Router();

// GET /api/leads - Get all leads
router.get("/", async (_req: Request, res: Response) => {
    try {
        const leads = await storage.getLeads();
        res.json(leads);
    } catch (error) {
        logger.error({ err: error }, "Error fetching leads:");
        res.status(500).json({ error: "Failed to fetch leads" });
    }
});

// GET /api/leads/metrics - Get leads metrics for dashboard
router.get("/metrics", async (_req: Request, res: Response) => {
    try {
        const metrics = await storage.getLeadsMetrics();
        res.json(metrics);
    } catch (error) {
        logger.error({ err: error }, "Error fetching leads metrics:");
        res.status(500).json({ error: "Failed to fetch leads metrics" });
    }
});

// GET /api/leads/origin/:origin - Get leads by origin (for Kanban columns)
router.get("/origin/:origin", async (req: Request, res: Response) => {
    try {
        const leads = await storage.getLeadsByOrigin(req.params.origin);
        res.json(leads);
    } catch (error) {
        logger.error({ err: error }, "Error fetching leads by origin:");
        res.status(500).json({ error: "Failed to fetch leads by origin" });
    }
});

// GET /api/leads/:id - Get single lead
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const lead = await storage.getLeadById(Number(req.params.id));
        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }
        res.json(lead);
    } catch (error) {
        logger.error({ err: error }, "Error fetching lead:");
        res.status(500).json({ error: "Failed to fetch lead" });
    }
});

// POST /api/leads - Create new lead
router.post("/", async (req: Request, res: Response) => {
    try {
        const validated = insertLeadSchema.parse(req.body);
        const lead = await storage.createLead(validated);
        logAction(req, "CREATE", "LEAD", lead.id.toString(), `Creó el prospecto '${lead.name}'`);
        res.status(201).json(lead);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        logger.error({ err: error }, "Error creating lead:");
        res.status(500).json({ error: "Failed to create lead" });
    }
});

// PATCH /api/leads/:id - Update lead
router.patch("/:id", async (req: Request, res: Response) => {
    try {
        const validated = updateLeadSchema.parse(req.body);
        const lead = await storage.updateLead(Number(req.params.id), validated);
        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }
        logAction(req, "UPDATE", "LEAD", lead.id.toString(), `Actualizó al prospecto '${lead.name}'`, validated as Record<string, any>);
        res.json(lead);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        logger.error({ err: error }, "Error updating lead:");
        res.status(500).json({ error: "Failed to update lead" });
    }
});

// DELETE /api/leads/:id - Delete lead
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const deleted = await storage.deleteLead(id);
        if (!deleted) {
            return res.status(404).json({ error: "Lead not found" });
        }
        logAction(req, "DELETE", "LEAD", id.toString(), `Eliminó al prospecto #${id}`);
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Error deleting lead:");
        res.status(500).json({ error: "Failed to delete lead" });
    }
});

// POST /api/leads/:id/convert - Convert lead to client
router.post("/:id/convert", async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const result = await storage.convertLeadToClient(id);
        logAction(req, "CONVERT", "LEAD", id.toString(), `Convirtió al prospecto en cliente`);
        res.json(result);
    } catch (error) {
        logger.error({ err: error }, "Error converting lead:");
        res.status(500).json({ error: "Failed to convert lead to client" });
    }
});

export default router;
