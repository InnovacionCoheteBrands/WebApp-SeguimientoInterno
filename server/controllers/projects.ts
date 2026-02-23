import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import {
    insertProjectSchema,
    updateProjectSchema,
    insertProjectDeliverableSchema,
    updateProjectDeliverableSchema,
    insertProjectAttachmentSchema,
    insertProjectServiceSchema
} from "@shared/schema";
import { z } from "zod";
import { desc } from "drizzle-orm"; // Note: storage implementation handles sorting, but checking just in case

const router = Router();

// Projects Management endpoints
router.get("/projects", async (req, res) => {
    try {
        const projects = await storage.getProjects();
        res.json(projects);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch projects:");
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});

router.get("/projects/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const project = await storage.getProjectById(id);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json(project);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch project:");
        res.status(500).json({ error: "Failed to fetch project" });
    }
});

// Project Details (Command Center view with financials and team)
router.get("/projects/:id/details", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const details = await storage.getProjectDetails(id);
        if (!details) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json(details);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch project details:");
        res.status(500).json({ error: "Failed to fetch project details" });
    }
});

router.post("/projects", async (req, res) => {
    try {
        const validatedData = insertProjectSchema.parse(req.body);
        const project = await storage.createProject(validatedData);
        res.status(201).json(project);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Failed to create project:");
        res.status(500).json({ error: "Failed to create project" });
    }
});

router.patch("/projects/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateProjectSchema.parse(req.body);
        const project = await storage.updateProject(id, validatedData);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json(project);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Failed to update project:");
        res.status(500).json({ error: "Failed to update project" });
    }
});

router.delete("/projects/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteProject(id);
        if (!deleted) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Failed to delete project:");
        res.status(500).json({ error: "Failed to delete project" });
    }
});

// Project Deliverables endpoints
router.get("/projects/:id/deliverables", async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const deliverables = await storage.getProjectDeliverables(projectId);
        res.json(deliverables);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch deliverables:");
        res.status(500).json({ error: "Failed to fetch deliverables" });
    }
});

router.post("/projects/:id/deliverables", async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const validatedData = insertProjectDeliverableSchema.parse({
            ...req.body,
            projectId
        });
        const deliverable = await storage.createProjectDeliverable(validatedData);
        res.status(201).json(deliverable);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Failed to create deliverable:");
        res.status(500).json({ error: "Failed to create deliverable" });
    }
});

// Note: Direct deliverable manipulation (not nested under project for updates/deletes)
// We'll export another router or handle it here?
// In routes.ts it was app.patch("/api/deliverables/:id")
// So we might need a separate router or just handle it here if we mount logic uniquely.
// Or we can create a `router` for projects and a `router` for deliverables.
// But `routes.ts` mounted them separately.
// Let's include everything here but we need to export it properly.
// I'll make this file export a `projectRouter` and `deliverableRouter`?
// Or just one router and mount it at `/api` and define full paths?
// If I mount at `/api/projects`, I can't handle `/api/deliverables`.
// Better: keep `projects.ts` handling ALL project related things and mount it at `/api`.
// So path will be `/projects...` and `/deliverables...`.
// Check imports in routes.ts again.

// Wait, I'll stick to one router per file but mounted at `/api` level? No typically at entity level.
// If I mount `projectRouter` at `/api`, then:
// router.get("/projects", ...)
// router.patch("/deliverables/:id", ...)
// This works.

// Project Attachments endpoints
router.get("/projects/:id/attachments", async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const attachments = await storage.getProjectAttachments(projectId);
        res.json(attachments);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch attachments:");
        res.status(500).json({ error: "Failed to fetch attachments" });
    }
});

router.post("/projects/:id/attachments", async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const validatedData = insertProjectAttachmentSchema.parse({
            ...req.body,
            projectId
        });
        const attachment = await storage.createProjectAttachment(validatedData);
        res.status(201).json(attachment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Failed to create attachment:");
        res.status(500).json({ error: "Failed to create attachment" });
    }
});

// Deliverable specific routes (not nested)
router.patch("/deliverables/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateProjectDeliverableSchema.parse(req.body);
        const deliverable = await storage.updateProjectDeliverable(id, validatedData);
        if (!deliverable) {
            return res.status(404).json({ error: "Deliverable not found" });
        }
        res.json(deliverable);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Failed to update deliverable:");
        res.status(500).json({ error: "Failed to update deliverable" });
    }
});

router.delete("/deliverables/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteProjectDeliverable(id);
        if (!deleted) {
            return res.status(404).json({ error: "Deliverable not found" });
        }
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Failed to delete deliverable:");
        res.status(500).json({ error: "Failed to delete deliverable" });
    }
});

// Attachment specific routes (not nested)
router.delete("/attachments/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteProjectAttachment(id);
        if (!deleted) {
            return res.status(404).json({ error: "Attachment not found" });
        }
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Failed to delete attachment:");
        res.status(500).json({ error: "Failed to delete attachment" });
    }
});

// Link attachment to deliverable (for file-required deliverables)
router.post("/deliverables/:id/link-attachment", async (req, res) => {
    try {
        const deliverableId = parseInt(req.params.id);
        const { attachmentId } = req.body;

        if (!attachmentId) {
            return res.status(400).json({ error: "attachmentId is required" });
        }

        const deliverable = await storage.linkAttachmentToDeliverable(deliverableId, attachmentId);
        if (!deliverable) {
            return res.status(404).json({ error: "Deliverable not found" });
        }
        res.json(deliverable);
    } catch (error: any) {
        logger.error({ err: error }, "Failed to link attachment:");
        res.status(500).json({ error: error.message || "Failed to link attachment" });
    }
});

// Upload file and link to deliverable in one operation
router.post("/deliverables/:id/upload-and-link", async (req, res) => {
    try {
        const deliverableId = parseInt(req.params.id);
        const { projectId, name, url, fileType, fileSize } = req.body;

        if (!projectId || !name || !url) {
            return res.status(400).json({ error: "projectId, name, and url are required" });
        }

        // 1. Create the attachment
        const attachment = await storage.createProjectAttachment({
            projectId,
            name,
            url,
            fileType,
            fileSize
        });

        // 2. Link it to the deliverable (this also marks it as completed)
        const deliverable = await storage.linkAttachmentToDeliverable(deliverableId, attachment.id);

        if (!deliverable) {
            return res.status(404).json({ error: "Deliverable not found" });
        }

        res.json({ deliverable, attachment });
    } catch (error: any) {
        logger.error({ err: error }, "Failed to upload and link:");
        res.status(500).json({ error: error.message || "Failed to upload and link attachment" });
    }
});

// Recalculate project health manually (useful for cron or on-demand)
router.post("/projects/:id/recalculate-health", async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const health = await storage.calculateProjectHealth(projectId);
        res.json({ health });
    } catch (error) {
        logger.error({ err: error }, "Failed to recalculate project health:");
        res.status(500).json({ error: "Failed to recalculate project health" });
    }
});

// Note: The routes above are a mix of `/projects/...` and `/deliverables/...` and `/attachments/...`
// If we mount this router at `/api`, we need to prepend `/projects` to the project routes.
// Let's adjust the paths:
// router.get("/projects", ...)
// router.get("/projects/:id", ...)
// ...
// This means the file handles purely the logic but we need to be careful with mounting.
// I will adopt the Strategy: Mount at `/api`.

// ===========================================
// Ã°Å¸â€ºÂ Ã¯Â¸Â PROJECT SERVICES ENDPOINTS
// ===========================================

router.get("/projects/:id/services", async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const services = await storage.getProjectServices(projectId);
        res.json(services);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch project services:");
        res.status(500).json({ error: "Failed to fetch project services" });
    }
});

router.post("/projects/:id/services", async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const validatedData = insertProjectServiceSchema.parse({
            ...req.body,
            projectId
        });
        const service = await storage.addProjectService(validatedData);
        res.status(201).json(service);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error({ err: error }, "Failed to add service to project:");
        res.status(500).json({ error: "Failed to add service to project" });
    }
});

router.delete("/projects/:id/services/:serviceId", async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const serviceId = parseInt(req.params.serviceId);
        await storage.removeProjectService(projectId, serviceId);
        res.status(204).send();
    } catch (error) {
        logger.error({ err: error }, "Failed to remove service from project:");
        res.status(500).json({ error: "Failed to remove service from project" });
    }
});

router.patch("/projects/:id/services/:serviceId", async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const serviceId = parseInt(req.params.serviceId);
        const { customPrice, notes } = req.body;
        const updated = await storage.updateProjectServicePrice(projectId, serviceId, customPrice, notes);
        if (!updated) {
            return res.status(404).json({ error: "Service assignment not found" });
        }
        res.json(updated);
    } catch (error) {
        logger.error({ err: error }, "Failed to update project service:");
        res.status(500).json({ error: "Failed to update project service" });
    }
});

// Profitability Calculator endpoint
router.get("/projects/:id/profitability", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
        const data = await storage.getProjectProfitability(id);
        res.json(data);
    } catch (error: any) {
        if (error.message === "Proyecto no encontrado") {
            return res.status(404).json({ error: error.message });
        }
        logger.error({ err: error }, `Failed to calculate profitability for project ${req.params.id}`);
        res.status(500).json({ error: "Failed to calculate project profitability" });
    }
});

// Update project service (with new quantity/cost/sellPrice fields)
router.patch("/projects/:id/services/:serviceId/line", async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const serviceId = parseInt(req.params.serviceId);
        const { quantity, customCost, sellPrice, customPrice, notes } = req.body;
        const updated = await storage.updateProjectServiceLine(projectId, serviceId, {
            quantity, customCost, sellPrice, customPrice, notes
        });
        if (!updated) return res.status(404).json({ error: "Service line not found" });
        res.json(updated);
    } catch (error) {
        logger.error({ err: error }, "Failed to update project service line:");
        res.status(500).json({ error: "Failed to update project service line" });
    }
});

export default router;
