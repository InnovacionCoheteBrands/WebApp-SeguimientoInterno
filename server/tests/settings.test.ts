import "dotenv/config";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import settingsRouter from "../controllers/settings";
import { generateToken } from "../middleware/auth";
import { storage } from "../storage";

vi.mock("../storage", () => ({
  storage: {
    getUser: vi.fn(),
    updateUserSettings: vi.fn(),
    regenerateApiKey: vi.fn(),
  },
}));

describe("Settings API", () => {
  let app: express.Application;
  let authHeader: string;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "12345678901234567890123456789012";
    app = express();
    app.use(express.json());
    app.use("/api", settingsRouter);

    const token = generateToken({ id: "user-1", username: "operator", role: "admin" });
    authHeader = `Bearer ${token}`;
  });

  it("GET /api/settings returns null summary when api_key is null", async () => {
    vi.mocked(storage.getUser).mockResolvedValue({
      id: "user-1",
      username: "operator",
      role: "admin",
      settings: "{}",
      apiKey: null,
    } as any);

    const res = await request(app).get("/api/settings").set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body.apiKey).toEqual({
      present: false,
      masked: null,
      last4: null,
    });
  });

  it("PUT /api/settings rejects apiKey in request body", async () => {
    const res = await request(app)
      .put("/api/settings")
      .set("Authorization", authHeader)
      .send({ settings: { theme: "dark" }, apiKey: "forbidden" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ApiKeyCannotBeUpdatedHere");
    expect(storage.updateUserSettings).not.toHaveBeenCalled();
  });

  it("PUT /api/settings keeps apiKey summary valid when DB value is null", async () => {
    vi.mocked(storage.updateUserSettings).mockResolvedValue({
      id: "user-1",
      username: "operator",
      role: "admin",
      settings: JSON.stringify({ theme: "light" }),
      apiKey: null,
    } as any);
    vi.mocked(storage.getUser).mockResolvedValue({
      id: "user-1",
      username: "operator",
      role: "admin",
      settings: JSON.stringify({ theme: "light" }),
      apiKey: null,
    } as any);

    const res = await request(app)
      .put("/api/settings")
      .set("Authorization", authHeader)
      .send({ settings: { theme: "light" } });

    expect(res.status).toBe(200);
    expect(res.body.apiKey).toEqual({
      present: false,
      masked: null,
      last4: null,
    });
  });

  it("POST /api/settings/api-key returns new key one-time plus masked summary", async () => {
    vi.mocked(storage.regenerateApiKey).mockResolvedValue("mc_live_abcdefghijklmnopqrstuvwxyz0123456789");

    const res = await request(app).post("/api/settings/api-key").set("Authorization", authHeader).send({});

    expect(res.status).toBe(200);
    expect(res.body.newApiKey).toBe("mc_live_abcdefghijklmnopqrstuvwxyz0123456789");
    expect(res.body.apiKey).toEqual({
      present: true,
      masked: "mc_live_...6789",
      last4: "6789",
    });
  });
});
