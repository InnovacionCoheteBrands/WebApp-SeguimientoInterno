import { Router } from "express";
import { storage } from "../storage";
import { insertAgencyRoleSchema, updateAgencyRoleSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/agency/roles", async (req, res) => {
    try {
        const roles = await storage.getAgencyRoles();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch agency roles" });
    }
});

router.post("/agency/roles", async (req, res) => {
    try {
        const validatedData = insertAgencyRoleSchema.parse(req.body);
        const role = await storage.createAgencyRole(validatedData);
        res.status(201).json(role);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create agency role" });
    }
});

router.patch("/agency/roles/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateAgencyRoleSchema.parse(req.body);
        const role = await storage.updateAgencyRole(id, validatedData);
        if (!role) {
            return res.status(404).json({ error: "Agency role not found" });
        }
        res.json(role);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update agency role" });
    }
});

router.delete("/agency/roles/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteAgencyRole(id);
        if (!deleted) {
            return res.status(404).json({ error: "Agency role not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete agency role" });
    }
});

export default router;
