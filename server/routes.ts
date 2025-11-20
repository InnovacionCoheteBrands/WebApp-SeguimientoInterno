import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMissionSchema, updateMissionSchema } from "@shared/schema";
import { z } from "zod";
import { setupWebSocket, broadcastMissionUpdate } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/missions", async (req, res) => {
    try {
      const missions = await storage.getMissions();
      res.json(missions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch missions" });
    }
  });

  app.get("/api/missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mission = await storage.getMissionById(id);
      if (!mission) {
        return res.status(404).json({ error: "Mission not found" });
      }
      res.json(mission);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mission" });
    }
  });

  app.post("/api/missions", async (req, res) => {
    try {
      const validatedData = insertMissionSchema.parse(req.body);
      const mission = await storage.createMission(validatedData);
      broadcastMissionUpdate(mission);
      res.status(201).json(mission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create mission" });
    }
  });

  app.patch("/api/missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateMissionSchema.parse(req.body);
      const mission = await storage.updateMission(id, validatedData);
      if (!mission) {
        return res.status(404).json({ error: "Mission not found" });
      }
      broadcastMissionUpdate(mission);
      res.json(mission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update mission" });
    }
  });

  app.delete("/api/missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMission(id);
      if (!deleted) {
        return res.status(404).json({ error: "Mission not found" });
      }
      broadcastMissionUpdate();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mission" });
    }
  });

  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get("/api/telemetry", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 24;
      const data = await storage.getTelemetryData(limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch telemetry data" });
    }
  });

  const httpServer = createServer(app);

  setupWebSocket(httpServer);

  return httpServer;
}
