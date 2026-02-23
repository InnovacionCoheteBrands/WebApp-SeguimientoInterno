import express, { type Express } from "express";
import { type Server } from "http";
import { createServer } from "http";
import path from "path";
import fs from "fs";
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
import servicesRouter from "./controllers/services";
import suppliersRouter from "./controllers/suppliers";
// Cohete Replica Module Controllers
import leadsRouter from "./controllers/leads";
import poesRouter from "./controllers/poes";
import projectTeamRouter from "./controllers/project-team";
import usersRouter from "./controllers/users";
import { requireAuth } from "./middleware/auth";
import { setupGoogleAuth } from "./auth-google";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadDir));

  // Debug route to verify API is working
  app.get("/api/health", (req, res) => {
    console.log("Health check hit");
    res.json({ status: "ok" });
  });

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
  app.use("/api", requireAuth, servicesRouter);
  app.use("/api", requireAuth, suppliersRouter);
  // Cohete Replica Module Routes
  app.use("/api/leads", requireAuth, leadsRouter);
  app.use("/api/poes", requireAuth, poesRouter);
  app.use("/api/users", requireAuth, usersRouter);
  app.use("/api", requireAuth, projectTeamRouter);

  const httpServer = createServer(app);

  // Setup Google Auth
  setupGoogleAuth(app);

  setupWebSocket(httpServer);
  return httpServer;
}
