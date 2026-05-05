import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { calculateSystemMetrics } from "./metrics";
import type { Campaign } from "@shared/schema";
import { getJwtSecret } from "./middleware/auth";
import { logger } from "./utils/logger";

let wss: WebSocketServer | null = null;
let telemetryInterval: NodeJS.Timeout | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

interface JwtPayload {
  id: string;
  username: string;
  role: string;
}

interface AuthResult {
  ok: boolean;
  user?: JwtPayload;
  reason?: string;
}

const DB_CONNECTION_ERROR_CODES = new Set([
  "ENOTFOUND",
  "CERT_HAS_EXPIRED",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENETUNREACH",
  "EPIPE",
]);

const DB_CONNECTION_ERROR_TOKENS = [
  "ENOTFOUND",
  "CERT_HAS_EXPIRED",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENETUNREACH",
  "EPIPE",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractTokenFromRequest(request: IncomingMessage): string | null {
  const authHeader = request.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const wsProtocolHeader = request.headers["sec-websocket-protocol"];
  if (typeof wsProtocolHeader === "string" && wsProtocolHeader.trim().length > 0) {
    const protocols = wsProtocolHeader.split(",").map((part) => part.trim()).filter(Boolean);
    const bearerIndex = protocols.findIndex((value) => value.toLowerCase() === "bearer");
    if (bearerIndex >= 0 && protocols[bearerIndex + 1]) {
      return protocols[bearerIndex + 1];
    }

    if (protocols[0].startsWith("token.")) {
      return protocols[0].slice("token.".length);
    }
  }

  const url = request.url ?? "";
  if (url.length > 0) {
    const parsed = new URL(url, "http://localhost");
    const tokenInQuery = parsed.searchParams.get("token") ?? parsed.searchParams.get("access_token");
    if (tokenInQuery) {
      return tokenInQuery;
    }
  }

  const cookieHeader = request.headers.cookie;
  if (typeof cookieHeader === "string" && cookieHeader.length > 0) {
    const tokenCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("token=") || item.startsWith("auth_token="));
    if (tokenCookie) {
      const [, value = ""] = tokenCookie.split("=");
      if (value) {
        return decodeURIComponent(value);
      }
    }
  }

  return null;
}

function authenticateWebSocketRequest(request: IncomingMessage): AuthResult {
  const token = extractTokenFromRequest(request);
  if (!token) {
    return { ok: false, reason: "Missing token" };
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!isRecord(decoded)) {
      return { ok: false, reason: "Invalid JWT payload" };
    }

    const id = decoded.id;
    const username = decoded.username;
    const role = decoded.role;
    if (typeof id !== "string" || typeof username !== "string" || typeof role !== "string") {
      return { ok: false, reason: "Incomplete JWT claims" };
    }

    return { ok: true, user: { id, username, role } };
  } catch (error) {
    logger.warn({ err: error }, "[websocket] JWT verification failed");
    return { ok: false, reason: "Invalid token" };
  }
}

function collectErrorMetadata(error: unknown): { codes: Set<string>; message: string } {
  const codes = new Set<string>();
  const messages: string[] = [];
  const queue: unknown[] = [error];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);

    if (current instanceof Error) {
      messages.push(current.message);
      const maybeCode = (current as Error & { code?: unknown }).code;
      if (typeof maybeCode === "string") {
        codes.add(maybeCode);
      }

      if (isRecord(current.cause)) {
        queue.push(current.cause);
      } else if (current.cause) {
        queue.push(current.cause);
      }
    }

    if (!isRecord(current)) {
      continue;
    }

    const recordCode = current.code;
    if (typeof recordCode === "string") {
      codes.add(recordCode);
    }

    const recordMessage = current.message;
    if (typeof recordMessage === "string") {
      messages.push(recordMessage);
    }

    if ("error" in current) {
      queue.push(current.error);
    }

    if ("cause" in current) {
      queue.push(current.cause);
    }
  }

  return { codes, message: messages.join(" ") };
}

// Helper to check if error is a DB connectivity issue (non-critical for websocket simulators)
function isDbWebSocketError(error: unknown): boolean {
  const { codes, message } = collectErrorMetadata(error);
  if (Array.from(codes).some((code) => DB_CONNECTION_ERROR_CODES.has(code))) {
    return true;
  }

  return DB_CONNECTION_ERROR_TOKENS.some((token) => message.includes(token));
}

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
    const auth = authenticateWebSocketRequest(request);
    if (!auth.ok) {
      logger.warn(
        {
          reason: auth.reason,
          remoteAddress: request.socket.remoteAddress,
          userAgent: request.headers["user-agent"],
        },
        "[websocket] Connection rejected",
      );
      ws.close(1008, "Unauthorized");
      return;
    }

    logger.info(
      {
        userId: auth.user?.id,
        username: auth.user?.username,
        role: auth.user?.role,
      },
      "[websocket] Authenticated connection established",
    );

    ws.on("close", () => {
      logger.info(
        {
          userId: auth.user?.id,
          username: auth.user?.username,
        },
        "[websocket] Connection closed",
      );
    });

    ws.on("error", (error) => {
      logger.error({ err: error }, "[websocket] Error");
    });
  });

  startTelemetrySimulator();
  startMetricsSimulator();

  logger.info("[websocket] WebSocket server initialized on /ws");
}

function startMetricsSimulator() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }

  metricsInterval = setInterval(async () => {
    if (!wss) return;

    try {
      const metrics = await calculateSystemMetrics();

      await storage.createSystemMetric({
        metricType: "client_status",
        value: metrics.clientStatus.value,
        label: metrics.clientStatus.label,
        trend: metrics.clientStatus.trend,
        trendLabel: metrics.clientStatus.trendLabel
      });

      await storage.cleanupOldMetrics(50);

      const message = JSON.stringify({
        type: "metrics_update",
        data: metrics,
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      // Only log errors that aren't related to DB WebSocket connection issues
      if (!isDbWebSocketError(error)) {
        logger.error({ err: error }, "[websocket] Error generating metrics");
      }
    }
  }, 10000);
}

function startTelemetrySimulator() {
  if (telemetryInterval) {
    clearInterval(telemetryInterval);
  }

  telemetryInterval = setInterval(async () => {
    if (!wss) return;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const value = Math.floor(Math.random() * 40) + 30 + Math.sin(Date.now() / 10000) * 20;

    try {
      await storage.createTelemetryData({
        name: timeLabel,
        value: Math.floor(value),
      });

      await storage.cleanupOldTelemetry(50);

      const message = JSON.stringify({
        type: "telemetry",
        data: {
          name: timeLabel,
          value: Math.floor(value),
          timestamp: now.toISOString(),
        },
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      // Only log errors that aren't related to DB WebSocket connection issues
      if (!isDbWebSocketError(error)) {
        logger.error({ err: error }, "[websocket] Error generating telemetry");
      }
    }
  }, 5000);
}

export async function broadcastCampaignUpdate(campaign?: Campaign | Campaign[]) {
  if (!wss) return;

  let campaignData = campaign;
  if (!campaignData) {
    const campaigns = await storage.getCampaigns();
    campaignData = campaigns;
  }

  const message = JSON.stringify({
    type: "campaign_update",
    data: campaignData,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function getWebSocketHealthStatus(): { status: "up" | "down"; clients: number } {
  if (!wss) {
    return { status: "down", clients: 0 };
  }

  return {
    status: "up",
    clients: wss.clients.size,
  };
}

interface MetricsData {
  clientStatus: {
    value: number;
    label: string;
    trend: number;
    trendLabel: string;
  };
  [key: string]: unknown;
}

export function broadcastMetricsUpdate(metrics: MetricsData) {
  if (!wss) return;

  const message = JSON.stringify({
    type: "metrics_update",
    data: metrics,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
