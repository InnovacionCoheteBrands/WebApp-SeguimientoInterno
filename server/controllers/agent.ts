import { randomUUID } from "crypto";
import { Router } from "express";
import type { ChatCompletionToolMessageParam } from "openai/resources/chat/completions";
import type { AgentToolContext } from "../agent-tools";
import {
    getRegisteredTool,
    getLlmToolSchemas,
    authorizeAgentAction,
    safeParseToolArgs,
    validateRequiredFields,
} from "../agent-tool-registry";
import { storage } from "../storage";
import { createAiClient, getAiHealthStatus, mapAiError, resolveAiModel } from "../utils/ai";
import { logger } from "../utils/logger";
import { logAction } from "../utils/audit-helper";
import {
    recordChatRequest,
    recordToolCall,
    recordToolProposed,
    recordToolApproval,
    recordToolRejection,
    recordAuthDenied,
    recordValidationError,
    getAgentMetrics,
} from "../utils/agent-metrics";
import { prepareSummaryPayload, SummaryValidationError, summaryModuleSchema } from "../utils/ai-summary";

const router = Router();

// ---------------------------------------------------------------------------
// Types — Canonical agent response contract
// ---------------------------------------------------------------------------

interface ProposedActionPayload {
    id: string;
    toolName: string;
    toolArgs: Record<string, any>;
    description: string;
    riskLevel: "low" | "medium" | "high";
}

// ---------------------------------------------------------------------------
// POST /api/agent/chat — Conversational agent with tool calling
// ---------------------------------------------------------------------------

router.post("/agent/chat", async (req, res) => {
    const requestId = randomUUID();
    recordChatRequest();

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages array is required" });
        }

        const ctx: AgentToolContext = { storage };
        const { client: openai, config } = createAiClient();
        const chatModel = resolveAiModel(config, "agent");

        const systemMessage = {
            role: "system" as const,
            content: `You are the Marketing Operations AI Assistant for Cohete Brands marketing agency. You help users query and manage their marketing campaigns, client operations, and team members.

Current date and time: ${new Date().toISOString()}

You have access to QUERY FUNCTIONS (executed automatically):
- get_campaigns: View all marketing campaigns
- get_analytics: View campaign analytics
- get_team: View all team members
- get_client_status: View client accounts
- get_resources: View marketing resources
- get_database_stats: View database statistics
- get_leads: View all leads/prospects
- get_leads_metrics: View leads funnel metrics
- get_projects: View all projects with client and health info
- get_transactions: View financial transactions
- get_financial_summary: View income, expenses, and net profit

You have access to ACTION FUNCTIONS (require user approval before execution):
- create_campaign, update_campaign, delete_campaign
- create_client, update_client, delete_client
- create_team_member, update_team_member, delete_team_member
- create_lead, update_lead, delete_lead
- create_project, update_project, delete_project

IMPORTANT GUIDELINES:
1. Always be helpful, concise, and professional. Respond in Spanish.
2. When the user requests to create, update, or delete a record, call the appropriate function. The system will handle the approval flow.
3. If a function returns an error, inform the user gracefully.
4. When a function returns a "pending approval" status, explain to the user what action is pending and that they need to approve it.
5. If the user asks for information, use the query functions to get real-time context.
6. YOU CANNOT modify user accounts or passwords. YOU CANNOT execute arbitrary code. Stick to the defined tools.`,
        };

        const completion = await openai.chat.completions.create({
            model: chatModel,
            messages: [systemMessage, ...messages],
            tools: getLlmToolSchemas(),
            tool_choice: "auto",
            max_completion_tokens: 2048,
        });

        const responseMessage = completion.choices[0]?.message;
        if (!responseMessage) {
            throw new Error("No response from AI");
        }

        if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
            return res.json({
                role: "assistant",
                content: responseMessage.content || "",
                requestId,
            });
        }

        const toolResults: ChatCompletionToolMessageParam[] = [];
        const proposedActions: ProposedActionPayload[] = [];

        for (const toolCall of responseMessage.tool_calls) {
            if (toolCall.type !== "function") continue;

            const toolName = toolCall.function.name;
            const tool = getRegisteredTool(toolName);

            if (!tool) {
                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool" as const,
                    content: JSON.stringify({ error: `Unknown function: ${toolName}` }),
                });
                continue;
            }

            const parseResult = safeParseToolArgs(toolCall.function.arguments);
            if (!parseResult.ok) {
                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool" as const,
                    content: JSON.stringify({ error: parseResult.error }),
                });
                logger.warn({ requestId, toolName, raw: toolCall.function.arguments }, "Model returned invalid JSON for tool arguments");
                continue;
            }
            const args = parseResult.args;

            const authResult = authorizeAgentAction(req.user, tool);
            if (!authResult.allowed) {
                recordAuthDenied(toolName);
                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool" as const,
                    content: JSON.stringify({ error: authResult.reason }),
                });
                logger.warn({ requestId, toolName, code: authResult.code, userId: req.user?.id }, "Agent tool authorization denied");
                continue;
            }

            const validationResult = validateRequiredFields(toolName, args);
            if (!validationResult.allowed) {
                recordValidationError(toolName);
                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool" as const,
                    content: JSON.stringify({ error: validationResult.reason }),
                });
                continue;
            }

            const { policy } = tool;

            if (policy.requiresApproval) {
                recordToolProposed(toolName);
                const actionId = randomUUID();
                proposedActions.push({
                    id: actionId,
                    toolName,
                    toolArgs: args,
                    description: tool.describeAction(args),
                    riskLevel: policy.riskLevel,
                });

                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool" as const,
                    content: JSON.stringify({
                        pending: true,
                        message: `Action "${toolName}" requires user approval before execution. The user will see an approval prompt.`,
                    }),
                });
            } else {
                const toolStartMs = Date.now();
                try {
                    const result = await tool.execute(ctx, args);
                    recordToolCall(toolName, true, Date.now() - toolStartMs);

                    if (policy.kind === "read") {
                        logAction(req, policy.auditAction, policy.entityType, null,
                            `[Agente IA] ${tool.describeAction(args)}`,
                            { requestId, toolName },
                        );
                    }

                    toolResults.push({
                        tool_call_id: toolCall.id,
                        role: "tool" as const,
                        content: JSON.stringify(result),
                    });
                } catch (err: any) {
                    recordToolCall(toolName, false, Date.now() - toolStartMs);
                    toolResults.push({
                        tool_call_id: toolCall.id,
                        role: "tool" as const,
                        content: JSON.stringify({ error: err.message || "Tool execution failed" }),
                    });
                    logger.error({ err, requestId, toolName }, "Tool execution error in agent chat");
                }
            }
        }

        const finalCompletion = await openai.chat.completions.create({
            model: chatModel,
            messages: [systemMessage, ...messages, responseMessage, ...toolResults],
            max_completion_tokens: 2048,
        });

        const finalMessage = finalCompletion.choices[0]?.message;

        return res.json({
            role: "assistant",
            content: finalMessage?.content || "",
            requestId,
            proposedActions: proposedActions.length > 0 ? proposedActions : undefined,
        });
    } catch (error) {
        const mapped = mapAiError(error, requestId);
        logger.error({ err: error, requestId, response: mapped.body }, "AI Agent Error:");
        res.status(mapped.status).json(mapped.body);
    }
});

// ---------------------------------------------------------------------------
// POST /api/agent/execute — Execute a previously proposed (approved) action
// ---------------------------------------------------------------------------

router.post("/agent/execute", async (req, res) => {
    const requestId = randomUUID();

    try {
        const { toolName, toolArgs } = req.body;

        if (!toolName || typeof toolName !== "string") {
            return res.status(400).json({
                error: "toolName is required",
                code: "AGENT_MISSING_TOOL",
                requestId,
            });
        }

        const tool = getRegisteredTool(toolName);
        if (!tool) {
            return res.status(400).json({
                error: `Unknown tool: ${toolName}`,
                code: "AGENT_UNKNOWN_TOOL",
                requestId,
            });
        }

        const authResult = authorizeAgentAction(req.user, tool);
        if (!authResult.allowed) {
            return res.status(403).json({
                error: "Forbidden",
                details: authResult.reason,
                code: authResult.code || "AGENT_ACTION_FORBIDDEN",
                requestId,
            });
        }

        const safeArgs = toolArgs && typeof toolArgs === "object" ? toolArgs : {};

        const validationResult = validateRequiredFields(toolName, safeArgs);
        if (!validationResult.allowed) {
            return res.status(400).json({
                error: "Validation failed",
                details: validationResult.reason,
                code: validationResult.code || "AGENT_VALIDATION_ERROR",
                requestId,
            });
        }

        const ctx: AgentToolContext = { storage };

        const startMs = Date.now();
        const result = await tool.execute(ctx, safeArgs);
        const durationMs = Date.now() - startMs;

        recordToolApproval(toolName, durationMs);

        logAction(req, tool.policy.auditAction, tool.policy.entityType,
            result?.data?.id?.toString() || null,
            `[Agente IA — Aprobado] ${tool.describeAction(safeArgs)}`,
            { requestId, toolName, toolArgs: safeArgs, durationMs },
        );

        logger.info({
            requestId,
            toolName,
            durationMs,
            userId: req.user?.id,
        }, "Agent action executed after approval");

        return res.json({
            success: true,
            content: result.message || "Acción ejecutada correctamente.",
            data: result.data,
            requestId,
            toolName,
        });
    } catch (error: any) {
        logger.error({ err: error, requestId }, "Agent execute error");
        return res.status(500).json({
            error: "Execution failed",
            details: error.message || "Error al ejecutar la acción aprobada.",
            code: "AGENT_EXECUTION_ERROR",
            requestId,
        });
    }
});

// ---------------------------------------------------------------------------
// POST /api/agent/reject — Audit log for rejected actions
// ---------------------------------------------------------------------------

router.post("/agent/reject", async (req, res) => {
    try {
        const { toolName, toolArgs, description } = req.body;

        if (!toolName || typeof toolName !== "string") {
            return res.status(400).json({ error: "toolName is required" });
        }

        const tool = getRegisteredTool(toolName);
        const desc = description || tool?.describeAction(toolArgs || {}) || toolName;

        recordToolRejection(toolName);

        logAction(req, "REJECT", tool?.policy.entityType || "UNKNOWN", null,
            `[Agente IA — Rechazado] ${desc}`,
            { toolName, toolArgs: toolArgs || {} },
        );

        return res.json({ success: true });
    } catch (error: any) {
        logger.error({ err: error }, "Agent reject audit error");
        return res.status(500).json({ error: "Failed to log rejection" });
    }
});

// ---------------------------------------------------------------------------
// GET /api/agent/health — AI configuration health check
// ---------------------------------------------------------------------------

router.get("/agent/health", (_req, res) => {
    res.json({
        ...getAiHealthStatus(),
        checkedAt: new Date().toISOString(),
    });
});

// ---------------------------------------------------------------------------
// GET /api/agent/metrics — Agent operational metrics
// ---------------------------------------------------------------------------

router.get("/agent/metrics", (_req, res) => {
    res.json(getAgentMetrics());
});

// ---------------------------------------------------------------------------
// POST /api/agent/summary — AI-generated executive summaries
// ---------------------------------------------------------------------------

router.post("/agent/summary", async (req, res) => {
    const requestId = randomUUID();

    try {
        const parsedModule = summaryModuleSchema.safeParse(req.body?.module);
        if (!parsedModule.success) {
            return res.status(400).json({
                error: "Invalid summary module",
                details: "El modulo solicitado no es compatible con resumenes de IA.",
                code: "SUMMARY_INVALID_MODULE",
                retryable: false,
                requestId,
            });
        }

        if (!("data" in (req.body || {}))) {
            return res.status(400).json({
                error: "Summary data is required",
                details: "Se requiere un payload con datos para generar el resumen.",
                code: "SUMMARY_MISSING_DATA",
                retryable: false,
                requestId,
            });
        }

        const module = parsedModule.data;
        const { preparedData, rawPayloadBytes, preparedPayloadBytes } = prepareSummaryPayload(module, req.body.data);
        const { client: openai, config } = createAiClient();
        const summaryModel = resolveAiModel(config, "summary");

        const systemMessage = {
            role: "system" as const,
            content: `Eres un analista financiero y operativo experto de la agencia Cohete Brands.
Tu tarea es generar un Resumen Ejecutivo de Operaciones claro, accionable y directamente al grano, basado en los datos proporcionados.
Modulo actual: ${module.toUpperCase()}

REGLAS ESTRICTAS:
1. Formato Markdown elegante.
2. Maximo 3 parrafos cortos y 1 lista de vietas con 3 puntos clave.
3. No saludes ni uses introducciones redundantes. Ve directo a los insights.
4. Destaca anomalias, riesgos o exitos evidentes en los datos.`,
        };

        const userMessage = {
            role: "user" as const,
            content: `Datos agregados y resumidos del modulo ${module}: ${JSON.stringify(preparedData)}`,
        };

        logger.info({
            requestId,
            module,
            provider: config.provider,
            model: summaryModel,
            rawPayloadBytes,
            preparedPayloadBytes,
        }, "AI summary request started");

        const completion = await openai.chat.completions.create({
            model: summaryModel,
            messages: [systemMessage, userMessage],
            max_completion_tokens: 800,
            temperature: 0.3,
        });

        const summaryResponse = completion.choices[0]?.message?.content;
        if (!summaryResponse) {
            throw new Error("No response generated from AI");
        }

        logger.info({
            requestId,
            module,
            provider: config.provider,
            model: summaryModel,
            rawPayloadBytes,
            preparedPayloadBytes,
        }, "AI summary generated successfully");

        res.json({
            summary: summaryResponse,
            meta: {
                requestId,
                provider: config.provider,
                model: summaryModel,
                rawPayloadBytes,
                preparedPayloadBytes,
            },
        });
    } catch (error) {
        if (error instanceof SummaryValidationError) {
            logger.warn({ err: error, requestId }, "AI Summary validation error");
            return res.status(error.status).json({
                error: "Invalid summary request",
                message: error.message,
                code: error.code,
                retryable: error.retryable,
                requestId,
            });
        }

        const mapped = mapAiError(error, requestId);
        logger.error({ err: error, requestId, response: mapped.body }, "AI Summary Error:");
        res.status(mapped.status).json(mapped.body);
    }
});

export default router;
