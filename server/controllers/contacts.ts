import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertContactSchema, updateContactSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// GET /clients/:clientId/contacts - Get all contacts for a client
router.get("/clients/:clientId/contacts", async (req, res) => {
    try {
        const clientId = parseInt(req.params.clientId);
        if (isNaN(clientId)) {
            return res.status(400).json({ error: "ID de cliente invÃƒÂ¡lido" });
        }
        const contacts = await storage.getContactsByClientId(clientId);
        res.json(contacts);
    } catch (error) {
        logger.error({ err: error }, "Error fetching contacts:");
        res.status(500).json({ error: "Error al obtener contactos" });
    }
});

// GET /contacts/:id - Get a single contact by ID
router.get("/contacts/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const contact = await storage.getContactById(id);
        if (!contact) {
            return res.status(404).json({ error: "Contacto no encontrado" });
        }
        res.json(contact);
    } catch (error) {
        logger.error({ err: error }, "Error fetching contact:");
        res.status(500).json({ error: "Error al obtener contacto" });
    }
});

// POST /contacts - Create a new contact
router.post("/contacts", async (req, res) => {
    try {
        const validatedData = insertContactSchema.parse(req.body);
        const contact = await storage.createContact(validatedData);
        res.status(201).json(contact);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Error creating contact:");
        res.status(500).json({ error: "Error al crear contacto" });
    }
});

// PATCH /contacts/:id - Update a contact
router.patch("/contacts/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateContactSchema.parse(req.body);
        const contact = await storage.updateContact(id, validatedData);
        if (!contact) {
            return res.status(404).json({ error: "Contacto no encontrado" });
        }
        res.json(contact);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Error updating contact:");
        res.status(500).json({ error: "Error al actualizar contacto" });
    }
});

// DELETE /contacts/:id - Delete a contact
router.delete("/contacts/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteContact(id);
        if (!deleted) {
            return res.status(404).json({ error: "Contacto no encontrado" });
        }
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Error deleting contact:");
        res.status(500).json({ error: "Error al eliminar contacto" });
    }
});

export default router;
