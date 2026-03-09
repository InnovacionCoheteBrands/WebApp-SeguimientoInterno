import { storage } from "../storage";
import type { Request } from "express";

/**
 * Audit Log Helper - Fire-and-forget utility for logging user actions.
 * 
 * Usage:
 *   logAction(req, "CREATE", "PROJECT", project.id.toString(), "Creó el proyecto 'Mi Sitio Web'");
 */
export function logAction(
    req: Request,
    action: string,
    entityType: string,
    entityId: string | null,
    details: string,
    metadata?: Record<string, any>
): void {
    // Extract user info from JWT payload (set by requireAuth middleware)
    const user = (req as any).user;
    if (!user) {
        console.warn(`[AuditLog] ⚠️ No user in request for action: ${action} ${entityType} - skipping`);
        return;
    }

    const logData = {
        userId: user.id,
        username: user.username || "unknown",
        action,
        entityType,
        entityId: entityId ?? undefined,
        details,
        metadata: metadata ?? undefined,
        ipAddress: req.ip || req.socket?.remoteAddress || undefined,
    };

    // Fire-and-forget: don't block the response
    storage.createAuditLog(logData)
        .then(() => {
            console.log(`[AuditLog] ✅ ${user.username} -> ${action} ${entityType}`);
        })
        .catch(err => {
            console.error(`[AuditLog] ❌ Failed to write log:`, err.message);
            console.error(`[AuditLog] Data was:`, JSON.stringify(logData, null, 2));
        });
}

