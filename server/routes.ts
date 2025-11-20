import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMissionSchema, 
  updateMissionSchema,
  insertFleetPositionSchema,
  insertPersonnelSchema,
  updatePersonnelSchema,
  insertPersonnelAssignmentSchema,
  insertDataHealthSchema
} from "@shared/schema";
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

  app.get("/api/fleet", async (req, res) => {
    try {
      const positions = await storage.getFleetPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fleet positions" });
    }
  });

  app.post("/api/fleet", async (req, res) => {
    try {
      const validatedData = insertFleetPositionSchema.parse(req.body);
      const position = await storage.createFleetPosition(validatedData);
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create fleet position" });
    }
  });

  app.get("/api/personnel", async (req, res) => {
    try {
      const allPersonnel = await storage.getPersonnel();
      res.json(allPersonnel);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personnel" });
    }
  });

  app.post("/api/personnel", async (req, res) => {
    try {
      const validatedData = insertPersonnelSchema.parse(req.body);
      const person = await storage.createPersonnel(validatedData);
      res.status(201).json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create personnel" });
    }
  });

  app.patch("/api/personnel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updatePersonnelSchema.parse(req.body);
      const person = await storage.updatePersonnel(id, validatedData);
      if (!person) {
        return res.status(404).json({ error: "Personnel not found" });
      }
      res.json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update personnel" });
    }
  });

  app.delete("/api/personnel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePersonnel(id);
      if (!deleted) {
        return res.status(404).json({ error: "Personnel not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete personnel" });
    }
  });

  app.get("/api/personnel/assignments", async (req, res) => {
    try {
      const assignments = await storage.getPersonnelAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.post("/api/personnel/assignments", async (req, res) => {
    try {
      const validatedData = insertPersonnelAssignmentSchema.parse(req.body);
      const assignment = await storage.createPersonnelAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  app.get("/api/data-health", async (req, res) => {
    try {
      const healthData = await storage.getDataHealth();
      res.json(healthData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data health" });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    try {
      const missions = await storage.getMissions();
      const telemetry = await storage.getTelemetryData(100);
      
      const analytics = {
        totalMissions: missions.length,
        activeMissions: missions.filter(m => m.status === "Active").length,
        completedMissions: missions.filter(m => m.status === "Completed").length,
        averageProgress: missions.length > 0 
          ? Math.round(missions.reduce((sum, m) => sum + m.progress, 0) / missions.length)
          : 0,
        priorityBreakdown: {
          critical: missions.filter(m => m.priority === "Critical").length,
          high: missions.filter(m => m.priority === "High").length,
          medium: missions.filter(m => m.priority === "Medium").length,
          low: missions.filter(m => m.priority === "Low").length,
        },
        recentActivity: telemetry.slice(0, 20).reverse(),
      };
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);

  setupWebSocket(httpServer);

  return httpServer;
}
