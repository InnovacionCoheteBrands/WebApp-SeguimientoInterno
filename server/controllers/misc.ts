import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/metrics", async (req, res) => {
    try {
        const metrics = await storage.getSystemMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch metrics" });
    }
});

router.get("/telemetry", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 24;
        const data = await storage.getTelemetryData(limit);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch telemetry data" });
    }
});

router.get("/analytics", async (req, res) => {
    try {
        const campaigns = await storage.getCampaigns();
        const telemetry = await storage.getTelemetryData(100);

        const analytics = {
            totalCampaigns: campaigns.length,
            activeCampaigns: campaigns.filter(c => c.status === "Active" || c.status === "In Progress").length,
            completedCampaigns: campaigns.filter(c => c.status === "Completed").length,
            averageProgress: campaigns.length > 0
                ? Math.round(campaigns.reduce((sum, c) => sum + c.progress, 0) / campaigns.length)
                : 0,
            priorityBreakdown: {
                critical: campaigns.filter(c => c.priority === "Critical").length,
                high: campaigns.filter(c => c.priority === "High").length,
                medium: campaigns.filter(c => c.priority === "Medium").length,
                low: campaigns.filter(c => c.priority === "Low").length,
            },
            channelBreakdown: {
                meta: campaigns.filter(c => c.channel === "Meta").length,
                googleAds: campaigns.filter(c => c.channel === "Google Ads").length,
                linkedin: campaigns.filter(c => c.channel === "LinkedIn").length,
                email: campaigns.filter(c => c.channel === "Email").length,
                other: campaigns.filter(c =>
                    c.channel !== "Meta" &&
                    c.channel !== "Google Ads" &&
                    c.channel !== "LinkedIn" &&
                    c.channel !== "Email"
                ).length,
            },
            recentActivity: telemetry.slice(0, 20).reverse(),
        };

        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

export default router;
