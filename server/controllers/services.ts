import { Router } from "express";
import { storage } from "../storage";
import { insertServiceCatalogSchema, updateServiceCatalogSchema } from "@shared/schema";

const router = Router();

// ===========================================
// 🛠️ SERVICE CATALOG ENDPOINTS
// ===========================================

router.get("/services", async (req, res) => {
    try {
        const services = await storage.getServiceCatalog();
        res.json(services);
    } catch (error) {
        console.error("Failed to fetch service catalog:", error);
        res.status(500).json({ error: "Failed to fetch service catalog" });
    }
});

router.get("/services/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const service = await storage.getServiceCatalogById(id);
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        res.json(service);
    } catch (error) {
        console.error(`Failed to fetch service ${req.params.id}:`, error);
        res.status(500).json({ error: "Failed to fetch service" });
    }
});

router.post("/services", async (req, res) => {
    try {
        const validatedData = insertServiceCatalogSchema.parse(req.body);
        const newService = await storage.createServiceCatalog(validatedData);
        res.status(201).json(newService);
    } catch (error: any) {
        if (error.errors) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Failed to create service:", error);
        res.status(500).json({ error: "Failed to create service" });
    }
});

router.patch("/services/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateServiceCatalogSchema.parse(req.body);
        const updated = await storage.updateServiceCatalog(id, validatedData);

        if (!updated) {
            return res.status(404).json({ error: "Service not found" });
        }

        res.json(updated);
    } catch (error: any) {
        if (error.errors) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(`Failed to update service ${req.params.id}:`, error);
        res.status(500).json({ error: "Failed to update service" });
    }
});

router.delete("/services/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteServiceCatalog(id);

        if (!success) {
            return res.status(404).json({ error: "Service not found" });
        }

        res.status(204).send();
    } catch (error) {
        console.error(`Failed to delete service ${req.params.id}:`, error);
        res.status(500).json({ error: "Failed to delete service" });
    }
});

export default router;
