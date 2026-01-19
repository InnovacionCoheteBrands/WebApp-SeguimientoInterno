import { Router } from "express";
import { storage } from "../storage";
import { insertBillingProfileSchema, updateBillingProfileSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// GET /clients/:clientId/billing-profiles - Get all billing profiles for a client
router.get("/clients/:clientId/billing-profiles", async (req, res) => {
    try {
        const clientId = parseInt(req.params.clientId);
        if (isNaN(clientId)) {
            return res.status(400).json({ error: "ID de cliente inválido" });
        }
        const profiles = await storage.getBillingProfilesByClientId(clientId);
        res.json(profiles);
    } catch (error) {
        console.error("Error fetching billing profiles:", error);
        res.status(500).json({ error: "Error al obtener perfiles de facturación" });
    }
});

// GET /billing-profiles/:id - Get a single billing profile by ID
router.get("/billing-profiles/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const profile = await storage.getBillingProfileById(id);
        if (!profile) {
            return res.status(404).json({ error: "Perfil de facturación no encontrado" });
        }
        res.json(profile);
    } catch (error) {
        console.error("Error fetching billing profile:", error);
        res.status(500).json({ error: "Error al obtener perfil de facturación" });
    }
});

// POST /billing-profiles - Create a new billing profile
router.post("/billing-profiles", async (req, res) => {
    try {
        const validatedData = insertBillingProfileSchema.parse(req.body);
        const profile = await storage.createBillingProfile(validatedData);
        res.status(201).json(profile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Error creating billing profile:", error);
        res.status(500).json({ error: "Error al crear perfil de facturación" });
    }
});

// PATCH /billing-profiles/:id - Update a billing profile
router.patch("/billing-profiles/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateBillingProfileSchema.parse(req.body);
        const profile = await storage.updateBillingProfile(id, validatedData);
        if (!profile) {
            return res.status(404).json({ error: "Perfil de facturación no encontrado" });
        }
        res.json(profile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Error updating billing profile:", error);
        res.status(500).json({ error: "Error al actualizar perfil de facturación" });
    }
});

// DELETE /billing-profiles/:id - Delete a billing profile
router.delete("/billing-profiles/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteBillingProfile(id);
        if (!deleted) {
            return res.status(404).json({ error: "Perfil de facturación no encontrado" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting billing profile:", error);
        res.status(500).json({ error: "Error al eliminar perfil de facturación" });
    }
});

export default router;
