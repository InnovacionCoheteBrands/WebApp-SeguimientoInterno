import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertInstallmentSchema, updateInstallmentSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// GET /projects/:projectId/installments - Get all installments for a project
router.get("/projects/:projectId/installments", async (req, res) => {
    try {
        const projectId = parseInt(req.params.projectId);
        if (isNaN(projectId)) {
            return res.status(400).json({ error: "ID de proyecto invÃƒÂ¡lido" });
        }
        const installments = await storage.getInstallmentsByProjectId(projectId);
        res.json(installments);
    } catch (error) {
        logger.error({ err: error }, "Error fetching installments:");
        res.status(500).json({ error: "Error al obtener parcialidades" });
    }
});

// POST /projects/:projectId/installments/generate - Auto-generate installments for Iguala
router.post("/projects/:projectId/installments/generate", async (req, res) => {
    try {
        const projectId = parseInt(req.params.projectId);
        if (isNaN(projectId)) {
            return res.status(400).json({ error: "ID de proyecto invÃƒÂ¡lido" });
        }
        const installments = await storage.generateInstallmentsForProject(projectId);
        res.status(201).json(installments);
    } catch (error) {
        logger.error({ err: error }, "Error generating installments:");
        res.status(500).json({ error: "Error al generar parcialidades" });
    }
});

// GET /installments/:id - Get a single installment by ID
router.get("/installments/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const installment = await storage.getInstallmentById(id);
        if (!installment) {
            return res.status(404).json({ error: "Parcialidad no encontrada" });
        }
        res.json(installment);
    } catch (error) {
        logger.error({ err: error }, "Error fetching installment:");
        res.status(500).json({ error: "Error al obtener parcialidad" });
    }
});

// POST /installments - Create a single installment
router.post("/installments", async (req, res) => {
    try {
        const validatedData = insertInstallmentSchema.parse(req.body);
        const installment = await storage.createInstallment(validatedData);
        res.status(201).json(installment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Error creating installment:");
        res.status(500).json({ error: "Error al crear parcialidad" });
    }
});

// PATCH /installments/:id - Update an installment (mark as paid, etc.)
router.patch("/installments/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateInstallmentSchema.parse(req.body);
        const installment = await storage.updateInstallment(id, validatedData);
        if (!installment) {
            return res.status(404).json({ error: "Parcialidad no encontrada" });
        }
        res.json(installment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Error updating installment:");
        res.status(500).json({ error: "Error al actualizar parcialidad" });
    }
});

// DELETE /installments/:id - Delete an installment
router.delete("/installments/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteInstallment(id);
        if (!deleted) {
            return res.status(404).json({ error: "Parcialidad no encontrada" });
        }
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Error deleting installment:");
        res.status(500).json({ error: "Error al eliminar parcialidad" });
    }
});

export default router;
