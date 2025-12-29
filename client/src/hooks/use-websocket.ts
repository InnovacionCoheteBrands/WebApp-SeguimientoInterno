import { useEffect, useRef, useState } from "react";
import { useSystemSettings } from "./use-system-settings";

interface WebSocketMessage {
  type: "telemetry" | "campaign_update" | "metrics_update";
  data: any;
}

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<Record<string, number>>({});
  const { data: settings } = useSystemSettings();

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}${url}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[websocket] Connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Apply refreshRate throttling for telemetry and metrics updates
          const refreshRateMs = (settings?.refreshRate ? parseInt(settings.refreshRate) : 5) * 1000;
          const now = Date.now();
          const messageType = message.type;
          
          // Only throttle telemetry and metrics updates, not campaign updates (those are important)
          if (messageType === "telemetry" || messageType === "metrics_update") {
            const lastUpdate = lastUpdateTimeRef.current[messageType] || 0;
            if (now - lastUpdate < refreshRateMs) {
              // Skip this message, not enough time has passed
              return;
            }
            lastUpdateTimeRef.current[messageType] = now;
          }
          
          setLastMessage(message);
        } catch (error) {
          console.error("[websocket] Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[websocket] Error:", error);
      };

      ws.onclose = () => {
        console.log("[websocket] Disconnected");
        setIsConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("[websocket] Attempting to reconnect...");
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error("[websocket] Connection error:", error);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  return { isConnected, lastMessage };
}
