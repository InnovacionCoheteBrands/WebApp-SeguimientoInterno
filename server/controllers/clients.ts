import { Router } from "express";
import { storage } from "../storage";
import { insertClientAccountSchema } from "@shared/schema";
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

router.patch("/clients/:campaignId", async (req, res) => {
    try {
        const campaignId = parseInt(req.params.campaignId);
        const validatedData = insertClientAccountSchema.partial().parse(req.body);
        const account = await storage.updateClientAccount(campaignId, validatedData);
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

router.delete("/clients/:campaignId", async (req, res) => {
    try {
        const campaignId = parseInt(req.params.campaignId);
        const deleted = await storage.deleteClientAccount(campaignId);
        if (!deleted) {
            return res.status(404).json({ error: "Client account not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete client account" });
    }
});

export default router;
