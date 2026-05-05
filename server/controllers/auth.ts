/**
 * Authentication Controller (SEC-001)
 * 
 * Provides login and register endpoints for JWT-based authentication.
 */

import { Router } from 'express';
import rateLimit from "express-rate-limit";
import { z } from 'zod';
import { storage } from '../storage';
import { logger } from '../utils/logger';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { generateToken, getJwtSecret, requireAuth } from '../middleware/auth';
import passport from 'passport';
import crypto from 'crypto';

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

const refreshRequestSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
});

const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "TooManyRequests",
        message: "Too many registration attempts. Please try again later.",
    },
});

/**
 * SEC-001: Deterministic HMAC-SHA-256 hash for refresh token storage.
 * The raw token is returned to the client; only the hash is persisted in DB.
 * On lookup, the same HMAC is computed from the client-supplied token.
 */
function hashRefreshToken(rawToken: string): string {
    return crypto.createHmac('sha256', getJwtSecret()).update(rawToken).digest('hex');
}

const generateRefreshToken = async (userId: string) => {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashRefreshToken(rawToken);

    // 7 days expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await storage.createRefreshToken({
        userId,
        tokenHash,
        expiresAt,
        revoked: false
    });

    return rawToken;
};

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
                logger.info({ username }, "Password migrated to hash");
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

        // Generate Refresh Token
        const refreshToken = await generateRefreshToken(user.id);

        // Audit log for login
        storage.createAuditLog({
            userId: user.id,
            username: user.username,
            action: "LOGIN",
            entityType: "AUTH",
            details: `Inicio de sesión exitoso`,
            ipAddress: req.ip || req.socket.remoteAddress || undefined,
        }).catch(err => console.error("[AuditLog] Login log failed:", err.message));

        res.json({
            token,
            refreshToken,
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
        logger.error({ err: error }, 'Login error:');
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/auth/register
 * Create new user account
 */
router.post('/register', registerLimiter, async (req, res) => {
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

        // Generate Refresh Token
        const refreshToken = await generateRefreshToken(user.id);

        res.status(201).json({
            token,
            refreshToken,
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
        logger.error({ err: error }, 'Register error:');
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token (requires valid refresh token)
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = refreshRequestSchema.parse(req.body);

        // SEC-001: Hash the client-supplied token before DB lookup
        const tokenHash = hashRefreshToken(refreshToken);
        const storedToken = await storage.getRefreshToken(tokenHash);
        if (!storedToken) {
            return res.status(401).json({ error: 'InvalidToken', message: 'Invalid refresh token.' });
        }

        if (storedToken.revoked) {
            // Potential reuse of revoked token - revoke all as a security measure
            await storage.revokeAllUserRefreshTokens(storedToken.userId);
            return res.status(401).json({ error: 'TokenRevoked', message: 'Token has been revoked. Re-login required.' });
        }

        if (new Date() > storedToken.expiresAt) {
            return res.status(401).json({ error: 'TokenExpired', message: 'Refresh token expired. Re-login required.' });
        }

        // Get user
        const user = await storage.getUser(storedToken.userId);
        if (!user) {
            return res.status(401).json({ error: 'UserNotFound', message: 'User not found.' });
        }

        // Revoke the old refresh token by its hash (rotate it)
        await storage.revokeRefreshToken(tokenHash);

        // Generate new tokens
        const newToken = generateToken({
            id: user.id,
            username: user.username,
            role: user.role || 'user'
        });
        const newRefreshToken = await generateRefreshToken(user.id);

        res.json({
            token: newToken,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'ValidationError', details: error.errors });
        }
        logger.error({ err: error }, 'Refresh token error:');
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.BASE_URL) {
        return res.status(503).json({
            error: 'ServiceUnavailable',
            message: 'Google OAuth is not configured. Please contact your administrator.',
            details: 'Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or BASE_URL environment variables.'
        });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.get('/google/callback', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.BASE_URL) {
        return res.redirect('/auth?error=GoogleOAuthNotConfigured');
    }

    passport.authenticate('google', {
        failureRedirect: '/auth?error=GoogleAuthFailed',
        session: false
    }, (err: any, user: any, info: any) => {
        if (err || !user) {
            logger.error({ err: err || info }, '[Google OAuth] Authentication failed:');
            return res.redirect('/auth?error=GoogleAuthFailed');
        }

        // Generate JWT
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role || 'user'
        });

        // Note: we can't easily wait for generateRefreshToken in this passport callback
        // without wrapping it in an async IIFE, so we'll do that here:
        (async () => {
            try {
                const refreshToken = await generateRefreshToken(user.id);
                // Redirect to frontend with tokens
                res.redirect(`/auth/callback?token=${token}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify({
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    avatarUrl: user.avatarUrl
                }))}`);
            } catch (err) {
                logger.error({ err }, '[Google OAuth] Error generating refresh token:');
                res.redirect('/auth?error=TokenGenerationFailed');
            }
        })();
    })(req, res, next);
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await storage.getUser(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        logger.error({ err: error }, 'Error fetching current user:');
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

export default router;
