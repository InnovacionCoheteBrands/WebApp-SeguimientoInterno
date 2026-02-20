import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertClientDocumentSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// GET /clients/:clientId/documents - Get all documents for a client
router.get("/clients/:clientId/documents", async (req, res) => {
    try {
        const clientId = parseInt(req.params.clientId);
        if (isNaN(clientId)) {
            return res.status(400).json({ error: "ID de cliente invÃƒÂ¡lido" });
        }
        const documents = await storage.getClientDocumentsByClientId(clientId);
        res.json(documents);
    } catch (error) {
        logger.error({ err: error }, "Error fetching client documents:");
        res.status(500).json({ error: "Error al obtener documentos del cliente" });
    }
});

// GET /client-documents/:id - Get a single document by ID
router.get("/client-documents/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const document = await storage.getClientDocumentById(id);
        if (!document) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }
        res.json(document);
    } catch (error) {
        logger.error({ err: error }, "Error fetching client document:");
        res.status(500).json({ error: "Error al obtener documento" });
    }
});

// POST /client-documents - Create a new document record
router.post("/client-documents", async (req, res) => {
    try {
        const validatedData = insertClientDocumentSchema.parse(req.body);
        const document = await storage.createClientDocument(validatedData);
        res.status(201).json(document);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Error creating client document:");
        res.status(500).json({ error: "Error al crear documento" });
    }
});

// DELETE /client-documents/:id - Delete a document
router.delete("/client-documents/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteClientDocument(id);
        if (!deleted) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Error deleting client document:");
        res.status(500).json({ error: "Error al eliminar documento" });
    }
});

export default router;
