import "dotenv/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import financialRouter from "../controllers/financial";
import { storage } from "../storage";
import { generateToken, requireAuth } from "../middleware/auth";

vi.mock("../storage", () => ({
    storage: {
        getFinancialCalendar: vi.fn(),
    },
}));

describe("Financial calendar endpoint", () => {
    let app: express.Application;

    beforeEach(() => {
        process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
        vi.clearAllMocks();

        app = express();
        app.use(express.json());
        app.use("/api", requireAuth, financialRouter);
    });

    it("returns normalized events and monthly totals for admins", async () => {
        const responseFixture = {
            requestedRange: {
                startDate: "2026-01-01T00:00:00.000Z",
                endDate: "2026-01-31T23:59:59.999Z",
            },
            events: [
                {
                    id: "segmentacion:101",
                    sourceType: "segmentacion",
                    direction: "ingreso",
                    amount: 25000,
                    currency: "MXN",
                    scheduledDate: "2026-01-15T00:00:00.000Z",
                    paidDate: "2026-01-17T18:30:00.000Z",
                    status: "pagado",
                    title: "Parcialidad 1 - Proyecto Demo",
                    projectId: 9,
                    projectName: "Proyecto Demo",
                    clientId: 4,
                    clientName: "Cliente Demo",
                    transactionId: 700,
                    installmentId: 101,
                    recurringTemplateId: null,
                    isSynthetic: false,
                    month: "2026-01",
                },
                {
                    id: "transaccion_manual:900",
                    sourceType: "transaccion_manual",
                    direction: "egreso",
                    amount: 1200,
                    currency: "MXN",
                    scheduledDate: "2026-01-20T00:00:00.000Z",
                    paidDate: null,
                    status: "pendiente",
                    title: "Pago de hosting",
                    projectId: null,
                    projectName: null,
                    clientId: null,
                    clientName: null,
                    transactionId: 900,
                    installmentId: null,
                    recurringTemplateId: null,
                    isSynthetic: false,
                    month: "2026-01",
                },
            ],
            monthlyTotals: [
                {
                    month: "2026-01",
                    scheduledIncome: 25000,
                    collectedIncome: 25000,
                    scheduledExpenses: 1200,
                    paidExpenses: 0,
                    scheduledNet: 23800,
                    collectedNet: 25000,
                    eventCount: 2,
                },
            ],
        };

        vi.mocked(storage.getFinancialCalendar).mockResolvedValue(responseFixture);

        const adminToken = generateToken({ id: "1", username: "admin", role: "admin" });
        const res = await request(app)
            .get("/api/finance/payment-calendar?startDate=2026-01-01&endDate=2026-01-31")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(responseFixture);
        expect(storage.getFinancialCalendar).toHaveBeenCalledOnce();

        const [startDate, endDate] = vi.mocked(storage.getFinancialCalendar).mock.calls[0];
        expect(startDate).toBeInstanceOf(Date);
        expect(endDate).toBeInstanceOf(Date);
    });

    it("rejects non-admin users with 403", async () => {
        const userToken = generateToken({ id: "2", username: "demo", role: "user" });

        const res = await request(app)
            .get("/api/finance/payment-calendar?startDate=2026-01-01&endDate=2026-01-31")
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: "Access denied" });
        expect(storage.getFinancialCalendar).not.toHaveBeenCalled();
    });

    it("rejects requests with missing dates", async () => {
        const adminToken = generateToken({ id: "1", username: "admin", role: "admin" });

        const res = await request(app)
            .get("/api/finance/payment-calendar?startDate=2026-01-01")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "startDate and endDate are required" });
        expect(storage.getFinancialCalendar).not.toHaveBeenCalled();
    });

    it("rejects ranges longer than 24 months", async () => {
        const adminToken = generateToken({ id: "1", username: "admin", role: "admin" });

        const res = await request(app)
            .get("/api/finance/payment-calendar?startDate=2024-01-01&endDate=2026-02-02")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Date range cannot exceed 24 months" });
        expect(storage.getFinancialCalendar).not.toHaveBeenCalled();
    });

    it("returns 500 without leaking internal details", async () => {
        vi.mocked(storage.getFinancialCalendar).mockRejectedValueOnce(new Error("boom"));
        const adminToken = generateToken({ id: "1", username: "admin", role: "admin" });

        const res = await request(app)
            .get("/api/finance/payment-calendar?startDate=2026-01-01&endDate=2026-01-31")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Failed to fetch financial calendar" });
    });
});
