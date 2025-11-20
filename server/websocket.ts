import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import { calculateSystemMetrics } from "./metrics";

let wss: WebSocketServer | null = null;
let telemetryInterval: NodeJS.Timeout | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[websocket] Client connected");

    ws.on("close", () => {
      console.log("[websocket] Client disconnected");
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
        metricType: "fleet_status",
        value: metrics.fleetStatus.value,
        label: metrics.fleetStatus.label,
        trend: metrics.fleetStatus.trend,
        trendLabel: metrics.fleetStatus.trendLabel
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
      console.error("[websocket] Error generating metrics:", error);
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
      console.error("[websocket] Error generating telemetry:", error);
    }
  }, 5000);
}

export function broadcastMissionUpdate(mission: any) {
  if (!wss) return;

  const message = JSON.stringify({
    type: "mission_update",
    data: mission,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastMetricsUpdate(metrics: any) {
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
