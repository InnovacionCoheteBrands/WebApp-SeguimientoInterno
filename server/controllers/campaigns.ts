import { Router } from "express";
import { storage } from "../storage";
import { insertCampaignSchema, updateCampaignSchema } from "@shared/schema";
import { broadcastCampaignUpdate } from "../websocket";
import { logAction } from "../utils/audit-helper";
import { AppError, asyncHandler } from "../middleware/error-handler";

const router = Router();

router.get("/campaigns", asyncHandler(async (_req, res) => {
    const campaigns = await storage.getCampaigns();
    res.json(campaigns);
}));

router.get("/campaigns/:id", asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("Campaign ID must be a positive integer.", 400, "INVALID_CAMPAIGN_ID");
    }

    const campaign = await storage.getCampaignById(id);
    if (!campaign) {
        throw new AppError("Campaign not found.", 404, "CAMPAIGN_NOT_FOUND");
    }

    res.json(campaign);
}));

router.post("/campaigns", asyncHandler(async (req, res) => {
    const validatedData = insertCampaignSchema.parse(req.body);
    const campaign = await storage.createCampaign(validatedData);
    logAction(req, "CREATE", "CAMPAIGN", campaign.id.toString(), `Creó la campaña '${campaign.name}'`);
    await broadcastCampaignUpdate(campaign);
    res.status(201).json(campaign);
}));

router.patch("/campaigns/:id", asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("Campaign ID must be a positive integer.", 400, "INVALID_CAMPAIGN_ID");
    }
    const validatedData = updateCampaignSchema.parse(req.body);
    const campaign = await storage.updateCampaign(id, validatedData);
    if (!campaign) {
        throw new AppError("Campaign not found.", 404, "CAMPAIGN_NOT_FOUND");
    }
    logAction(req, "UPDATE", "CAMPAIGN", id.toString(), `Actualizó la campaña '${campaign.name}'`, validatedData as Record<string, any>);
    await broadcastCampaignUpdate(campaign);
    res.json(campaign);
}));

router.delete("/campaigns/:id", asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("Campaign ID must be a positive integer.", 400, "INVALID_CAMPAIGN_ID");
    }
    const deleted = await storage.deleteCampaign(id);
    if (!deleted) {
        throw new AppError("Campaign not found.", 404, "CAMPAIGN_NOT_FOUND");
    }
    logAction(req, "DELETE", "CAMPAIGN", id.toString(), `Eliminó la campaña #${id}`);
    await broadcastCampaignUpdate();
    res.status(204).send();
}));

export default router;
