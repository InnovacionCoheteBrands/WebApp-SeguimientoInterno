import { Router } from "express";
import { storage } from "../storage";
import { insertTeamSchema, updateTeamSchema, insertTeamAssignmentSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/team", async (req, res) => {
    try {
        const allTeam = await storage.getTeam();
        res.json(allTeam);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch team" });
    }
});

router.post("/team", async (req, res) => {
    try {
        console.log("📥 POST /team - Body received:", JSON.stringify(req.body, null, 2));
        
        const validatedData = insertTeamSchema.parse(req.body);
        console.log("✅ Team validation passed:", JSON.stringify(validatedData, null, 2));
        
        const person = await storage.createTeam(validatedData);
        res.status(201).json(person);
    } catch (error) {
        console.error("❌ Error creating team member:");
        if (error instanceof z.ZodError) {
            console.error("   Zod validation errors:", JSON.stringify(error.errors, null, 2));
            return res.status(400).json({ error: error.errors });
        }
        // Log the actual database/ORM error
        if (error instanceof Error) {
            console.error("   Error message:", error.message);
            console.error("   Error stack:", error.stack);
        }
        console.error("   Full error:", error);
        res.status(500).json({ 
            error: "Failed to create team member",
            details: error instanceof Error ? error.message : "Unknown error"
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
        res.status(201).json(assignment);
    } catch (error) {
        if (error instanceof z.ZodError) {
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
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete assignment" });
    }
});

export default router;
