/**
 * Hook to manage in-app notifications based on user settings
 * Handles toast notifications and Web Notifications API
 */

import { useEffect, useRef } from "react";
import { useToast } from "./use-toast";
import { useSystemSettings } from "./use-system-settings";

interface WebSocketMessage {
  type: "telemetry" | "campaign_update" | "metrics_update";
  data: any;
}

export function useNotifications(lastMessage: WebSocketMessage | null) {
  const { toast } = useToast();
  const { data: settings } = useSystemSettings();
  const notificationPermission = useRef<NotificationPermission>("default");

  // Request Web Notifications permission if emailNotifications is enabled
  useEffect(() => {
    if (settings?.emailNotifications && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          notificationPermission.current = permission;
        });
      } else {
        notificationPermission.current = Notification.permission;
      }
    }
  }, [settings?.emailNotifications]);

  // Helper to send both toast and native notification
  const sendNotification = (title: string, description: string, useNative: boolean = false) => {
    // Always show toast
    toast({
      title,
      description,
    });

    // Optionally send native notification if emailNotifications is enabled
    if (
      useNative &&
      settings?.emailNotifications &&
      "Notification" in window &&
      notificationPermission.current === "granted"
    ) {
      new Notification(title, {
        body: description,
        icon: "/favicon.png",
        badge: "/favicon.png",
      });
    }
  };

  useEffect(() => {
    if (!lastMessage || !settings) return;

    const { type, data } = lastMessage;

    // Campaign Alerts
    if (type === "campaign_update" && settings.campaignAlerts) {
      const campaignData = Array.isArray(data) ? data[0] : data;
      if (campaignData) {
        sendNotification(
          "Actualización de Campaña",
          `La campaña ${campaignData.name || campaignData.campaignCode || ""} ha sido actualizada`,
          true // Use native notification for campaign alerts
        );
      }
    }

    // Analytics Alerts (telemetry threshold) - DISABLED during dev
    // if (type === "telemetry" && settings.analyticsAlerts) {
    //   const value = data?.value;
    //   if (typeof value === "number") {
    //     if (value > 85) {
    //       sendNotification(
    //         "⚠️ Alerta de Rendimiento",
    //         `El rendimiento del sistema ha alcanzado ${value}% (Alto)`,
    //         false
    //       );
    //     } else if (value < 30) {
    //       sendNotification(
    //         "📉 Alerta de Rendimiento",
    //         `El rendimiento del sistema ha bajado a ${value}% (Bajo)`,
    //         false
    //       );
    //     }
    //   }
    // }

    // System Alerts (metrics with high urgency)
    if (type === "metrics_update" && settings.systemAlerts) {
      const urgencyLevel = data?.urgencyLevel?.value;
      if (typeof urgencyLevel === "string" && (urgencyLevel === "HIGH" || urgencyLevel === "CRITICAL")) {
        sendNotification(
          "🚨 Alerta del Sistema",
          `Nivel de urgencia: ${urgencyLevel}. Se requiere atención inmediata.`,
          true // Use native notification for critical system alerts
        );
      }
    }
  }, [lastMessage, settings, toast]);
}

