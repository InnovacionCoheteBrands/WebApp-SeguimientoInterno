import "dotenv/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";
import passport from "passport";
import authRouter from "../controllers/auth";
import { generateToken } from "../middleware/auth";
import { storage } from "../storage";
import { hashPassword } from "../utils/crypto";

vi.mock("../storage", () => ({
  storage: {
    getUserByUsername: vi.fn(),
    createUser: vi.fn(),
    createRefreshToken: vi.fn(),
    getRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllUserRefreshTokens: vi.fn(),
    getUser: vi.fn(),
    updateUserPassword: vi.fn(),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("passport", () => ({
  default: {
    authenticate: vi.fn(),
  },
}));

describe("Authentication Module", () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.JWT_SECRET = "12345678901234567890123456789012";
    process.env.NODE_ENV = "development";
    process.env.BASE_URL = "https://mission-control.example";
    process.env.AUTH_REFRESH_COOKIE_ENABLED = "true";
    process.env.AUTH_LEGACY_REFRESH_BODY_ENABLED = "true";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";

    vi.mocked(storage.createAuditLog).mockResolvedValue(undefined);
    vi.mocked(passport.authenticate).mockImplementation((_strategy: any, _options?: any, callback?: any) => {
      return (_req: any, _res: any, next?: any) => {
        if (typeof callback === "function") {
          callback(null, { id: "1", username: "oauth_user", role: "user", avatarUrl: null }, null);
          return;
        }
        if (typeof next === "function") {
          next();
        }
      };
    });

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", authRouter);
  });

  describe("Token Generation Middleware", () => {
    it("should generate a valid JWT token string", () => {
      const token = generateToken({ id: "123", username: "testuser", role: "user" });
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should fail validation with 400 if credentials are missing", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("ValidationError");
    });

    it("should fail with 401 for unknown user", async () => {
      vi.mocked(storage.getUserByUsername).mockResolvedValue(undefined);

      const res = await request(app).post("/api/auth/login").send({ username: "missing_user", password: "password123" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("InvalidCredentials");
    });

    it("should set refresh cookie and return token for valid user", async () => {
      const hashedPwd = await hashPassword("correct_password");
      const mockUser = {
        id: "1",
        username: "valid_user",
        password: hashedPwd,
        role: "admin",
        email: "test@example.com",
        avatarUrl: null,
        googleId: null,
        settings: "{}",
        apiKey: null,
        webhookUrl: null,
        createdAt: new Date(),
      };

      vi.mocked(storage.getUserByUsername).mockResolvedValue(mockUser as any);
      vi.mocked(storage.createRefreshToken).mockResolvedValue({
        id: 1,
        userId: "1",
        tokenHash: "dummy_hash",
        expiresAt: new Date(Date.now() + 60_000),
        revoked: false,
        createdAt: new Date(),
      } as any);

      const res = await request(app).post("/api/auth/login").send({ username: "valid_user", password: "correct_password" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("user");
      expect(res.headers["set-cookie"]?.join(";")).toContain("mc_refresh=");
      expect(storage.createRefreshToken).toHaveBeenCalled();
      expect(storage.createAuditLog).toHaveBeenCalled();
    });
  });

  describe("GET /api/auth/session", () => {
    it("should fail with 401 when cookie is missing", async () => {
      const res = await request(app).get("/api/auth/session");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("MissingRefreshCookie");
    });

    it("should return token and user without rotating refresh token", async () => {
      vi.mocked(storage.getRefreshToken).mockResolvedValue({
        id: 1,
        userId: "1",
        tokenHash: "hash",
        expiresAt: new Date(Date.now() + 60_000),
        revoked: false,
        createdAt: new Date(),
      } as any);
      vi.mocked(storage.getUser).mockResolvedValue({
        id: "1",
        username: "valid_user",
        role: "user",
        password: "x",
      } as any);

      const res = await request(app).get("/api/auth/session").set("Cookie", ["mc_refresh=raw-refresh-token"]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.username).toBe("valid_user");
      expect(storage.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should reject invalid origin in production", async () => {
      process.env.NODE_ENV = "production";
      process.env.BASE_URL = "https://allowed-origin.example";

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Origin", "https://evil.example")
        .set("Cookie", ["__Host-mc_refresh=refresh-token"])
        .set("Content-Type", "application/json")
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("InvalidOrigin");
    });

    it("should reject legacy body refresh without application/json", async () => {
      const res = await request(app).post("/api/auth/refresh").type("form").send({ refreshToken: "abc" });

      expect(res.status).toBe(415);
      expect(res.body.error).toBe("UnsupportedContentType");
    });

    it("should rotate refresh token and set cookie on valid request", async () => {
      vi.mocked(storage.getRefreshToken).mockResolvedValue({
        id: 1,
        userId: "1",
        tokenHash: "hash",
        expiresAt: new Date(Date.now() + 60_000),
        revoked: false,
        createdAt: new Date(),
      } as any);
      vi.mocked(storage.getUser).mockResolvedValue({
        id: "1",
        username: "valid_user",
        role: "user",
        password: "x",
      } as any);
      vi.mocked(storage.createRefreshToken).mockResolvedValue({
        id: 2,
        userId: "1",
        tokenHash: "new-hash",
        expiresAt: new Date(Date.now() + 60_000),
        revoked: false,
        createdAt: new Date(),
      } as any);

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", ["mc_refresh=raw-refresh-token"])
        .set("Content-Type", "application/json")
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).not.toHaveProperty("refreshToken");
      expect(res.headers["set-cookie"]?.join(";")).toContain("mc_refresh=");
      expect(storage.revokeRefreshToken).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear cookie and return 204", async () => {
      vi.mocked(storage.getRefreshToken).mockResolvedValue({
        id: 1,
        userId: "1",
        tokenHash: "hash",
        expiresAt: new Date(Date.now() + 60_000),
        revoked: false,
        createdAt: new Date(),
      } as any);

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", ["mc_refresh=raw-refresh-token"])
        .set("Content-Type", "application/json")
        .send({});

      expect(res.status).toBe(204);
      expect(res.headers["set-cookie"]?.join(";")).toContain("mc_refresh=;");
      expect(storage.revokeRefreshToken).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/auth/google/callback", () => {
    it("should redirect to /auth/callback without tokens in URL", async () => {
      vi.mocked(storage.createRefreshToken).mockResolvedValue({
        id: 1,
        userId: "1",
        tokenHash: "hash",
        expiresAt: new Date(Date.now() + 60_000),
        revoked: false,
        createdAt: new Date(),
      } as any);

      const res = await request(app).get("/api/auth/google/callback");

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/auth/callback");
      expect(res.headers.location).not.toContain("token=");
      expect(res.headers.location).not.toContain("refreshToken=");
    });
  });
});
