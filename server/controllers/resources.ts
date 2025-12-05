import { Router } from "express";
import { storage } from "../storage";
import { insertResourceSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/resources", async (req, res) => {
    try {
        const resources = await storage.getResources();
        res.json(resources);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch resources" });
    }
});

router.post("/resources", async (req, res) => {
    try {
        const validatedData = insertResourceSchema.parse(req.body);
        const resource = await storage.createResource(validatedData);
        res.status(201).json(resource);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create resource entry" });
    }
});

router.patch("/resources/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = insertResourceSchema.partial().parse(req.body);
        const resource = await storage.updateResource(id, validatedData);
        if (!resource) {
            return res.status(404).json({ error: "Resource entry not found" });
        }
        res.json(resource);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update resource entry" });
    }
});

router.delete("/resources/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteResource(id);
        if (!deleted) {
            return res.status(404).json({ error: "Resource entry not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete resource entry" });
    }
});

export default router;
