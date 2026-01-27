/**
 * Project Team Assignments Controller
 * Part of Cohete Brands Replica - HR Performance Module
 */

import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertProjectTeamAssignmentSchema, updateProjectTeamAssignmentSchema } from "@shared/schema";
import { ZodError } from "zod";

const router = Router();

// GET /api/projects/:projectId/team - Get team assignments for a project
router.get("/projects/:projectId/team", async (req: Request, res: Response) => {
    try {
        const assignments = await storage.getProjectTeamAssignments(Number(req.params.projectId));
        res.json(assignments);
    } catch (error) {
        console.error("Error fetching project team:", error);
        res.status(500).json({ error: "Failed to fetch project team" });
    }
});

// POST /api/projects/:projectId/team - Assign team member to project
router.post("/projects/:projectId/team", async (req: Request, res: Response) => {
    try {
        const data = { ...req.body, projectId: Number(req.params.projectId) };
        const validated = insertProjectTeamAssignmentSchema.parse(data);
        const assignment = await storage.createProjectTeamAssignment(validated);
        res.status(201).json(assignment);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        console.error("Error creating project team assignment:", error);
        res.status(500).json({ error: "Failed to assign team member" });
    }
});

// PATCH /api/project-team/:id - Update assignment
router.patch("/project-team/:id", async (req: Request, res: Response) => {
    try {
        const validated = updateProjectTeamAssignmentSchema.parse(req.body);
        const assignment = await storage.updateProjectTeamAssignment(Number(req.params.id), validated);
        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }
        res.json(assignment);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        console.error("Error updating assignment:", error);
        res.status(500).json({ error: "Failed to update assignment" });
    }
});

// DELETE /api/project-team/:id - Remove assignment
router.delete("/project-team/:id", async (req: Request, res: Response) => {
    try {
        await storage.deleteProjectTeamAssignment(Number(req.params.id));
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ error: "Failed to remove team member from project" });
    }
});

// GET /api/team/:teamMemberId/performance - Get team member performance metrics
router.get("/team/:teamMemberId/performance", async (req: Request, res: Response) => {
    try {
        const performance = await storage.getTeamMemberPerformance(Number(req.params.teamMemberId));
        res.json(performance);
    } catch (error) {
        console.error("Error fetching team member performance:", error);
        res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
});

export default router;
