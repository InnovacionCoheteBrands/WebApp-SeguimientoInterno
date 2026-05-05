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
import agentRouter from "./controllers/agent";
import agencyRouter from "./controllers/agency";
import settingsRouter from "./controllers/settings";
import contactsRouter from "./controllers/contacts";
import billingProfilesRouter from "./controllers/billing-profiles";
import digitalAssetsRouter from "./controllers/digital-assets";
import clientDocumentsRouter from "./controllers/client-documents";
import installmentsRouter from "./controllers/installments";
import servicesRouter from "./controllers/services";
import suppliersRouter from "./controllers/suppliers";
import leadsRouter from "./controllers/leads";
import poesRouter from "./controllers/poes";
import projectTeamRouter from "./controllers/project-team";
import usersRouter from "./controllers/users";
import auditRouter from "./controllers/audit";
import { requireAuth } from "./middleware/auth";
import { asyncHandler } from "./middleware/error-handler";
import { setupGoogleAuth } from "./auth-google";
import { checkDatabaseConnection } from "../db";

/**
 * Monta rutas HTTP y WebSocket en orden fijo:
 * - /api/health y /uploads tienen reglas propias (uploads exige sesion).
 * - /api/auth queda publico para login y OAuth.
 * - El resto de /api/* pasa por requireAuth antes del controlador correspondiente.
 * - Google OAuth y WS se registran sobre el mismo httpServer al final.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", requireAuth, express.static(uploadDir));

  app.get("/api/health", asyncHandler(async (_req, res) => {
    const isDatabaseConnected = await checkDatabaseConnection();
    res.status(isDatabaseConnected ? 200 : 503).json({
      status: isDatabaseConnected ? "ok" : "degraded",
      database: isDatabaseConnected ? "up" : "down",
    });
  }));

  app.use("/api/auth", authRouter);

  app.use("/api", requireAuth, campaignsRouter);
  app.use("/api", requireAuth, clientsRouter);
  app.use("/api", requireAuth, teamRouter);
  app.use("/api", requireAuth, resourcesRouter);
  app.use("/api", requireAuth, financialRouter);
  app.use("/api", requireAuth, miscRouter);
  app.use("/api", requireAuth, projectsRouter);
  app.use("/api", requireAuth, agentRouter);
  app.use("/api", requireAuth, agencyRouter);
  app.use("/api", requireAuth, settingsRouter);
  app.use("/api", requireAuth, contactsRouter);
  app.use("/api", requireAuth, billingProfilesRouter);
  app.use("/api", requireAuth, digitalAssetsRouter);
  app.use("/api", requireAuth, clientDocumentsRouter);
  app.use("/api", requireAuth, installmentsRouter);
  app.use("/api", requireAuth, servicesRouter);
  app.use("/api", requireAuth, suppliersRouter);
  app.use("/api/leads", requireAuth, leadsRouter);
  app.use("/api/poes", requireAuth, poesRouter);
  app.use("/api/users", requireAuth, usersRouter);
  app.use("/api", requireAuth, projectTeamRouter);
  app.use("/api", requireAuth, auditRouter);

  const httpServer = createServer(app);

  setupGoogleAuth(app);
  setupWebSocket(httpServer);

  return httpServer;
}
