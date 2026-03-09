import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { insertTeamSchema, updateTeamSchema, insertTeamAssignmentSchema } from "@shared/schema";
import { z } from "zod";
import { logAction } from "../utils/audit-helper";

const router = Router();

router.get("/team", async (req, res) => {
    try {
        const allTeam = await storage.getTeam();
        res.json(allTeam);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch team:");
        res.status(500).json({ error: "Failed to fetch team", details: error instanceof Error ? error.message : String(error) });
    }
});

router.post("/team", async (req, res) => {
    try {

        const validatedData = insertTeamSchema.parse(req.body);

        const person = await storage.createTeam(validatedData);
        logAction(req, "CREATE", "TEAM", person.id.toString(), `Contrató a ${person.name} (${person.role})`);
        res.status(201).json(person);
    } catch (error) {
        logger.error({ err: error }, "Failed to create team member");
        if (error instanceof z.ZodError) {
            logger.error({ err: JSON.stringify(error.errors, null, 2) }, "   Zod validation errors:");
            return res.status(400).json({ error: error.errors });
        }
        // Log the actual database/ORM error
        if (error instanceof Error) {
            logger.error({ err: error.message }, "   Error message:");
            logger.error({ err: error.stack }, "   Error stack:");
        }
        logger.error({ err: error }, "   Full error:");
        res.status(500).json({
            error: "Failed to create team member",
            details: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});

router.patch("/team/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateTeamSchema.parse(req.body);
        const person = await storage.updateTeam(id, validatedData);
        if (!person) {
            return res.status(404).json({ error: "Team member not found" });
        }
        logAction(req, "UPDATE", "TEAM", id.toString(), `Actualizó perfil de ${person.name}`, validatedData as Record<string, any>);
        res.json(person);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update team member" });
    }
});

router.delete("/team/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteTeam(id);
        if (!deleted) {
            return res.status(404).json({ error: "Team member not found" });
        }
        logAction(req, "DELETE", "TEAM", id.toString(), `Eliminó registro de personal #${id}`);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete team member" });
    }
});

router.get("/team/assignments", async (req, res) => {
    try {
        const assignments = await storage.getTeamAssignments();
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
});

router.post("/team/assignments", async (req, res) => {
    try {
        const validatedData = insertTeamAssignmentSchema.parse(req.body);
        const assignment = await storage.createTeamAssignment(validatedData);
        logAction(req, "ASSIGN", "TEAM", assignment.id.toString(), `Asignó miembro de equipo a proyecto`);
        res.status(201).json(assignment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error({ err: error }, "Team assignment validation error");
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create assignment" });
    }
});

router.delete("/team/assignments/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteTeamAssignment(id);
        if (!deleted) {
            return res.status(404).json({ error: "Assignment not found" });
        }
        logAction(req, "DELETE", "TEAM", id.toString(), `Removió asignación de equipo #${id}`);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete assignment" });
    }
});

export default router;
