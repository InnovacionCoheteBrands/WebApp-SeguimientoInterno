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
// New Agency Module Controllers
import contactsRouter from "./controllers/contacts";
import billingProfilesRouter from "./controllers/billing-profiles";
import digitalAssetsRouter from "./controllers/digital-assets";
import clientDocumentsRouter from "./controllers/client-documents";
import installmentsRouter from "./controllers/installments";
import { requireAuth } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Public routes (no authentication required)
  app.use("/api/auth", authRouter);

  // Protected routes (require JWT authentication)
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
  // New Agency Module Routes
  app.use("/api", requireAuth, contactsRouter);
  app.use("/api", requireAuth, billingProfilesRouter);
  app.use("/api", requireAuth, digitalAssetsRouter);
  app.use("/api", requireAuth, clientDocumentsRouter);
  app.use("/api", requireAuth, installmentsRouter);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);
  return httpServer;
}
