import type { Express } from "express";
import { type Server } from "http";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";
import campaignsRouter from "./controllers/campaigns";
import clientsRouter from "./controllers/clients";
import teamRouter from "./controllers/team";
import resourcesRouter from "./controllers/resources";
import financialRouter from "./controllers/financial";
import miscRouter from "./controllers/misc";
import projectsRouter from "./controllers/projects";
import adsRouter from "./controllers/ads";
import agentRouter from "./controllers/agent";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount all controllers at /api
  app.use("/api", campaignsRouter);
  app.use("/api", clientsRouter);
  app.use("/api", teamRouter);
  app.use("/api", resourcesRouter);
  app.use("/api", financialRouter);
  app.use("/api", miscRouter);
  app.use("/api", projectsRouter);
  app.use("/api", adsRouter);
  app.use("/api", agentRouter);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);
  return httpServer;
}
