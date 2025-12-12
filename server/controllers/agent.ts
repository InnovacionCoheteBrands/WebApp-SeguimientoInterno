import { Router } from "express";
import { storage } from "../storage";
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
    proposeCreateCampaign,
    proposeUpdateCampaign,
    proposeDeleteCampaign,
    executeApprovedAction,
    type AgentToolContext,
    type ActionProposal
} from "../agent-tools";

const router = Router();

const openai = new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// AI Agent Chat Endpoint
router.post("/agent/chat", async (req, res) => {
    try {
        const { messages, executeAction } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages array is required" });
        }

        const ctx: AgentToolContext = { storage };

        // If executing an approved action
        if (executeAction) {
            const { actionType, actionData } = executeAction;
            const result = await executeApprovedAction(ctx, actionType, actionData);
            await broadcastCampaignUpdate({
                id: 0,
                campaignCode: "SYSTEM",
                name: "Agent Action",
                clientName: "System",
                channel: "Internal",
                status: "Active",
                progress: 0,
                priority: "High",
                budget: 0,
                spend: 0,
                targetAudience: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return res.json({
                role: "assistant",
                content: result.message,
                executedAction: true,
            });
        }

        // System prompt for the agent
        const systemMessage = {
            role: "system" as const,
            content: `You are the Marketing Operations AI Assistant for Cohete Brands marketing agency. You help users query and manage their marketing campaigns and client operations.

Current date and time: ${new Date().toISOString()}

You have access to the following capabilities:

QUERY FUNCTIONS (read-only, no approval needed):
- get_campaigns: View all marketing campaigns with status, progress, budget, and client info
- get_analytics: View campaign analytics including performance metrics and ROI
- get_team: View all team members with roles and assignments
- get_client_status: View client accounts with health scores and budgets
- get_resources: View marketing resources and deliverables status
- get_database_stats: View comprehensive database statistics

ACTION FUNCTIONS (require user approval):
- propose_create_campaign: Suggest creating a new marketing campaign (user must approve)
- propose_update_campaign: Suggest updating an existing campaign (user must approve)
- propose_delete_campaign: Suggest deleting a campaign (user must approve)

IMPORTANT GUIDELINES:
1. Always be helpful, concise, and professional
2. Use query functions to answer questions about campaigns, clients, and team
3. For any action (create/update/delete), use the "propose" functions which require user approval
4. When proposing actions, clearly explain what will happen
5. Provide marketing metrics in a clear, formatted way
6. If asked about live/current data, use the query functions to get real-time information
7. Be proactive in suggesting campaign optimizations and insights

Remember: Actions require explicit user approval before execution.`,
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
                    case "propose_create_campaign":
                        result = proposeCreateCampaign(functionArgs);
                        break;
                    case "propose_update_campaign":
                        result = proposeUpdateCampaign(functionArgs.campaignId, functionArgs.updates);
                        break;
                    case "propose_delete_campaign":
                        result = proposeDeleteCampaign(functionArgs.campaignId);
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

            // Check if any tool results contain approval proposals
            const proposedActions = toolResults
                .map((tr) => JSON.parse(tr.content as string))
                .filter((content) => (content as ActionProposal).requiresApproval);

            return res.json({
                role: "assistant",
                content: finalMessage?.content,
                toolCalls: toolResults, // Return tool results for UI debugging if needed
                proposedActions: proposedActions.length > 0 ? proposedActions : undefined,
            });
        }

        res.json(responseMessage);
    } catch (error) {
        console.error("AI Agent Error:", error);
        res.status(500).json({ error: "Failed to process AI request" });
    }
});

export default router;
