import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertDigitalAssetSchema, updateDigitalAssetSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: diskStorage });
const router = Router();

// Serve uploads statically - middleware allows access to uploaded files
router.use('/uploads', express.static(uploadDir));

// GET /clients/:clientId/digital-assets - Get all digital assets for a client
router.get("/clients/:clientId/digital-assets", async (req, res) => {
    try {
        const clientId = parseInt(req.params.clientId);
        if (isNaN(clientId)) {
            return res.status(400).json({ error: "ID de cliente invÃƒÂ¡lido" });
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
router.post("/digital-assets", upload.array('files'), async (req, res) => {
    try {
        // Parse the body as it comes as form-data strings
        const formData = req.body;

        // Coerce types from string (form-data) to expected schema types
        const payload: any = {
            ...formData,
            clientId: parseInt(formData.clientId),
            cost: formData.cost ? String(formData.cost) : undefined, // Schema expects string or number, keep loose
            autoRenew: formData.autoRenew === 'true',
            alertDaysBefore: formData.alertDaysBefore ? parseInt(formData.alertDaysBefore) : 30,
            assignedManagerId: formData.assignedManagerId ? parseInt(formData.assignedManagerId) : undefined,
            files: []
        };

        // Handle uploaded files
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
router.patch("/digital-assets/:id", upload.array('files'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Parse the body
        const formData = req.body;
        const payload: any = { ...formData }; // Start with raw body

        // Coerce numeric/boolean fields if they exist in update
        if (payload.clientId) payload.clientId = parseInt(payload.clientId);
        if (payload.cost) payload.cost = String(payload.cost);
        if (payload.autoRenew !== undefined) payload.autoRenew = payload.autoRenew === 'true';
        if (payload.alertDaysBefore) payload.alertDaysBefore = parseInt(payload.alertDaysBefore);

        // Handle files - Append to existing or replace? 
        // Logic: specific implementation usually requires retrieving existing files + new ones.
        // For simplicity: If new files are uploaded, we ADD them to existing. 
        // NOTE: The request body might also contain a 'existingFiles' JSON string if we want to support deleting from frontend.

        if ((req as any).files && Array.isArray((req as any).files) && (req as any).files.length > 0) {
            const newFiles = (req as any).files.map((file: any) => ({
                name: file.originalname,
                url: `/uploads/${file.filename}`,
                type: file.mimetype,
                size: file.size
            }));

            // Retrieve existing asset to merge files
            const existingAsset = await storage.getDigitalAssetById(id);
            const currentFiles = (existingAsset?.files as any[]) || [];

            // Allow frontend to specify which *old* files to keep via a JSON string 'keptFiles'
            // If keptFiles is not sent, we assume appending to all existing.
            // If keptFiles IS sent, we filter existing.
            let filesToKeep = currentFiles;
            if (formData.keptFiles) {
                try {
                    const kept = JSON.parse(formData.keptFiles); // Array of file objects
                    // Simple validation/filtering could go here
                    filesToKeep = kept;
                } catch (e) { }
            }

            payload.files = [...filesToKeep, ...newFiles];
        } else if (formData.keptFiles) {
            // Only deleting files, no new uploads
            try {
                payload.files = JSON.parse(formData.keptFiles);
            } catch (e) { }
        }
        // If neither new files nor keptFiles provided, we generally don't touch the 'files' column 
        // unless explicitly intended. Schema partial() allows undefined.

        const validatedData = updateDigitalAssetSchema.parse(payload);
        const asset = await storage.updateDigitalAsset(id, validatedData);
        if (!asset) {
            return res.status(404).json({ error: "Activo digital no encontrado" });
        }
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
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Error deleting digital asset:");
        res.status(500).json({ error: "Error al eliminar activo digital" });
    }
});

export default router;
