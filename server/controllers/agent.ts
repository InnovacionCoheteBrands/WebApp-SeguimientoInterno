import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { broadcastCampaignUpdate } from "../websocket";
import OpenAI from "openai";
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
    type AgentToolContext
} from "../agent-tools";

const router = Router();

const openai = new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// AI Agent Chat Endpoint
router.post("/agent/chat", async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages array is required" });
        }

        const ctx: AgentToolContext = { storage };

        // System prompt for the agent
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

        // Call GPT-5 with function calling
        const completion = await openai.chat.completions.create({
            model: "gpt-5", // Assuming user has access to this model via their local proxy
            messages: [systemMessage, ...messages],
            tools: agentTools,
            tool_choice: "auto",
            max_completion_tokens: 2048,
        });

        const responseMessage = completion.choices[0]?.message;

        if (!responseMessage) {
            throw new Error("No response from AI");
        }

        // If the model wants to call functions
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            const toolResults: ChatCompletionToolMessageParam[] = [];

            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.type !== 'function') continue;

                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);

                let result;

                // Execute the appropriate function
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

            // Get the final response from the model with tool results
            const finalCompletion = await openai.chat.completions.create({
                model: "gpt-5",
                messages: [
                    systemMessage,
                    ...messages,
                    responseMessage,
                    ...toolResults,
                ],
                max_completion_tokens: 2048,
            });

            const finalMessage = finalCompletion.choices[0]?.message;

            return res.json({
                role: "assistant",
                content: finalMessage?.content,
                toolCalls: toolResults, // Return tool results for UI debugging if needed
            });
        }

        res.json(responseMessage);
    } catch (error) {
        logger.error({ err: error }, "AI Agent Error:");
        res.status(500).json({ error: "Failed to process AI request" });
    }
});

export default router;
