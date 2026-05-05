import "dotenv/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import auditRouter from "../controllers/audit";
import { storage } from "../storage";
import { generateToken, requireAuth } from "../middleware/auth";

vi.mock("../storage", () => ({
    storage: {
        getAuditLogs: vi.fn(),
    },
}));

describe("Audit logs endpoint", () => {
    let app: express.Application;

    beforeEach(() => {
        process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
        vi.clearAllMocks();

        app = express();
        app.use(express.json());
        app.use("/api", requireAuth, auditRouter);
    });

    it("allows admin users to retrieve audit logs", async () => {
        const auditLogsFixture = [
            {
                id: 1,
                userId: "1",
                username: "admin",
                action: "LOGIN",
                entityType: "AUTH",
                entityId: null,
                details: "Inicio de sesion exitoso",
                metadata: null,
                ipAddress: "127.0.0.1",
                timestamp: new Date("2026-01-01T12:00:00.000Z"),
            },
        ];

        vi.mocked(storage.getAuditLogs).mockResolvedValue(auditLogsFixture);

        const adminToken = generateToken({ id: "1", username: "admin", role: "admin" });
        const res = await request(app)
            .get("/api/audit-logs?limit=25")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            {
                ...auditLogsFixture[0],
                timestamp: auditLogsFixture[0].timestamp.toISOString(),
            },
        ]);
        expect(storage.getAuditLogs).toHaveBeenCalledWith({
            limit: 25,
            userId: undefined,
            entityType: undefined,
            action: undefined,
        });
    });

    it("rejects non-admin users with 403", async () => {
        const userToken = generateToken({ id: "2", username: "demo", role: "user" });

        const res = await request(app)
            .get("/api/audit-logs")
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: "Access denied" });
        expect(storage.getAuditLogs).not.toHaveBeenCalled();
    });

    it("returns 500 without leaking internal details", async () => {
        vi.mocked(storage.getAuditLogs).mockRejectedValueOnce(new Error("boom"));

        const adminToken = generateToken({ id: "1", username: "admin", role: "admin" });
        const res = await request(app)
            .get("/api/audit-logs")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: "Error retrieving audit logs" });
    });
});
