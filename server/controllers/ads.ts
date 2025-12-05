import { Router } from "express";
import { storage } from "../storage";
import {
    insertAdPlatformSchema,
    insertPlatformConnectionSchema,
    updatePlatformConnectionSchema,
    insertAccountMappingSchema,
    updateAccountMappingSchema,
    insertClientKpiConfigSchema,
    updateClientKpiConfigSchema
} from "@shared/schema";
import { z } from "zod";

const router = Router();

// Ads Command Center endpoints
router.get("/ads/overview", async (req, res) => {
    try {
        const blendedROAS = await storage.getBlendedROAS();
        const platforms = await storage.getAdPlatforms();
        const allMetrics = await storage.getAdMetrics();

        // Calculate platform breakdown
        const platformBreakdown = await Promise.all(
            platforms.map(async (platform) => {
                const creatives = await storage.getAdCreativesByPlatform(platform.id);
                const platformMetrics = allMetrics.filter(m => m.platformId === platform.id);

                const totalSpend = platformMetrics.reduce((sum, m) => sum + parseFloat(m.spend?.toString() || '0'), 0);
                const totalRevenue = platformMetrics.reduce((sum, m) => sum + parseFloat(m.revenue?.toString() || '0'), 0);
                const platformROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

                return {
                    platformId: platform.id,
                    platformName: platform.platformName,
                    displayName: platform.displayName,
                    totalSpend,
                    totalRevenue,
                    roas: platformROAS,
                    activeCreatives: creatives.filter(c => c.status === 'active').length,
                    isActive: platform.isActive === 'true',
                };
            })
        );

        // Calculate spend pacing (monthly)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const currentDay = now.getDate();
        const monthlyBudget = 50000; // TODO: Make this configurable

        const percentOfMonthElapsed = (currentDay / daysInMonth) * 100;
        const percentOfBudgetSpent = (blendedROAS.totalSpend / monthlyBudget) * 100;

        let pacingStatus: 'healthy' | 'warning' | 'critical';
        if (percentOfBudgetSpent <= percentOfMonthElapsed + 5) {
            pacingStatus = 'healthy';
        } else if (percentOfBudgetSpent <= percentOfMonthElapsed + 15) {
            pacingStatus = 'warning';
        } else {
            pacingStatus = 'critical';
        }

        res.json({
            blendedROAS: {
                roas: blendedROAS.roas,
                totalSpend: blendedROAS.totalSpend,
                totalRevenue: blendedROAS.totalRevenue,
            },
            spendPacing: {
                monthlyBudget,
                currentSpend: blendedROAS.totalSpend,
                percentSpent: percentOfBudgetSpent,
                percentElapsed: percentOfMonthElapsed,
                status: pacingStatus,
                daysRemaining: daysInMonth - currentDay,
            },
            platformBreakdown,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Failed to fetch ads overview:", error);
        res.status(500).json({ error: "Failed to fetch ads overview" });
    }
});

router.get("/ads/creatives/top", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
        const topCreatives = await storage.getTopPerformingCreatives(limit);
        res.json(topCreatives);
    } catch (error) {
        console.error("Failed to fetch top creatives:", error);
        res.status(500).json({ error: "Failed to fetch top performing creatives" });
    }
});

router.get("/ads/creatives/bottom", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
        const bottomCreatives = await storage.getBottomPerformingCreatives(limit);
        res.json(bottomCreatives);
    } catch (error) {
        console.error("Failed to fetch bottom creatives:", error);
        res.status(500).json({ error: "Failed to fetch bottom performing creatives" });
    }
});

router.get("/ads/platforms/:platform/metrics", async (req, res) => {
    try {
        const platformName = req.params.platform;
        const platform = await storage.getAdPlatformByName(platformName);

        if (!platform) {
            return res.status(404).json({ error: "Platform not found" });
        }

        const creatives = await storage.getAdCreativesByPlatform(platform.id);
        const creativesWithMetrics = await Promise.all(
            creatives.map(async (creative) => {
                const metrics = await storage.getLatestAdMetricByCreative(creative.id);
                return { ...creative, metrics };
            })
        );

        res.json({
            platform,
            creatives: creativesWithMetrics,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch platform metrics" });
    }
});

router.post("/ads/request-review", async (req, res) => {
    try {
        const { creativeId, reason, requestedBy } = req.body;

        if (!creativeId) {
            return res.status(400).json({ error: "Creative ID is required" });
        }

        const creative = await storage.getAdCreativeById(creativeId);
        if (!creative) {
            return res.status(404).json({ error: "Creative not found" });
        }

        const metrics = await storage.getLatestAdMetricByCreative(creativeId);
        const platform = await storage.getAdPlatformById(creative.platformId);

        // TODO: Implement actual notification to Slack/Teams


        res.json({
            success: true,
            message: "Review request sent successfully",
            notifiedTeam: "media-buyers", // TODO: Make this dynamic
        });
    } catch (error) {
        console.error("Failed to send review request:", error);
        res.status(500).json({ error: "Failed to send review request" });
    }
});

// Ad Platforms CRUD
router.get("/ad-platforms", async (req, res) => {
    try {
        const platforms = await storage.getAdPlatforms();
        res.json(platforms);
    } catch (error) {
        console.error("Failed to fetch ad platforms:", error);
        res.status(500).json({ error: "Failed to fetch ad platforms" });
    }
});

router.get("/ad-platforms/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const platform = await storage.getAdPlatformById(id);
        if (!platform) {
            return res.status(404).json({ error: "Platform not found" });
        }
        res.json(platform);
    } catch (error) {
        console.error("Failed to fetch ad platform:", error);
        res.status(500).json({ error: "Failed to fetch ad platform" });
    }
});

router.get("/ad-platforms/name/:name", async (req, res) => {
    try {
        const name = req.params.name;
        const platform = await storage.getAdPlatformByName(name);
        if (!platform) {
            return res.status(404).json({ error: "Platform not found" });
        }
        res.json(platform);
    } catch (error) {
        console.error("Failed to fetch ad platform by name:", error);
        res.status(500).json({ error: "Failed to fetch ad platform" });
    }
});

router.post("/ad-platforms", async (req, res) => {
    try {
        const validatedData = insertAdPlatformSchema.parse(req.body);
        const platform = await storage.createAdPlatform(validatedData);
        res.status(201).json(platform);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Failed to create ad platform:", error);
        res.status(500).json({ error: "Failed to create ad platform" });
    }
});

router.patch("/ad-platforms/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = insertAdPlatformSchema.partial().parse(req.body);
        const platform = await storage.updateAdPlatform(id, validatedData);
        if (!platform) {
            return res.status(404).json({ error: "Platform not found" });
        }
        res.json(platform);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Failed to update ad platform:", error);
        res.status(500).json({ error: "Failed to update ad platform" });
    }
});

router.delete("/ad-platforms/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteAdPlatform(id);
        if (!deleted) {
            return res.status(404).json({ error: "Platform not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Failed to delete ad platform:", error);
        res.status(500).json({ error: "Failed to delete ad platform" });
    }
});

// Ads Integrations - Platform Connections
router.get("/ads/integrations/connections", async (req, res) => {
    try {
        const connections = await storage.getPlatformConnections();

        // Enrich with platform data
        const enrichedConnections = await Promise.all(
            connections.map(async (conn) => {
                const platform = await storage.getAdPlatformById(conn.platformId);
                return {
                    id: conn.id,
                    platformId: conn.platformId,
                    platformName: platform?.platformName || '',
                    displayName: platform?.displayName || '',
                    connectionType: conn.connectionType,
                    isActive: conn.isActive,
                    lastSyncAt: conn.lastSyncAt,
                    createdAt: conn.createdAt,
                    apiKeyName: conn.apiKeyName,
                };
            })
        );

        res.json(enrichedConnections);
    } catch (error) {
        console.error("Failed to fetch platform connections:", error);
        res.status(500).json({ error: "Failed to fetch platform connections" });
    }
});

router.delete("/ads/integrations/connections/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deletePlatformConnection(id);

        if (!deleted) {
            return res.status(404).json({ error: "Connection not found" });
        }

        res.status(204).send();
    } catch (error) {
        console.error("Failed to delete connection:", error);
        res.status(500).json({ error: "Failed to delete connection" });
    }
});

router.post("/platform-connections", async (req, res) => {
    try {
        const validatedData = insertPlatformConnectionSchema.parse(req.body);
        const connection = await storage.createPlatformConnection(validatedData);
        res.status(201).json(connection);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Failed to create platform connection:", error);
        res.status(500).json({ error: "Failed to create platform connection" });
    }
});

router.patch("/platform-connections/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updatePlatformConnectionSchema.parse(req.body);
        const connection = await storage.updatePlatformConnection(id, validatedData);
        if (!connection) {
            return res.status(404).json({ error: "Connection not found" });
        }
        res.json(connection);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Failed to update platform connection:", error);
        res.status(500).json({ error: "Failed to update platform connection" });
    }
});

router.get("/ads/integrations/oauth/init", async (req, res) => {
    try {
        const platform = req.query.platform as string;

        // TODO: Implement actual OAuth flow
        // For now, just redirect back with error
        res.status(501).json({
            error: "OAuth not implemented yet",
            message: "Please use API Key authentication for now"
        });
    } catch (error) {
        console.error("OAuth init failed:", error);
        res.status(500).json({ error: "OAuth initialization failed" });
    }
});

router.get("/ads/integrations/oauth/callback", async (req, res) => {
    try {
        // TODO: Handle OAuth callback
        res.status(501).json({ error: "OAuth callback not implemented" });
    } catch (error) {
        console.error("OAuth callback failed:", error);
        res.status(500).json({ error: "OAuth callback failed" });
    }
});

router.post("/ads/integrations/api-key", async (req, res) => {
    try {
        const { platform, apiKey, apiSecret, apiKeyName } = req.body;

        if (!platform || !apiKey) {
            return res.status(400).json({ error: "Platform and API key are required" });
        }

        // Find or create platform
        let adPlatform = await storage.getAdPlatformByName(platform);
        if (!adPlatform) {
            // Create platform if it doesn't exist
            const platformDisplayNames: Record<string, string> = {
                meta: "Facebook & Instagram",
                google: "Google Ads",
                tiktok: "TikTok Ads",
            };

            adPlatform = await storage.createAdPlatform({
                platformName: platform,
                displayName: platformDisplayNames[platform] || platform,
                isActive: "true",
            });
        }

        // Create platform connection
        const connection = await storage.createPlatformConnection({
            platformId: adPlatform.id,
            connectionType: "api_key",
            accessToken: apiKey, // TODO: Encrypt this
            apiSecret: apiSecret, // TODO: Encrypt this
            apiKeyName: apiKeyName || `${platform} API Key`,
            isActive: true,
        });

        res.status(201).json({
            success: true,
            connection: {
                id: connection.id,
                platformId: connection.platformId,
                platformName: adPlatform.platformName,
                displayName: adPlatform.displayName,
                connectionType: connection.connectionType,
                isActive: connection.isActive,
            },
        });
    } catch (error) {
        console.error("Failed to create API key connection:", error);
        res.status(500).json({ error: "Failed to create API key connection" });
    }
});

// Account Mappings
router.get("/ads/integrations/mappings", async (req, res) => {
    try {
        const mappings = await storage.getAccountMappings();
        res.json(mappings);
    } catch (error) {
        console.error("Failed to fetch account mappings:", error);
        res.status(500).json({ error: "Failed to fetch account mappings" });
    }
});

// Account Mappings - Additional Endpoints
router.get("/account-mappings", async (req, res) => {
    try {
        const mappings = await storage.getAccountMappings();
        res.json(mappings);
    } catch (error) {
        console.error("Failed to fetch account mappings:", error);
        res.status(500).json({ error: "Failed to fetch account mappings" });
    }
});

router.get("/account-mappings/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const mapping = await storage.getAccountMappingById(id);
        if (!mapping) {
            return res.status(404).json({ error: "Mapping not found" });
        }
        res.json(mapping);
    } catch (error) {
        console.error("Failed to fetch account mapping:", error);
        res.status(500).json({ error: "Failed to fetch account mapping" });
    }
});

router.get("/account-mappings/connection/:connectionId", async (req, res) => {
    try {
        const connectionId = parseInt(req.params.connectionId);
        const mappings = await storage.getAccountMappingsByConnectionId(connectionId);
        res.json(mappings);
    } catch (error) {
        console.error("Failed to fetch mappings by connection:", error);
        res.status(500).json({ error: "Failed to fetch mappings by connection" });
    }
});

router.post("/account-mappings", async (req, res) => {
    try {
        const validatedData = insertAccountMappingSchema.parse(req.body);
        const mapping = await storage.createAccountMapping(validatedData);
        res.status(201).json(mapping);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Failed to create account mapping:", error);
        res.status(500).json({ error: "Failed to create account mapping" });
    }
});

router.patch("/account-mappings/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateAccountMappingSchema.parse(req.body);
        const mapping = await storage.updateAccountMapping(id, validatedData);
        if (!mapping) {
            return res.status(404).json({ error: "Mapping not found" });
        }
        res.json(mapping);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Failed to update account mapping:", error);
        res.status(500).json({ error: "Failed to update account mapping" });
    }
});

router.delete("/account-mappings/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteAccountMapping(id);
        if (!deleted) {
            return res.status(404).json({ error: "Mapping not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Failed to delete account mapping:", error);
        res.status(500).json({ error: "Failed to delete account mapping" });
    }
});

router.post("/ads/integrations/mappings", async (req, res) => {
    try {
        const mapping = await storage.createAccountMapping(req.body);
        res.status(201).json(mapping);
    } catch (error) {
        console.error("Failed to create account mapping:", error);
        res.status(500).json({ error: "Failed to create account mapping" });
    }
});

router.delete("/ads/integrations/mappings/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteAccountMapping(id);

        if (!deleted) {
            return res.status(404).json({ error: "Mapping not found" });
        }

        res.status(204).send();
    } catch (error) {
        console.error("Failed to delete mapping:", error);
        res.status(500).json({ error: "Failed to delete mapping" });
    }
});

// Client KPIs
router.get("/ads/integrations/kpis", async (req, res) => {
    try {
        const kpis = await storage.getClientKpiConfigs();
        res.json(kpis);
    } catch (error) {
        console.error("Failed to fetch client KPIs:", error);
        res.status(500).json({ error: "Failed to fetch client KPIs" });
    }
});

// Client KPI Config - Additional Endpoints
router.get("/client-kpi-config", async (req, res) => {
    try {
        const configs = await storage.getClientKpiConfigs();
        res.json(configs);
    } catch (error) {
        console.error("Failed to fetch KPI configs:", error);
        res.status(500).json({ error: "Failed to fetch KPI configs" });
    }
});

router.get("/client-kpi-config/:clientName", async (req, res) => {
    try {
        const clientName = req.params.clientName;
        const config = await storage.getClientKpiConfigByClientName(clientName);
        if (!config) {
            return res.status(404).json({ error: "KPI config not found" });
        }
        res.json(config);
    } catch (error) {
        console.error("Failed to fetch KPI config:", error);
        res.status(500).json({ error: "Failed to fetch KPI config" });
    }
});

router.post("/client-kpi-config", async (req, res) => {
    try {
        const validatedData = insertClientKpiConfigSchema.parse(req.body);
        const config = await storage.createClientKpiConfig(validatedData);
        res.status(201).json(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Failed to create KPI config:", error);
        res.status(500).json({ error: "Failed to create KPI config" });
    }
});

router.patch("/client-kpi-config/:clientName", async (req, res) => {
    try {
        const clientName = req.params.clientName;
        const validatedData = updateClientKpiConfigSchema.parse(req.body);
        const config = await storage.updateClientKpiConfig(clientName, validatedData);
        if (!config) {
            return res.status(404).json({ error: "KPI config not found" });
        }
        res.json(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Failed to update KPI config:", error);
        res.status(500).json({ error: "Failed to update KPI config" });
    }
});

router.delete("/client-kpi-config/:clientName", async (req, res) => {
    try {
        const clientName = req.params.clientName;
        const deleted = await storage.deleteClientKpiConfig(clientName);
        if (!deleted) {
            return res.status(404).json({ error: "KPI config not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Failed to delete KPI config:", error);
        res.status(500).json({ error: "Failed to delete KPI config" });
    }
});

router.put("/ads/integrations/kpis/:clientName", async (req, res) => {
    try {
        const clientName = req.params.clientName;
        const { targetROAS, targetCPA, monthlyBudgetCap } = req.body;

        // Check if KPI config exists
        const existing = await storage.getClientKpiConfigByClientName(clientName);

        let kpi;
        if (existing) {
            // Update existing
            kpi = await storage.updateClientKpiConfig(clientName, {
                targetROAS,
                targetCPA,
                monthlyBudgetCap,
            });
        } else {
            // Create new
            kpi = await storage.createClientKpiConfig({
                clientName,
                targetROAS,
                targetCPA,
                monthlyBudgetCap,
            });
        }

        res.json(kpi);
    } catch (error) {
        console.error("Failed to update client KPIs:", error);
        res.status(500).json({ error: "Failed to update client KPIs" });
    }
});

router.delete("/ads/integrations/kpis/:clientName", async (req, res) => {
    try {
        const clientName = req.params.clientName;
        const deleted = await storage.deleteClientKpiConfig(clientName);

        if (!deleted) {
            return res.status(404).json({ error: "KPI config not found" });
        }

        res.status(204).send();
    } catch (error) {
        console.error("Failed to delete KPI config:", error);
        res.status(500).json({ error: "Failed to delete KPI config" });
    }
});

export default router;
