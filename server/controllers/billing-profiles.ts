import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertBillingProfileSchema, updateBillingProfileSchema } from "@shared/schema";
import { z } from "zod";
import { logAction } from "../utils/audit-helper";

const router = Router();

// GET /clients/:clientId/billing-profiles - Get all billing profiles for a client
router.get("/clients/:clientId/billing-profiles", async (req, res) => {
    try {
        const clientId = parseInt(req.params.clientId);
        if (isNaN(clientId)) {
            return res.status(400).json({ error: "ID de cliente invÃƒÂ¡lido" });
        }
        const profiles = await storage.getBillingProfilesByClientId(clientId);
        res.json(profiles);
    } catch (error) {
        logger.error({ err: error }, "Error fetching billing profiles:");
        res.status(500).json({ error: "Error al obtener perfiles de facturaciÃƒÂ³n" });
    }
});

// GET /billing-profiles/:id - Get a single billing profile by ID
router.get("/billing-profiles/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const profile = await storage.getBillingProfileById(id);
        if (!profile) {
            return res.status(404).json({ error: "Perfil de facturaciÃƒÂ³n no encontrado" });
        }
        res.json(profile);
    } catch (error) {
        logger.error({ err: error }, "Error fetching billing profile:");
        res.status(500).json({ error: "Error al obtener perfil de facturaciÃƒÂ³n" });
    }
});

// POST /billing-profiles - Create a new billing profile
router.post("/billing-profiles", async (req, res) => {
    try {
        const validatedData = insertBillingProfileSchema.parse(req.body);
        const profile = await storage.createBillingProfile(validatedData);
        logAction(req, "CREATE", "BILLING_PROFILE", profile.id.toString(), `Creó perfil de facturación '${profile.businessName}'`);
        res.status(201).json(profile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Error creating billing profile:");
        res.status(500).json({ error: "Error al crear perfil de facturaciÃƒÂ³n" });
    }
});

// PATCH /billing-profiles/:id - Update a billing profile
router.patch("/billing-profiles/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateBillingProfileSchema.parse(req.body);
        const profile = await storage.updateBillingProfile(id, validatedData);
        if (!profile) {
            return res.status(404).json({ error: "Perfil de facturaciÃƒÂ³n no encontrado" });
        }
        logAction(req, "UPDATE", "BILLING_PROFILE", id.toString(), `Actualizó perfil de facturación '${profile.businessName}'`, validatedData as Record<string, any>);
        res.json(profile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Error updating billing profile:");
        res.status(500).json({ error: "Error al actualizar perfil de facturaciÃƒÂ³n" });
    }
});

// DELETE /billing-profiles/:id - Delete a billing profile
router.delete("/billing-profiles/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteBillingProfile(id);
        if (!deleted) {
            return res.status(404).json({ error: "Perfil de facturaciÃƒÂ³n no encontrado" });
        }
        logAction(req, "DELETE", "BILLING_PROFILE", id.toString(), `Eliminó perfil de facturación #${id}`);
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Error deleting billing profile:");
        res.status(500).json({ error: "Error al eliminar perfil de facturaciÃƒÂ³n" });
    }
});

export default router;
