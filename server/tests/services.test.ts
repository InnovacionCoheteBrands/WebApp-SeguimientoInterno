import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import servicesRouter from "../controllers/services";
import { storage } from "../storage";

vi.mock("../storage", () => ({
  storage: {
    getServiceCatalog: vi.fn(),
    getServiceCatalogById: vi.fn(),
    createServiceCatalog: vi.fn(),
    updateServiceCatalog: vi.fn(),
    deleteServiceCatalog: vi.fn(),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
  },
}));

const baseService = {
  id: 1,
  name: "SEO",
  description: "Optimización orgánica",
  icon: "Search",
  defaultPrice: null,
  baseCost: null,
  supplierId: null,
  category: "Marketing",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  estimatedDeliveryDays: 0,
  requiredRoles: null,
  marketingAssetUrl: null,
};

describe("Services API", () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: "user-1", username: "operator", role: "admin" };
      next();
    });
    app.use("/api", servicesRouter);
  });

  it("GET /api/services returns the active catalog", async () => {
    vi.mocked(storage.getServiceCatalog).mockResolvedValue([baseService]);

    const res = await request(app).get("/api/services");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: "SEO", icon: "Search" });
  });

  it("POST /api/services rejects a missing name", async () => {
    const res = await request(app)
      .post("/api/services")
      .send({ description: "Optimización orgánica", icon: "Search" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(storage.createServiceCatalog).not.toHaveBeenCalled();
  });

  it("POST /api/services persists a valid service", async () => {
    vi.mocked(storage.createServiceCatalog).mockResolvedValue({ ...baseService, id: 2 });

    const res = await request(app)
      .post("/api/services")
      .send({ name: "SEO", description: "Optimización orgánica", icon: "Search" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 2, name: "SEO", icon: "Search" });
    expect(storage.createServiceCatalog).toHaveBeenCalledWith(
      expect.objectContaining({ name: "SEO", icon: "Search" }),
    );
  });

  it("PATCH /api/services/:id updates the requested service", async () => {
    vi.mocked(storage.updateServiceCatalog).mockResolvedValue({
      ...baseService,
      id: 3,
      name: "SEO Técnico",
      icon: "Code2",
    });

    const res = await request(app)
      .patch("/api/services/3")
      .send({ name: "SEO Técnico", icon: "Code2" });

    expect(res.status).toBe(200);
    expect(storage.updateServiceCatalog).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ name: "SEO Técnico", icon: "Code2" }),
    );
  });

  it("PATCH /api/services/:id returns 404 for a missing service", async () => {
    vi.mocked(storage.updateServiceCatalog).mockResolvedValue(undefined);

    const res = await request(app)
      .patch("/api/services/999")
      .send({ name: "Servicio inexistente" });

    expect(res.status).toBe(404);
  });

  it("DELETE /api/services/:id delegates to the existing soft delete", async () => {
    vi.mocked(storage.deleteServiceCatalog).mockResolvedValue(true);

    const res = await request(app).delete("/api/services/4");

    expect(res.status).toBe(204);
    expect(storage.deleteServiceCatalog).toHaveBeenCalledWith(4);
  });

  it("rejects invalid service ids", async () => {
    const res = await request(app).delete("/api/services/not-a-number");

    expect(res.status).toBe(400);
    expect(storage.deleteServiceCatalog).not.toHaveBeenCalled();
  });
});
