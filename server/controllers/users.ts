import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { hashPassword } from "../utils/crypto";
import { upload } from "../middleware/upload";

const router = Router();

/**
 * POST /api/users/me/avatar
 * Upload user avatar
 */
router.post("/me/avatar", upload.single("avatar"), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const avatarUrl = `/uploads/${req.file.filename}`;

        // Update user avatar in database
        const updatedUser = await storage.updateUser(req.user.id, { avatarUrl });

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return the new avatar URL
        res.json({ avatarUrl });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        res.status(500).json({ error: "Failed to upload avatar" });
    }
});

// Validation schemas
const updateUserSchema = z.object({
    role: z.enum(["admin", "user"]).optional(),
    password: z.string().min(8).optional(),
});

/**
 * GET /api/users
 * List all users (Admin only recommended)
 */
router.get("/", async (req, res) => {
    try {
        // Basic role check - should be replaced with a robust middleware
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const users = await storage.getUsers();
        // Don't leak passwords
        const sanitizedUsers = users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });
        res.json(sanitizedUsers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

/**
 * PATCH /api/users/:id
 * Update user details (Admin only)
 */
router.patch("/:id", async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const { id } = req.params;
        const body = updateUserSchema.parse(req.body);

        const updateData: any = {};
        if (body.role) updateData.role = body.role;
        if (body.password) updateData.password = await hashPassword(body.password);

        const updated = await storage.updateUser(id, updateData);
        if (!updated) return res.status(404).json({ error: "User not found" });

        const { password, ...sanitized } = updated;
        res.json(sanitized);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.errors });
        }
        res.status(500).json({ error: "Failed to update user" });
    }
});

/**
 * DELETE /api/users/:id
 * Delete a user (Admin only)
 */
router.delete("/:id", async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const { id } = req.params;
        if (req.user.id === id) {
            return res.status(400).json({ error: "Cannot delete yourself" });
        }

        await storage.deleteUser(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

export default router;
