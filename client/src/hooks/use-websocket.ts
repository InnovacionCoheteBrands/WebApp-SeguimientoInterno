import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: "telemetry" | "campaign_update" | "metrics_update";
  data: any;
}

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
