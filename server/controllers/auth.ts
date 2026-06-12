/**
 * Authentication Controller (SEC-001)
 *
 * Provides login and register endpoints for JWT-based authentication.
 */

import { Router, type Request } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import passport from "passport";
import crypto from "crypto";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { hashPassword, verifyPassword } from "../utils/crypto";
import { generateToken, getJwtSecret, requireAuth } from "../middleware/auth";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
  setRefreshTokenCookie,
} from "../utils/auth-cookies";
import { validateAuthOrigin } from "../utils/auth-origin";

const router = Router();

type RefreshTokenValidationResult =
  | { ok: true; tokenHash: string; user: { id: string; username: string; role: string | null; avatarUrl?: string | null } }
  | { ok: false; status: number; error: string; message: string; revokeAllUserTokens?: string };

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password must be at most 100 characters"),
});

const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
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

function isFeatureEnabled(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() !== "false";
}

function isRefreshCookieEnabled(): boolean {
  return isFeatureEnabled("AUTH_REFRESH_COOKIE_ENABLED", true);
}

function isLegacyRefreshBodyEnabled(): boolean {
  return process.env.AUTH_LEGACY_REFRESH_BODY_ENABLED?.toLowerCase() === "true";
}

/**
 * SEC-001: Deterministic HMAC-SHA-256 hash for refresh token storage.
 * The raw token is returned to the client; only the hash is persisted in DB.
 * On lookup, the same HMAC is computed from the client-supplied token.
 */
function hashRefreshToken(rawToken: string): string {
  return crypto.createHmac("sha256", getJwtSecret()).update(rawToken).digest("hex");
}

const generateRefreshToken = async (userId: string) => {
  const rawToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = hashRefreshToken(rawToken);

  // 7 days expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await storage.createRefreshToken({
    userId,
    tokenHash,
    expiresAt,
    revoked: false,
  });

  return rawToken;
};

function buildAuthResponse(
  token: string,
  user: { id: string; username: string; role: string | null; avatarUrl?: string | null },
  refreshToken?: string,
) {
  const payload: Record<string, unknown> = {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
    },
  };

  if (refreshToken && isLegacyRefreshBodyEnabled()) {
    payload.refreshToken = refreshToken;
  }

  return payload;
}

function resolveRefreshTokenFromRequest(req: Request) {
  const cookieToken = isRefreshCookieEnabled() ? getRefreshTokenFromCookie(req) : null;
  if (cookieToken) {
    return { token: cookieToken, source: "cookie" as const };
  }

  if (!isLegacyRefreshBodyEnabled()) {
    return { token: null, source: "none" as const };
  }

  const contentType = req.headers["content-type"];
  const isJson = typeof contentType === "string" && contentType.toLowerCase().startsWith("application/json");
  if (!isJson) {
    return { token: null, source: "legacy-body" as const, unsupportedContentType: true };
  }

  const parsed = refreshRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return { token: null, source: "legacy-body" as const, validationError: parsed.error.errors };
  }

  return { token: parsed.data.refreshToken, source: "legacy-body" as const };
}

async function validateRefreshTokenAndLoadUser(rawRefreshToken: string): Promise<RefreshTokenValidationResult> {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const storedToken = await storage.getRefreshToken(tokenHash);

  if (!storedToken) {
    return { ok: false, status: 401, error: "InvalidToken", message: "Invalid refresh token." };
  }

  if (storedToken.revoked) {
    return {
      ok: false,
      status: 401,
      error: "TokenRevoked",
      message: "Token has been revoked. Re-login required.",
      revokeAllUserTokens: storedToken.userId,
    };
  }

  if (new Date() > storedToken.expiresAt) {
    return { ok: false, status: 401, error: "TokenExpired", message: "Refresh token expired. Re-login required." };
  }

  const user = await storage.getUser(storedToken.userId);
  if (!user) {
    return { ok: false, status: 401, error: "UserNotFound", message: "User not found." };
  }

  return { ok: true, tokenHash, user };
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        error: "InvalidCredentials",
        message: "Invalid username or password",
      });
    }

    // Verify password
    // Handle both hashed and legacy plaintext passwords
    let isValidPassword = false;

    // Check if password is hashed (bcrypt hashes start with $2)
    if (user.password.startsWith("$2")) {
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
        error: "InvalidCredentials",
        message: "Invalid username or password",
      });
    }

    // Generate JWT
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role || "user",
    });

    // Generate Refresh Token
    const refreshToken = await generateRefreshToken(user.id);
    if (isRefreshCookieEnabled()) {
      setRefreshTokenCookie(res, refreshToken);
    }

    // Audit log for login
    storage
      .createAuditLog({
        userId: user.id,
        username: user.username,
        action: "LOGIN",
        entityType: "AUTH",
        details: "Inicio de sesion exitoso",
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
      })
      .catch((err) => console.error("[AuditLog] Login log failed:", err.message));

    return res.json(buildAuthResponse(token, user, refreshToken));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "ValidationError",
        details: error.errors,
      });
    }
    logger.error({ err: error }, "Login error:");
    return res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/auth/register
 * Create new user account
 */
router.post("/register", requireAuth, registerLimiter, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        error: "RegistrationForbidden",
        message: "Only administrators can create users.",
      });
    }

    const { username, password } = registerSchema.parse(req.body);

    // Check if username exists
    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return res.status(409).json({
        error: "UsernameExists",
        message: "Username is already taken",
      });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      username,
      password: hashedPassword,
    });

    const { password: _password, ...sanitizedUser } = user;
    return res.status(201).json({ user: sanitizedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "ValidationError",
        details: error.errors,
      });
    }
    logger.error({ err: error }, "Register error:");
    return res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * GET /api/auth/session
 * Validates refresh cookie and hydrates a fresh access token.
 * This endpoint never rotates refresh tokens.
 */
router.get("/session", async (req, res) => {
  if (!isRefreshCookieEnabled()) {
    return res.status(503).json({
      error: "AuthRefreshCookieDisabled",
      message: "Refresh cookie flow is disabled.",
    });
  }

  const refreshToken = getRefreshTokenFromCookie(req);
  if (!refreshToken) {
    return res.status(401).json({
      error: "MissingRefreshCookie",
      message: "Refresh cookie is required.",
    });
  }

  try {
    const validation = await validateRefreshTokenAndLoadUser(refreshToken);
    if (!validation.ok) {
      clearRefreshTokenCookie(res);
      if (validation.revokeAllUserTokens) {
        await storage.revokeAllUserRefreshTokens(validation.revokeAllUserTokens);
      }
      return res.status(validation.status).json({ error: validation.error, message: validation.message });
    }

    const accessToken = generateToken({
      id: validation.user.id,
      username: validation.user.username,
      role: validation.user.role || "user",
    });

    return res.json(buildAuthResponse(accessToken, validation.user));
  } catch (error) {
    logger.error({ err: error }, "Session hydration error:");
    clearRefreshTokenCookie(res);
    return res.status(500).json({ error: "SessionHydrationFailed" });
  }
});

/**
 * POST /api/auth/refresh
 * Rotates refresh token and emits a fresh access token.
 */
router.post("/refresh", async (req, res) => {
  const originCheck = validateAuthOrigin(req, { requireOrigin: true });
  if (!originCheck.allowed) {
    return res.status(403).json({
      error: "InvalidOrigin",
      message: "Request origin is not allowed.",
      reason: originCheck.reason,
    });
  }

  const resolved = resolveRefreshTokenFromRequest(req);
  if (resolved.unsupportedContentType) {
    return res.status(415).json({
      error: "UnsupportedContentType",
      message: "Content-Type must be application/json.",
    });
  }
  if (resolved.validationError) {
    return res.status(400).json({
      error: "ValidationError",
      details: resolved.validationError,
    });
  }
  if (!resolved.token) {
    return res.status(401).json({
      error: "MissingRefreshCookie",
      message: "Refresh cookie is required.",
    });
  }

  try {
    const validation = await validateRefreshTokenAndLoadUser(resolved.token);
    if (!validation.ok) {
      clearRefreshTokenCookie(res);
      if (validation.revokeAllUserTokens) {
        await storage.revokeAllUserRefreshTokens(validation.revokeAllUserTokens);
      }
      return res.status(validation.status).json({ error: validation.error, message: validation.message });
    }

    // Rotate current refresh token
    await storage.revokeRefreshToken(validation.tokenHash);
    const nextRefreshToken = await generateRefreshToken(validation.user.id);
    if (isRefreshCookieEnabled()) {
      setRefreshTokenCookie(res, nextRefreshToken);
    }

    const accessToken = generateToken({
      id: validation.user.id,
      username: validation.user.username,
      role: validation.user.role || "user",
    });

    return res.json(buildAuthResponse(accessToken, validation.user, resolved.source === "legacy-body" ? nextRefreshToken : undefined));
  } catch (error) {
    logger.error({ err: error }, "Refresh token error:");
    clearRefreshTokenCookie(res);
    return res.status(500).json({ error: "Token refresh failed" });
  }
});

/**
 * POST /api/auth/logout
 * Clears refresh cookie and revokes current refresh token when possible.
 */
router.post("/logout", async (req, res) => {
  const originCheck = validateAuthOrigin(req, { requireOrigin: false });
  if (!originCheck.allowed) {
    return res.status(403).json({
      error: "InvalidOrigin",
      message: "Request origin is not allowed.",
      reason: originCheck.reason,
    });
  }

  const refreshToken = getRefreshTokenFromCookie(req);
  clearRefreshTokenCookie(res);

  if (!refreshToken) {
    return res.status(204).send();
  }

  try {
    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await storage.getRefreshToken(tokenHash);
    if (storedToken && !storedToken.revoked) {
      await storage.revokeRefreshToken(tokenHash);
    }
    return res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, "Logout error:");
    return res.status(500).json({ error: "LogoutFailed" });
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.BASE_URL) {
    return res.status(503).json({
      error: "ServiceUnavailable",
      message: "Google OAuth is not configured. Please contact your administrator.",
      details: "Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or BASE_URL environment variables.",
    });
  }
  return passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.get("/google/callback", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.BASE_URL) {
    return res.redirect("/auth?error=GoogleOAuthNotConfigured");
  }

  return passport.authenticate(
    "google",
    {
      failureRedirect: "/auth?error=GoogleAuthFailed",
      session: false,
    },
    async (err: unknown, user: any, info: unknown) => {
      if (err || !user) {
        logger.error({ err: err || info }, "[Google OAuth] Authentication failed:");
        return res.redirect("/auth?error=GoogleAuthFailed");
      }

      try {
        const refreshToken = await generateRefreshToken(user.id);
        if (isRefreshCookieEnabled()) {
          setRefreshTokenCookie(res, refreshToken);
        }

        // No tokens in URL. Callback page hydrates through /api/auth/session.
        return res.redirect("/auth/callback");
      } catch (callbackError) {
        logger.error({ err: callbackError }, "[Google OAuth] Error during callback token issuance:");
        return res.redirect("/auth?error=TokenGenerationFailed");
      }
    },
  )(req, res, next);
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (error) {
    logger.error({ err: error }, "Error fetching current user:");
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
