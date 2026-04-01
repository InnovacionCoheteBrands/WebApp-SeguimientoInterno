/**
 * In-memory agent metrics collector.
 * Tracks tool call success/failure, latency, approvals, and rejections.
 * Metrics are exposed via GET /api/agent/metrics.
 */

interface ToolMetricEntry {
    calls: number;
    errors: number;
    totalLatencyMs: number;
    approvals: number;
    rejections: number;
    authDenied: number;
    validationErrors: number;
}

interface AgentMetrics {
    startedAt: string;
    totalChatRequests: number;
    totalExecuteRequests: number;
    totalRejectRequests: number;
    toolMetrics: Record<string, ToolMetricEntry>;
}

const metrics: AgentMetrics = {
    startedAt: new Date().toISOString(),
    totalChatRequests: 0,
    totalExecuteRequests: 0,
    totalRejectRequests: 0,
    toolMetrics: {},
};

function ensureTool(toolName: string): ToolMetricEntry {
    if (!metrics.toolMetrics[toolName]) {
        metrics.toolMetrics[toolName] = {
            calls: 0,
            errors: 0,
            totalLatencyMs: 0,
            approvals: 0,
            rejections: 0,
            authDenied: 0,
            validationErrors: 0,
        };
    }
    return metrics.toolMetrics[toolName];
}

export function recordChatRequest(): void {
    metrics.totalChatRequests++;
}

export function recordToolCall(toolName: string, success: boolean, latencyMs?: number): void {
    const entry = ensureTool(toolName);
    entry.calls++;
    if (!success) entry.errors++;
    if (latencyMs !== undefined) entry.totalLatencyMs += latencyMs;
}

export function recordToolProposed(toolName: string): void {
    ensureTool(toolName);
}

export function recordToolApproval(toolName: string, latencyMs: number): void {
    const entry = ensureTool(toolName);
    entry.approvals++;
    entry.totalLatencyMs += latencyMs;
    metrics.totalExecuteRequests++;
}

export function recordToolRejection(toolName: string): void {
    const entry = ensureTool(toolName);
    entry.rejections++;
    metrics.totalRejectRequests++;
}

export function recordAuthDenied(toolName: string): void {
    ensureTool(toolName).authDenied++;
}

export function recordValidationError(toolName: string): void {
    ensureTool(toolName).validationErrors++;
}

export function getAgentMetrics() {
    const tools = Object.entries(metrics.toolMetrics).map(([name, m]) => ({
        name,
        calls: m.calls,
        errors: m.errors,
        successRate: m.calls > 0 ? Math.round(((m.calls - m.errors) / m.calls) * 100) : 100,
        avgLatencyMs: m.calls > 0 ? Math.round(m.totalLatencyMs / m.calls) : 0,
        approvals: m.approvals,
        rejections: m.rejections,
        authDenied: m.authDenied,
        validationErrors: m.validationErrors,
    }));

    return {
        startedAt: metrics.startedAt,
        uptimeSeconds: Math.round((Date.now() - new Date(metrics.startedAt).getTime()) / 1000),
        totalChatRequests: metrics.totalChatRequests,
        totalExecuteRequests: metrics.totalExecuteRequests,
        totalRejectRequests: metrics.totalRejectRequests,
        tools,
    };
}
