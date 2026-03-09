import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertServiceCatalogSchema, updateServiceCatalogSchema } from "@shared/schema";
import { logAction } from "../utils/audit-helper";

const router = Router();

// ===========================================
// Ã°Å¸â€ºÂ Ã¯Â¸Â SERVICE CATALOG ENDPOINTS
// ===========================================

router.get("/services", async (req, res) => {
    try {
        const services = await storage.getServiceCatalog();
        res.json(services);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch service catalog:");
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
        logger.error({ err: error }, `Failed to fetch service ${req.params.id}:`);
        res.status(500).json({ error: "Failed to fetch service" });
    }
});

router.post("/services", async (req, res) => {
    try {
        const validatedData = insertServiceCatalogSchema.parse(req.body);
        const newService = await storage.createServiceCatalog(validatedData);
        logAction(req, "CREATE", "SERVICE", newService.id.toString(), `Agregó '${newService.name}' al catálogo de servicios`);
        res.status(201).json(newService);
    } catch (error: any) {
        if (error.errors) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Failed to create service:");
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
        logAction(req, "UPDATE", "SERVICE", id.toString(), `Actualizó el servicio '${updated.name}'`, validatedData as Record<string, any>);
        res.json(updated);
    } catch (error: any) {
        if (error.errors) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, `Failed to update service ${req.params.id}:`);
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
        logAction(req, "DELETE", "SERVICE", id.toString(), `Eliminó el servicio #${id} del catálogo`);
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, `Failed to delete service ${req.params.id}:`);
        res.status(500).json({ error: "Failed to delete service" });
    }
});

export default router;
