import { Router } from "express";
import express from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertDigitalAssetSchema, updateDigitalAssetSchema } from "@shared/schema";
import { z } from "zod";
import { upload, uploadDir } from "../middleware/upload";
import { logAction } from "../utils/audit-helper";

const router = Router();

// Serve uploads statically for authenticated access via /api/uploads
router.use('/uploads', express.static(uploadDir));

// GET /clients/:clientId/digital-assets - Get all digital assets for a client
router.get("/clients/:clientId/digital-assets", async (req, res) => {
    try {
        const clientId = parseInt(req.params.clientId);
        if (isNaN(clientId)) {
            return res.status(400).json({ error: "ID de cliente invÃ¡lido" });
        }
        const assets = await storage.getDigitalAssetsByClientId(clientId);
        res.json(assets);
    } catch (error) {
        logger.error({ err: error }, "Error fetching digital assets:");
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
        logger.error({ err: error }, "Error fetching expiring assets:");
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
        logger.error({ err: error }, "Error fetching digital asset:");
        res.status(500).json({ error: "Error al obtener activo digital" });
    }
});

// POST /digital-assets - Create a new digital asset with optional files
router.post("/digital-assets", upload.array('files', 5), async (req, res) => {
    try {
        const formData = req.body;
        const payload: any = {
            ...formData,
            clientId: parseInt(formData.clientId),
            cost: formData.cost ? String(formData.cost) : undefined,
            autoRenew: formData.autoRenew === 'true',
            alertDaysBefore: formData.alertDaysBefore ? parseInt(formData.alertDaysBefore) : 30,
            assignedManagerId: formData.assignedManagerId ? parseInt(formData.assignedManagerId) : undefined,
            files: []
        };

        if ((req as any).files && Array.isArray((req as any).files)) {
            const uploadedFiles = (req as any).files.map((file: any) => ({
                name: file.originalname,
                url: `/uploads/${file.filename}`,
                type: file.mimetype,
                size: file.size
            }));
            payload.files = uploadedFiles;
        }

        const validatedData = insertDigitalAssetSchema.parse(payload);
        const asset = await storage.createDigitalAsset(validatedData);
        logAction(req, "CREATE", "DIGITAL_ASSET", asset.id.toString(), `Creó activo digital '${asset.name}'`);
        res.status(201).json(asset);
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error({ err: error.errors }, "Validation error:");
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Error creating digital asset:");
        res.status(500).json({ error: "Error al crear activo digital" });
    }
});

// PATCH /digital-assets/:id - Update a digital asset
router.patch("/digital-assets/:id", upload.array('files', 5), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const formData = req.body;
        const payload: any = { ...formData };

        if (payload.clientId) payload.clientId = parseInt(payload.clientId);
        if (payload.cost) payload.cost = String(payload.cost);
        if (payload.autoRenew !== undefined) payload.autoRenew = payload.autoRenew === 'true';
        if (payload.alertDaysBefore) payload.alertDaysBefore = parseInt(payload.alertDaysBefore);

        if ((req as any).files && Array.isArray((req as any).files) && (req as any).files.length > 0) {
            const newFiles = (req as any).files.map((file: any) => ({
                name: file.originalname,
                url: `/uploads/${file.filename}`,
                type: file.mimetype,
                size: file.size
            }));

            const existingAsset = await storage.getDigitalAssetById(id);
            const currentFiles = (existingAsset?.files as any[]) || [];

            let filesToKeep = currentFiles;
            if (formData.keptFiles) {
                try {
                    const kept = JSON.parse(formData.keptFiles);
                    filesToKeep = kept;
                } catch { }
            }

            payload.files = [...filesToKeep, ...newFiles];
        } else if (formData.keptFiles) {
            try {
                payload.files = JSON.parse(formData.keptFiles);
            } catch { }
        }

        const validatedData = updateDigitalAssetSchema.parse(payload);
        const asset = await storage.updateDigitalAsset(id, validatedData);
        if (!asset) {
            return res.status(404).json({ error: "Activo digital no encontrado" });
        }
        logAction(req, "UPDATE", "DIGITAL_ASSET", id.toString(), `Actualizó activo digital '${asset.name}'`, validatedData as Record<string, any>);
        res.json(asset);
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error({ err: error.errors }, "Validation error:");
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Error updating digital asset:");
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
        logAction(req, "DELETE", "DIGITAL_ASSET", id.toString(), `Eliminó activo digital #${id}`);
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Error deleting digital asset:");
        res.status(500).json({ error: "Error al eliminar activo digital" });
    }
});

export default router;
