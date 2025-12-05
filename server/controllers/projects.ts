import { Router } from "express";
import { storage } from "../storage";
import {
    insertProjectSchema,
    updateProjectSchema,
    insertProjectDeliverableSchema,
    updateProjectDeliverableSchema,
    insertProjectAttachmentSchema
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
        console.error("Failed to fetch projects:", error);
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
        console.error("Failed to fetch project:", error);
        res.status(500).json({ error: "Failed to fetch project" });
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
        console.error("Failed to create project:", error);
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
        console.error("Failed to update project:", error);
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
        console.error("Failed to delete project:", error);
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
        console.error("Failed to fetch deliverables:", error);
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
        console.error("Failed to create deliverable:", error);
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
        console.error("Failed to fetch attachments:", error);
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
        console.error("Failed to create attachment:", error);
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
        console.error("Failed to update deliverable:", error);
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
        console.error("Failed to delete deliverable:", error);
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
        console.error("Failed to delete attachment:", error);
        res.status(500).json({ error: "Failed to delete attachment" });
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

export default router;
