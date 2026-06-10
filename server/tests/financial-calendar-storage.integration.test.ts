import "dotenv/config";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { financialCalendarResponseSchema } from "@shared/schema";
import financialRouter from "../controllers/financial";
import { generateToken, requireAuth } from "../middleware/auth";

const runDatabaseIntegrationTests = process.env.RUN_DB_INTEGRATION_TESTS === "true";

describe.runIf(runDatabaseIntegrationTests)("Financial calendar storage integration", () => {
  it("returns a normalized calendar from the configured database", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api", requireAuth, financialRouter);
    const adminToken = generateToken({
      id: "readonly-calendar-integration",
      username: "readonly-calendar-integration",
      role: "admin",
    });

    const response = await request(app)
      .get("/api/finance/payment-calendar")
      .query({
        startDate: "2026-04-01T00:00:00.000Z",
        endDate: "2026-08-31T23:59:59.999Z",
      })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(financialCalendarResponseSchema.safeParse(response.body).success).toBe(true);
  });
});
