import { randomUUID } from "crypto";
import { Router } from "express";
import type { ChatCompletionToolMessageParam } from "openai/resources/chat/completions";
import {
    agentTools,
    getCampaigns,
    getAnalytics,
    getTeam,
    getClientStatus,
    getResources,
    getDatabaseStats,
    directCreateCampaign,
    directUpdateCampaign,
    directDeleteCampaign,
    createClient,
    updateClient,
    deleteClient,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    type AgentToolContext,
} from "../agent-tools";
import { storage } from "../storage";
import { createAiClient, getAiHealthStatus, mapAiError } from "../utils/ai";
import { logger } from "../utils/logger";
import { prepareSummaryPayload, SummaryValidationError, summaryModuleSchema } from "../utils/ai-summary";

const router = Router();

router.post("/agent/chat", async (req, res) => {
    const requestId = randomUUID();

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages array is required" });
        }

        const ctx: AgentToolContext = { storage };
        const { client: openai, config } = createAiClient();

        const systemMessage = {
            role: "system" as const,
            content: `You are the Marketing Operations AI Assistant for Cohete Brands marketing agency. You help users query and manage their marketing campaigns, client operations, and team members.

Current date and time: ${new Date().toISOString()}

You have access to the following QUERY FUNCTIONS:
- get_campaigns: View all marketing campaigns
- get_analytics: View campaign analytics
- get_team: View all team members
- get_client_status: View client accounts
- get_resources: View marketing resources
- get_database_stats: View database statistics

You have access to the following DIRECT ACTION FUNCTIONS:
- create_campaign, update_campaign, delete_campaign
- create_client, update_client, delete_client
- create_team_member, update_team_member, delete_team_member

IMPORTANT GUIDELINES:
1. Always be helpful, concise, and professional.
2. When the user asks you to create, update, or delete a record, use your ACTION FUNCTIONS immediately without asking for extra confirmation.
3. If an action function throws an error (e.g., missing ID), inform the user gracefully.
4. Provide clear confirmations when actions succeed, including IDs or Names of modified entities.
5. If the user asks for information, use the query functions to get real-time context.
6. YOU CANNOT modify user accounts or passwords. YOU CANNOT execute arbitrary code. Stick to the defined tools.`,
        };

        const completion = await openai.chat.completions.create({
            model: config.model,
            messages: [systemMessage, ...messages],
            tools: agentTools,
            tool_choice: "auto",
            max_completion_tokens: 2048,
        });

        const responseMessage = completion.choices[0]?.message;
        if (!responseMessage) {
            throw new Error("No response from AI");
        }

        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            const toolResults: ChatCompletionToolMessageParam[] = [];

            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.type !== "function") continue;

                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);
                let result;

                switch (functionName) {
                    case "get_campaigns":
                        result = await getCampaigns(ctx);
                        break;
                    case "get_analytics":
                        result = await getAnalytics(ctx);
                        break;
                    case "get_team":
                        result = await getTeam(ctx);
                        break;
                    case "get_client_status":
                        result = await getClientStatus(ctx);
                        break;
                    case "get_resources":
                        result = await getResources(ctx);
                        break;
                    case "get_database_stats":
                        result = await getDatabaseStats(ctx);
                        break;
                    case "create_campaign":
                        result = await directCreateCampaign(ctx, functionArgs);
                        break;
                    case "update_campaign":
                        result = await directUpdateCampaign(ctx, functionArgs.campaignId, functionArgs.updates);
                        break;
                    case "delete_campaign":
                        result = await directDeleteCampaign(ctx, functionArgs.campaignId);
                        break;
                    case "create_client":
                        result = await createClient(ctx, functionArgs);
                        break;
                    case "update_client":
                        result = await updateClient(ctx, functionArgs.clientId, functionArgs.updates);
                        break;
                    case "delete_client":
                        result = await deleteClient(ctx, functionArgs.clientId);
                        break;
                    case "create_team_member":
                        result = await createTeamMember(ctx, functionArgs);
                        break;
                    case "update_team_member":
                        result = await updateTeamMember(ctx, functionArgs.teamId, functionArgs.updates);
                        break;
                    case "delete_team_member":
                        result = await deleteTeamMember(ctx, functionArgs.teamId);
                        break;
                    default:
                        result = { error: `Unknown function: ${functionName}` };
                }

                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool" as const,
                    content: JSON.stringify(result),
                });
            }

            const finalCompletion = await openai.chat.completions.create({
                model: config.model,
                messages: [systemMessage, ...messages, responseMessage, ...toolResults],
                max_completion_tokens: 2048,
            });

            const finalMessage = finalCompletion.choices[0]?.message;

            return res.json({
                role: "assistant",
                content: finalMessage?.content,
                toolCalls: toolResults,
            });
        }

        res.json(responseMessage);
    } catch (error) {
        const mapped = mapAiError(error, requestId);
        logger.error({ err: error, requestId, response: mapped.body }, "AI Agent Error:");
        res.status(mapped.status).json(mapped.body);
    }
});

router.get("/agent/health", (_req, res) => {
    res.json({
        ...getAiHealthStatus(),
        checkedAt: new Date().toISOString(),
    });
});

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
            model: config.model,
            rawPayloadBytes,
            preparedPayloadBytes,
        }, "AI summary request started");

        const completion = await openai.chat.completions.create({
            model: config.model,
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
            model: config.model,
            rawPayloadBytes,
            preparedPayloadBytes,
        }, "AI summary generated successfully");

        res.json({
            summary: summaryResponse,
            meta: {
                requestId,
                provider: config.provider,
                model: config.model,
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
