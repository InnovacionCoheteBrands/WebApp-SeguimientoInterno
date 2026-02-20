import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import { calculateSystemMetrics } from "./metrics";
import type { Campaign } from "@shared/schema";

let wss: WebSocketServer | null = null;
let telemetryInterval: NodeJS.Timeout | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

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

  wss.on("connection", (ws: WebSocket) => {


    ws.on("close", () => {

    });

    ws.on("error", (error) => {
      console.error("[websocket] Error:", error);
    });
  });

  startTelemetrySimulator();
  startMetricsSimulator();

  console.log("[websocket] WebSocket server initialized on /ws");
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
        console.error("[websocket] Error generating metrics:", error);
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
        console.error("[websocket] Error generating telemetry:", error);
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
