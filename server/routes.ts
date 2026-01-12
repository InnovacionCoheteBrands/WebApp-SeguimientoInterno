import type { Express } from "express";
import { type Server } from "http";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";
import authRouter from "./controllers/auth";
import campaignsRouter from "./controllers/campaigns";
import clientsRouter from "./controllers/clients";
import teamRouter from "./controllers/team";
import resourcesRouter from "./controllers/resources";
import financialRouter from "./controllers/financial";
import miscRouter from "./controllers/misc";
import projectsRouter from "./controllers/projects";
import adsRouter from "./controllers/ads";
import agentRouter from "./controllers/agent";
import agencyRouter from "./controllers/agency";
import settingsRouter from "./controllers/settings";
import { requireAuth } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Public routes (no authentication required)
  app.use("/api/auth", authRouter);

  // Protected routes (require JWT authentication)
  // Note: For development/demo mode, you can comment out requireAuth
  const isDevMode = process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true';

  if (isDevMode) {
    console.warn('⚠️  WARNING: Authentication is disabled in development mode (SKIP_AUTH=true)');
    app.use("/api", campaignsRouter);
    app.use("/api", clientsRouter);
    app.use("/api", teamRouter);
    app.use("/api", resourcesRouter);
    app.use("/api", financialRouter);
    app.use("/api", miscRouter);
    app.use("/api", projectsRouter);
    app.use("/api", adsRouter);
    app.use("/api", agentRouter);
    app.use("/api", agencyRouter);
    app.use("/api", settingsRouter);
  } else {
    app.use("/api", requireAuth, campaignsRouter);
    app.use("/api", requireAuth, clientsRouter);
    app.use("/api", requireAuth, teamRouter);
    app.use("/api", requireAuth, resourcesRouter);
    app.use("/api", requireAuth, financialRouter);
    app.use("/api", requireAuth, miscRouter);
    app.use("/api", requireAuth, projectsRouter);
    app.use("/api", requireAuth, adsRouter);
    app.use("/api", requireAuth, agentRouter);
    app.use("/api", requireAuth, agencyRouter);
    app.use("/api", requireAuth, settingsRouter);
  }

  const httpServer = createServer(app);
  setupWebSocket(httpServer);
  return httpServer;
}
