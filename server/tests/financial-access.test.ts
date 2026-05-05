import "dotenv/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import financialRouter from "../controllers/financial";
import installmentsRouter from "../controllers/installments";
import { storage } from "../storage";
import { generateToken, requireAuth } from "../middleware/auth";

vi.mock("../storage", () => ({
    storage: {
        getTransactions: vi.fn(),
        getFinancialSummary: vi.fn(),
        getRecurringTransactions: vi.fn(),
        getMonthlyAccountsPayable: vi.fn(),
        getInstallmentsByProjectId: vi.fn(),
        markObligationAsPaid: vi.fn(),
        createAuditLog: vi.fn().mockResolvedValue(undefined),
    },
}));

describe("Financial domain access control", () => {
    let app: express.Application;
    let adminToken: string;
    let userToken: string;

    beforeEach(() => {
        process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
        vi.clearAllMocks();

        adminToken = generateToken({ id: "1", username: "admin", role: "admin" });
        userToken = generateToken({ id: "2", username: "demo", role: "user" });

        app = express();
        app.use(express.json());
        app.use("/api", requireAuth, financialRouter);
        app.use("/api", requireAuth, installmentsRouter);
    });

    it("rejects non-admin users across finance and installments endpoints", async () => {
        const endpoints = [
            "/api/transactions",
            "/api/finance/summary",
            "/api/recurring-transactions",
            "/api/finance/obligations/payables?year=2026&month=1",
            "/api/projects/1/installments",
        ];

        for (const endpoint of endpoints) {
            const res = await request(app)
                .get(endpoint)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(403);
            expect(res.body).toEqual({ error: "Access denied" });
        }

        expect(storage.getTransactions).not.toHaveBeenCalled();
        expect(storage.getFinancialSummary).not.toHaveBeenCalled();
        expect(storage.getRecurringTransactions).not.toHaveBeenCalled();
        expect(storage.getMonthlyAccountsPayable).not.toHaveBeenCalled();
        expect(storage.getInstallmentsByProjectId).not.toHaveBeenCalled();
    });

    it("allows admin users to read the core financial surfaces", async () => {
        vi.mocked(storage.getTransactions).mockResolvedValue([]);
        vi.mocked(storage.getFinancialSummary).mockResolvedValue({
            totalIncome: 0,
            totalExpenses: 0,
            netProfit: 0,
            cashFlow: 0,
            incomeByCategory: {},
            expensesByCategory: {},
            monthlyData: [],
        });
        vi.mocked(storage.getRecurringTransactions).mockResolvedValue([]);
        vi.mocked(storage.getMonthlyAccountsPayable).mockResolvedValue([]);
        vi.mocked(storage.getInstallmentsByProjectId).mockResolvedValue([]);

        const endpoints = [
            "/api/transactions",
            "/api/finance/summary",
            "/api/recurring-transactions",
            "/api/finance/obligations/payables?year=2026&month=1",
            "/api/projects/1/installments",
        ];

        for (const endpoint of endpoints) {
            const res = await request(app)
                .get(endpoint)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        }
    });

    it("rejects invalid financial query and params before storage calls", async () => {
        const invalidRequests = [
            request(app).get("/api/finance/summary?startDate=not-a-date"),
            request(app).get("/api/finance/obligations/payables?year=abc&month=13"),
            request(app).get("/api/transactions/not-a-number"),
            request(app).post("/api/finance/obligations/1/pay").send({ paidDate: "not-a-date" }),
        ];

        for (const pendingRequest of invalidRequests) {
            const res = await pendingRequest.set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
        }

        expect(storage.getFinancialSummary).not.toHaveBeenCalled();
        expect(storage.getMonthlyAccountsPayable).not.toHaveBeenCalled();
        expect(storage.markObligationAsPaid).not.toHaveBeenCalled();
    });
});
