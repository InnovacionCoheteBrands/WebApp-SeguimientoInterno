/**
 * JWT Authentication Middleware (SEC-003)
 * 
 * Protects API routes by requiring valid JWT tokens.
 * Apply to all /api/* routes except /api/auth/*
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express.User type (used by Passport) so req.user has JWT claims
declare global {
    namespace Express {
        interface User {
            id: string;
            username: string;
            role: string;
        }
    }
}

/**
 * Get JWT secret from environment.
 * Must be at least 32 characters for security.
 */
function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
    }
    return secret;
}

/**
 * Middleware to require authentication.
 * Extracts and verifies JWT from Authorization header.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid Authorization header. Expected: Bearer <token>'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = getJwtSecret();
        const decoded = jwt.verify(token, secret) as {
            id: string;
            username: string;
            role: string;
        };

        // Attach user to request for downstream handlers
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                error: 'TokenExpired',
                message: 'Your session has expired. Please log in again.'
            });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                error: 'InvalidToken',
                message: 'Invalid authentication token.'
            });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Optional auth middleware - doesn't reject if no token,
 * but attaches user if valid token is present.
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Continue without user
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = getJwtSecret();
        const decoded = jwt.verify(token, secret) as {
            id: string;
            username: string;
            role: string;
        };

        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };
    } catch {
        // Invalid token - continue without user
    }

    next();
};

/**
 * Generate a JWT token for a user.
 * @param user - User data to encode
 * @param expiresInSeconds - Token expiration in seconds (default: 86400 = 24h)
 * @returns Signed JWT token
 */
export function generateToken(
    user: { id: string; username: string; role: string },
    expiresInSeconds: number = 86400 // 24 hours
): string {
    const secret = getJwtSecret();
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        secret,
        { expiresIn: expiresInSeconds }
    );
}

/**
 * Check if JWT is configured properly.
 * Useful for startup health checks.
 */
export function isJwtConfigured(): boolean {
    try {
        getJwtSecret();
        return true;
    } catch {
        return false;
    }
}
