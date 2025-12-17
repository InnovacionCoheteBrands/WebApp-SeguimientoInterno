import { Router } from "express";
import { storage } from "../storage";
import { insertClientAccountSchema, updateClientAccountSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/clients", async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        const accounts = await storage.getClientAccounts();
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch client accounts" });
    }
});

router.get("/clients/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const account = await storage.getClientAccountById(id);
        if (!account) {
            return res.status(404).json({ error: "Client account not found" });
        }
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch client account" });
    }
});

router.post("/clients", async (req, res) => {
    try {
        const validatedData = insertClientAccountSchema.parse(req.body);
        const account = await storage.createClientAccount(validatedData);
        res.status(201).json(account);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create client account" });
    }
});

router.patch("/clients/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateClientAccountSchema.parse(req.body);
        const account = await storage.updateClientAccount(id, validatedData);
        if (!account) {
            return res.status(404).json({ error: "Client account not found" });
        }
        res.json(account);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update client account" });
    }
});

router.delete("/clients/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteClientAccount(id);
        if (!deleted) {
            return res.status(404).json({ error: "Client account not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete client account" });
    }
});

export default router;
