import "dotenv/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import projectsRouter from "../controllers/projects";
import { globalErrorHandler } from "../middleware/error-handler";
import { generateToken, requireAuth } from "../middleware/auth";
import { storage } from "../storage";

vi.mock("../storage", () => ({
  storage: {
    getProjectFinancialAnalytics: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("project financial analytics access", () => {
  let app: express.Application;
  let adminToken: string;
  let userToken: string;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
    vi.clearAllMocks();

    adminToken = generateToken({ id: "1", username: "admin", role: "admin" });
    userToken = generateToken({ id: "2", username: "user", role: "user" });

    app = express();
    app.use(express.json());
    app.use("/api", requireAuth, projectsRouter);
    app.use(globalErrorHandler);
  });

  it("rejects non-admin users before storage is read", async () => {
    const res = await request(app)
      .get("/api/projects/financial-analytics")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: "PROJECT_FINANCIAL_ANALYTICS_FORBIDDEN",
      message: "Access denied",
    });
    expect(storage.getProjectFinancialAnalytics).not.toHaveBeenCalled();
  });

  it("allows admin read and does not call project mutations", async () => {
    vi.mocked(storage.getProjectFinancialAnalytics).mockResolvedValue({
      metadata: {
        generatedAt: "2026-06-09T12:00:00.000Z",
        readOnly: true,
        currency: "MXN",
        accountingSourceOfTruth: "paid_financial_transactions",
        globalWarnings: [],
      },
      summary: {
        totalProjects: 0,
        quotationTotal: 0,
        totalCollectedReal: 0,
        totalCollectedOperational: 0,
        pendingReal: 0,
        pendingOperational: 0,
        totalCollectionDifference: 0,
        reconciledProjects: 0,
        projectsWithDiscrepancies: 0,
        pendingProjects: 0,
        monthlyIncomeTotal: 0,
        monthlyCostTotal: 0,
        monthlyProfitTotal: 0,
        globalMargin: null,
        globalWarnings: [],
      },
      projects: [],
    });

    const res = await request(app)
      .get("/api/projects/financial-analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metadata.readOnly).toBe(true);
    expect(res.body.summary.totalProjects).toBe(0);
    expect(storage.getProjectFinancialAnalytics).toHaveBeenCalledTimes(1);
    expect(storage.createProject).not.toHaveBeenCalled();
    expect(storage.updateProject).not.toHaveBeenCalled();
    expect(storage.deleteProject).not.toHaveBeenCalled();
  });
});
