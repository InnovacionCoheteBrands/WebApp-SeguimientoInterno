import 'dotenv/config';
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import type { Server } from "http";
import { registerRoutes } from "./routes";
import { globalErrorHandler } from "./middleware/error-handler";
import { storage } from "./storage";
import { logAiConfigStatus } from "./utils/ai";
import { logger } from "./utils/logger";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function validateRuntimeConfig() {
  const issues: string[] = [];

  if (process.env.NODE_ENV === "production") {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      issues.push("JWT_SECRET must be configured with at least 32 characters in production.");
    }

    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      issues.push("BASE_URL must be configured in production.");
    } else {
      try {
        const parsed = new URL(baseUrl);
        if (parsed.protocol !== "https:") {
          issues.push("BASE_URL must start with https:// in production.");
        }
      } catch {
        issues.push("BASE_URL must be a valid absolute URL.");
      }
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

function registerProcessHandlers() {
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled Promise Rejection - shutting down');
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught Exception - shutting down');
    process.exit(1);
  });
}

export async function runServer(
  attachFrontend: (app: Express, server: Server) => Promise<void>,
  log: (message: string, source?: string) => void,
): Promise<void> {
  validateRuntimeConfig();
  registerProcessHandlers();
  logAiConfigStatus();

  const app = express();

  app.set('trust proxy', 1);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests", message: "Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !req.path.startsWith("/api"),
  });

  app.use(apiLimiter);

  app.use(express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

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

  const revokedLegacyTokens = await storage.revokeLegacyRefreshTokens();
  if (revokedLegacyTokens > 0) {
    logger.warn(
      { revokedLegacyTokens },
      "Revoked legacy plaintext refresh tokens during startup",
    );
  }

  const server = await registerRoutes(app);

  app.use(globalErrorHandler);

  await attachFrontend(app, server);

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
}
