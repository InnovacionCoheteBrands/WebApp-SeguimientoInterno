import { Router } from "express";
import { storage } from "../storage";
import { insertDigitalAssetSchema, updateDigitalAssetSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// GET /clients/:clientId/digital-assets - Get all digital assets for a client
router.get("/clients/:clientId/digital-assets", async (req, res) => {
    try {
        const clientId = parseInt(req.params.clientId);
        if (isNaN(clientId)) {
            return res.status(400).json({ error: "ID de cliente inválido" });
        }
        const assets = await storage.getDigitalAssetsByClientId(clientId);
        res.json(assets);
    } catch (error) {
        console.error("Error fetching digital assets:", error);
        res.status(500).json({ error: "Error al obtener activos digitales" });
    }
});

// GET /digital-assets/expiring - Get digital assets expiring within N days
router.get("/digital-assets/expiring", async (req, res) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const assets = await storage.getExpiringDigitalAssets(days);
        res.json(assets);
    } catch (error) {
        console.error("Error fetching expiring assets:", error);
        res.status(500).json({ error: "Error al obtener activos por vencer" });
    }
});

// GET /digital-assets/:id - Get a single digital asset by ID
router.get("/digital-assets/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const asset = await storage.getDigitalAssetById(id);
        if (!asset) {
            return res.status(404).json({ error: "Activo digital no encontrado" });
        }
        res.json(asset);
    } catch (error) {
        console.error("Error fetching digital asset:", error);
        res.status(500).json({ error: "Error al obtener activo digital" });
    }
});

// POST /digital-assets - Create a new digital asset
router.post("/digital-assets", async (req, res) => {
    try {
        const validatedData = insertDigitalAssetSchema.parse(req.body);
        const asset = await storage.createDigitalAsset(validatedData);
        res.status(201).json(asset);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Error creating digital asset:", error);
        res.status(500).json({ error: "Error al crear activo digital" });
    }
});

// PATCH /digital-assets/:id - Update a digital asset
router.patch("/digital-assets/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateDigitalAssetSchema.parse(req.body);
        const asset = await storage.updateDigitalAsset(id, validatedData);
        if (!asset) {
            return res.status(404).json({ error: "Activo digital no encontrado" });
        }
        res.json(asset);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Error updating digital asset:", error);
        res.status(500).json({ error: "Error al actualizar activo digital" });
    }
});

// DELETE /digital-assets/:id - Delete a digital asset
router.delete("/digital-assets/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteDigitalAsset(id);
        if (!deleted) {
            return res.status(404).json({ error: "Activo digital no encontrado" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting digital asset:", error);
        res.status(500).json({ error: "Error al eliminar activo digital" });
    }
});

export default router;
