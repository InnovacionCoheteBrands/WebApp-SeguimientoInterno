import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import { calculateSystemMetrics } from "./metrics";
import type { Campaign } from "@shared/schema";

let wss: WebSocketServer | null = null;
let telemetryInterval: NodeJS.Timeout | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

// Helper to check if error is a WebSocket DB connection error (non-critical)
function isDbWebSocketError(error: unknown): boolean {
  if (!error) return false;

  // Check if error is an object with common error properties
  if (typeof error !== 'object' || error === null) return false;

  // Type guard for error objects with code property
  const hasCode = (obj: object): obj is { code?: string } => 'code' in obj;

  // Check direct code property
  if (hasCode(error) && (error.code === 'ENOTFOUND' || error.code === 'CERT_HAS_EXPIRED')) {
    return true;
  }

  // Check nested error property
  if ('error' in error) {
    const nestedError = (error as { error: unknown }).error;
    if (typeof nestedError === 'object' && nestedError !== null && hasCode(nestedError)) {
      return nestedError.code === 'ENOTFOUND' || nestedError.code === 'CERT_HAS_EXPIRED';
    }
  }

  return false;
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
