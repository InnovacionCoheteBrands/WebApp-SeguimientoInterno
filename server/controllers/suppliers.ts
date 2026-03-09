import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertSupplierSchema, updateSupplierSchema } from "@shared/schema";
import { logAction } from "../utils/audit-helper";

const router = Router();

// ===========================================
// 🏭 SUPPLIERS CRUD ENDPOINTS
// ===========================================

// GET all suppliers
router.get("/suppliers", async (req, res) => {
    try {
        const activeOnly = req.query.active === "true";
        const data = activeOnly
            ? await storage.getActiveSuppliers()
            : await storage.getSuppliers();
        res.json(data);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch suppliers");
        res.status(500).json({ error: "Failed to fetch suppliers" });
    }
});

// GET single supplier
router.get("/suppliers/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
        const supplier = await storage.getSupplierById(id);
        if (!supplier) return res.status(404).json({ error: "Supplier not found" });
        res.json(supplier);
    } catch (error) {
        logger.error({ err: error }, `Failed to fetch supplier ${req.params.id}`);
        res.status(500).json({ error: "Failed to fetch supplier" });
    }
});

// POST create supplier
router.post("/suppliers", async (req, res) => {
    try {
        const validated = insertSupplierSchema.parse(req.body);
        const newSupplier = await storage.createSupplier(validated);
        logAction(req, "CREATE", "SUPPLIER", newSupplier.id.toString(), `Registró al proveedor '${newSupplier.name}'`);
        res.status(201).json(newSupplier);
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ error: error.errors });
        logger.error({ err: error }, "Failed to create supplier");
        res.status(500).json({ error: "Failed to create supplier" });
    }
});

// PATCH update supplier
router.patch("/suppliers/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
        const validated = updateSupplierSchema.parse(req.body);
        const updated = await storage.updateSupplier(id, validated);
        if (!updated) return res.status(404).json({ error: "Supplier not found" });
        logAction(req, "UPDATE", "SUPPLIER", id.toString(), `Actualizó datos del proveedor '${updated.name}'`, validated as Record<string, any>);
        res.json(updated);
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ error: error.errors });
        logger.error({ err: error }, `Failed to update supplier ${req.params.id}`);
        res.status(500).json({ error: "Failed to update supplier" });
    }
});

// DELETE supplier
router.delete("/suppliers/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
        await storage.deleteSupplier(id);
        logAction(req, "DELETE", "SUPPLIER", id.toString(), `Eliminó al proveedor #${id}`);
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, `Failed to delete supplier ${req.params.id}`);
        res.status(500).json({ error: "Failed to delete supplier" });
    }
});

export default router;
