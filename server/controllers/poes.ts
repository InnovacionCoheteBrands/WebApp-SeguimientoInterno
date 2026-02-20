/**
 * POES Controller - Standard Operating Procedures Module
 * Part of Cohete Brands Replica
 */

import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertPoeSchema, updatePoeSchema } from "@shared/schema";
import { ZodError } from "zod";

const router = Router();

// GET /api/poes - Get all active POES
router.get("/", async (_req: Request, res: Response) => {
    try {
        const poes = await storage.getPoes();
        res.json(poes);
    } catch (error) {
        logger.error({ err: error }, "Error fetching POES:");
        res.status(500).json({ error: "Failed to fetch POES" });
    }
});

// GET /api/poes/category/:category - Get POES by category
router.get("/category/:category", async (req: Request, res: Response) => {
    try {
        const poes = await storage.getPoesByCategory(req.params.category);
        res.json(poes);
    } catch (error) {
        logger.error({ err: error }, "Error fetching POES by category:");
        res.status(500).json({ error: "Failed to fetch POES by category" });
    }
});

// GET /api/poes/:id - Get single POE
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const poe = await storage.getPoeById(Number(req.params.id));
        if (!poe) {
            return res.status(404).json({ error: "POE not found" });
        }
        res.json(poe);
    } catch (error) {
        logger.error({ err: error }, "Error fetching POE:");
        res.status(500).json({ error: "Failed to fetch POE" });
    }
});

// POST /api/poes - Create new POE
router.post("/", async (req: Request, res: Response) => {
    try {
        const validated = insertPoeSchema.parse(req.body);
        const poe = await storage.createPoe(validated);
        res.status(201).json(poe);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        logger.error({ err: error }, "Error creating POE:");
        res.status(500).json({ error: "Failed to create POE" });
    }
});

// PATCH /api/poes/:id - Update POE
router.patch("/:id", async (req: Request, res: Response) => {
    try {
        const validated = updatePoeSchema.parse(req.body);
        const poe = await storage.updatePoe(Number(req.params.id), validated);
        if (!poe) {
            return res.status(404).json({ error: "POE not found" });
        }
        res.json(poe);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        logger.error({ err: error }, "Error updating POE:");
        res.status(500).json({ error: "Failed to update POE" });
    }
});

// DELETE /api/poes/:id - Soft delete POE
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const deleted = await storage.deletePoe(Number(req.params.id));
        if (!deleted) {
            return res.status(404).json({ error: "POE not found" });
        }
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Error deleting POE:");
        res.status(500).json({ error: "Failed to delete POE" });
    }
});

export default router;
