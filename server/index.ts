import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "./utils/logger";

const app = express();

function validateRuntimeConfig() {
  const issues: string[] = [];

  if (process.env.NODE_ENV === "production") {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      issues.push("JWT_SECRET must be configured with at least 32 characters in production.");
    }
  }

  const hasAnyGoogleCredential = Boolean(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_SECRET);
  if (hasAnyGoogleCredential && !process.env.BASE_URL) {
    issues.push("BASE_URL must be configured when Google OAuth credentials are set.");
  }

  if (issues.length > 0) {
    throw new Error(`Invalid runtime configuration:\n- ${issues.join("\n- ")}`);
  }
}

validateRuntimeConfig();

// Global rate limiter for API routes (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests", message: "Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith("/api"), // Only limit /api routes
});

// Apply rate limiter before other middleware
app.use(apiLimiter);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    if (!req.path.startsWith("/api")) {
      return;
    }

    logger.info(
      {
        req: { method: req.method, path: req.path },
        res: { statusCode: res.statusCode },
        durationMs: Date.now() - start,
      },
      "API request completed",
    );
  });

  next();
});

(async () => {
  // register routes
  // force restart
  const server = await registerRoutes(app);

  app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // Don't throw here, just log if needed
    if (status >= 500) {
      logger.error({ err }, "Unhandled server error");
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Server configuration for VPS deployment
  // Use HOST from environment variable, default to 0.0.0.0 for VPS
  // In development/Replit, this can be overridden to localhost if needed
  const host = process.env.HOST || "0.0.0.0";
  const port = parseInt(process.env.PORT || "5000", 10);

  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}. Must be between 1 and 65535.`);
  }

  server.listen({
    port,
    host,
  }, () => {
    log(`serving on ${host}:${port}`);
  });
})();
