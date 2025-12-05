import { Router } from "express";
import { storage } from "../storage";
import { insertCampaignSchema, updateCampaignSchema } from "@shared/schema";
import { broadcastCampaignUpdate } from "../websocket";
import { z } from "zod";

const router = Router();

router.get("/campaigns", async (req, res) => {
    try {
        const campaigns = await storage.getCampaigns();
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch campaigns" });
    }
});

router.get("/campaigns/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const campaign = await storage.getCampaignById(id);
        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch campaign" });
    }
});

router.post("/campaigns", async (req, res) => {
    try {
        const validatedData = insertCampaignSchema.parse(req.body);
        const campaign = await storage.createCampaign(validatedData);
        await broadcastCampaignUpdate(campaign);
        res.status(201).json(campaign);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create campaign" });
    }
});

router.patch("/campaigns/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateCampaignSchema.parse(req.body);
        const campaign = await storage.updateCampaign(id, validatedData);
        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }
        await broadcastCampaignUpdate(campaign);
        res.json(campaign);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update campaign" });
    }
});

router.delete("/campaigns/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteCampaign(id);
        if (!deleted) {
            return res.status(404).json({ error: "Campaign not found" });
        }
        await broadcastCampaignUpdate();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete campaign" });
    }
});

export default router;
