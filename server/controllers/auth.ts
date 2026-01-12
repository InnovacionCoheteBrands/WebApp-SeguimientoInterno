/**
 * Authentication Controller (SEC-001)
 * 
 * Provides login and register endpoints for JWT-based authentication.
 */

import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { generateToken } from '../middleware/auth';

const router = Router();

// Validation schemas
const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be at most 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be at most 100 characters'),
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = loginSchema.parse(req.body);

        // Find user
        const user = await storage.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({
                error: 'InvalidCredentials',
                message: 'Invalid username or password'
            });
        }

        // Verify password
        // Handle both hashed and legacy plaintext passwords
        let isValidPassword = false;

        // Check if password is hashed (bcrypt hashes start with $2)
        if (user.password.startsWith('$2')) {
            isValidPassword = await verifyPassword(password, user.password);
        } else {
            // Legacy plaintext comparison (for migration)
            isValidPassword = user.password === password;

            // If valid, upgrade to hashed password
            if (isValidPassword) {
                const hashedPassword = await hashPassword(password);
                await storage.updateUserPassword(user.id, hashedPassword);
                console.log(`[Auth] Migrated user ${username} to hashed password`);
            }
        }

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'InvalidCredentials',
                message: 'Invalid username or password'
            });
        }

        // Generate JWT
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role || 'user'
        });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'ValidationError',
                details: error.errors
            });
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/auth/register
 * Create new user account
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password } = registerSchema.parse(req.body);

        // Check if username exists
        const existing = await storage.getUserByUsername(username);
        if (existing) {
            return res.status(409).json({
                error: 'UsernameExists',
                message: 'Username is already taken'
            });
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        const user = await storage.createUser({
            username,
            password: hashedPassword
        });

        // Generate JWT
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role || 'user'
        });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'ValidationError',
                details: error.errors
            });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token (requires valid current token)
 */
router.post('/refresh', async (req, res) => {
    // This would typically use a refresh token
    // For now, just reject - users must re-login
    res.status(501).json({
        error: 'NotImplemented',
        message: 'Token refresh not yet implemented. Please log in again.'
    });
});

export default router;
