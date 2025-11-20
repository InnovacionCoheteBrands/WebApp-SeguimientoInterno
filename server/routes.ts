import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMissionSchema, 
  updateMissionSchema,
  insertFleetPositionSchema,
  insertPersonnelSchema,
  updatePersonnelSchema,
  insertPersonnelAssignmentSchema,
  insertDataHealthSchema
} from "@shared/schema";
import { z } from "zod";
import { setupWebSocket, broadcastMissionUpdate } from "./websocket";
import OpenAI from "openai";
import {
  agentTools,
  getMissions,
  getAnalytics,
  getPersonnel,
  getFleetStatus,
  getDataHealth,
  getDatabaseStats,
  proposeCreateMission,
  proposeUpdateMission,
  proposeDeleteMission,
  executeApprovedAction,
  type AgentToolContext,
} from "./agent-tools";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/missions", async (req, res) => {
    try {
      const missions = await storage.getMissions();
      res.json(missions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch missions" });
    }
  });

  app.get("/api/missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mission = await storage.getMissionById(id);
      if (!mission) {
        return res.status(404).json({ error: "Mission not found" });
      }
      res.json(mission);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mission" });
    }
  });

  app.post("/api/missions", async (req, res) => {
    try {
      const validatedData = insertMissionSchema.parse(req.body);
      const mission = await storage.createMission(validatedData);
      await broadcastMissionUpdate(mission);
      res.status(201).json(mission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create mission" });
    }
  });

  app.patch("/api/missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateMissionSchema.parse(req.body);
      const mission = await storage.updateMission(id, validatedData);
      if (!mission) {
        return res.status(404).json({ error: "Mission not found" });
      }
      await broadcastMissionUpdate(mission);
      res.json(mission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update mission" });
    }
  });

  app.delete("/api/missions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMission(id);
      if (!deleted) {
        return res.status(404).json({ error: "Mission not found" });
      }
      await broadcastMissionUpdate();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mission" });
    }
  });

  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get("/api/telemetry", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 24;
      const data = await storage.getTelemetryData(limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch telemetry data" });
    }
  });

  app.get("/api/fleet", async (req, res) => {
    try {
      const positions = await storage.getFleetPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fleet positions" });
    }
  });

  app.post("/api/fleet", async (req, res) => {
    try {
      const validatedData = insertFleetPositionSchema.parse(req.body);
      const position = await storage.createFleetPosition(validatedData);
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create fleet position" });
    }
  });

  app.patch("/api/fleet/:missionId", async (req, res) => {
    try {
      const missionId = parseInt(req.params.missionId);
      const validatedData = insertFleetPositionSchema.partial().parse(req.body);
      const position = await storage.updateFleetPosition(missionId, validatedData);
      if (!position) {
        return res.status(404).json({ error: "Fleet position not found" });
      }
      res.json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update fleet position" });
    }
  });

  app.delete("/api/fleet/:missionId", async (req, res) => {
    try {
      const missionId = parseInt(req.params.missionId);
      const deleted = await storage.deleteFleetPosition(missionId);
      if (!deleted) {
        return res.status(404).json({ error: "Fleet position not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete fleet position" });
    }
  });

  app.get("/api/personnel", async (req, res) => {
    try {
      const allPersonnel = await storage.getPersonnel();
      res.json(allPersonnel);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personnel" });
    }
  });

  app.post("/api/personnel", async (req, res) => {
    try {
      const validatedData = insertPersonnelSchema.parse(req.body);
      const person = await storage.createPersonnel(validatedData);
      res.status(201).json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create personnel" });
    }
  });

  app.patch("/api/personnel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updatePersonnelSchema.parse(req.body);
      const person = await storage.updatePersonnel(id, validatedData);
      if (!person) {
        return res.status(404).json({ error: "Personnel not found" });
      }
      res.json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update personnel" });
    }
  });

  app.delete("/api/personnel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePersonnel(id);
      if (!deleted) {
        return res.status(404).json({ error: "Personnel not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete personnel" });
    }
  });

  app.get("/api/personnel/assignments", async (req, res) => {
    try {
      const assignments = await storage.getPersonnelAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.post("/api/personnel/assignments", async (req, res) => {
    try {
      const validatedData = insertPersonnelAssignmentSchema.parse(req.body);
      const assignment = await storage.createPersonnelAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  app.delete("/api/personnel/assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePersonnelAssignment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete assignment" });
    }
  });

  app.get("/api/data-health", async (req, res) => {
    try {
      const healthData = await storage.getDataHealth();
      res.json(healthData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data health" });
    }
  });

  app.post("/api/data-health", async (req, res) => {
    try {
      const validatedData = insertDataHealthSchema.parse(req.body);
      const health = await storage.createDataHealth(validatedData);
      res.status(201).json(health);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create data health entry" });
    }
  });

  app.patch("/api/data-health/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDataHealthSchema.partial().parse(req.body);
      const health = await storage.updateDataHealth(id, validatedData);
      if (!health) {
        return res.status(404).json({ error: "Data health entry not found" });
      }
      res.json(health);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update data health entry" });
    }
  });

  app.delete("/api/data-health/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDataHealth(id);
      if (!deleted) {
        return res.status(404).json({ error: "Data health entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete data health entry" });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    try {
      const missions = await storage.getMissions();
      const telemetry = await storage.getTelemetryData(100);
      
      const analytics = {
        totalMissions: missions.length,
        activeMissions: missions.filter(m => m.status === "Active").length,
        completedMissions: missions.filter(m => m.status === "Completed").length,
        averageProgress: missions.length > 0 
          ? Math.round(missions.reduce((sum, m) => sum + m.progress, 0) / missions.length)
          : 0,
        priorityBreakdown: {
          critical: missions.filter(m => m.priority === "Critical").length,
          high: missions.filter(m => m.priority === "High").length,
          medium: missions.filter(m => m.priority === "Medium").length,
          low: missions.filter(m => m.priority === "Low").length,
        },
        recentActivity: telemetry.slice(0, 20).reverse(),
      };
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // AI Agent Chat Endpoint
  app.post("/api/agent/chat", async (req, res) => {
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
        await broadcastMissionUpdate({ id: 0, missionCode: "SYSTEM", name: "Agent Action", status: "Active", progress: 0, priority: "High" });
        return res.json({
          role: "assistant",
          content: result.message,
          executedAction: true,
        });
      }

      // System prompt for the agent
      const systemMessage = {
        role: "system" as const,
        content: `You are the Mission Control AI Assistant for Cohete Brands. You help users query and manage their mission control dashboard.

Current date and time: ${new Date().toISOString()}

You have access to the following capabilities:

QUERY FUNCTIONS (read-only, no approval needed):
- get_missions: View all missions with status, progress, and priority
- get_analytics: View analytics including mission distribution and success rates
- get_personnel: View all personnel with roles and clearance levels
- get_fleet_status: View real-time fleet positions and velocities
- get_data_health: View system health status for all components
- get_database_stats: View comprehensive database statistics

ACTION FUNCTIONS (require user approval):
- propose_create_mission: Suggest creating a new mission (user must approve)
- propose_update_mission: Suggest updating an existing mission (user must approve)
- propose_delete_mission: Suggest deleting a mission (user must approve)

IMPORTANT GUIDELINES:
1. Always be helpful, concise, and professional
2. Use query functions to answer questions about the system
3. For any action (create/update/delete), use the "propose" functions which require user approval
4. When proposing actions, clearly explain what will happen
5. Provide data in a clear, formatted way
6. If asked about live/current data, use the query functions to get real-time information
7. Be proactive in suggesting actions that might help the user

Remember: Actions require explicit user approval before execution.`,
      };

      // Call GPT-5 with function calling
      const completion = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
        const toolResults = [];

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;
          
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          let result;

          // Execute the appropriate function
          switch (functionName) {
            case "get_missions":
              result = await getMissions(ctx);
              break;
            case "get_analytics":
              result = await getAnalytics(ctx);
              break;
            case "get_personnel":
              result = await getPersonnel(ctx);
              break;
            case "get_fleet_status":
              result = await getFleetStatus(ctx);
              break;
            case "get_data_health":
              result = await getDataHealth(ctx);
              break;
            case "get_database_stats":
              result = await getDatabaseStats(ctx);
              break;
            case "propose_create_mission":
              result = proposeCreateMission(functionArgs);
              break;
            case "propose_update_mission":
              result = proposeUpdateMission(functionArgs.missionId, functionArgs.updates);
              break;
            case "propose_delete_mission":
              result = proposeDeleteMission(functionArgs.missionId);
              break;
            default:
              result = { error: `Unknown function: ${functionName}` };
          }

          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            name: functionName,
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
          .map((tr) => JSON.parse(tr.content))
          .filter((content) => content.requiresApproval);

        return res.json({
          role: "assistant",
          content: finalMessage?.content || "I've processed your request.",
          toolCalls: responseMessage.tool_calls,
          toolResults,
          proposedActions: proposedActions.length > 0 ? proposedActions : undefined,
        });
      }

      // No function calls, just return the response
      return res.json({
        role: "assistant",
        content: responseMessage.content || "I'm here to help with your Mission Control dashboard.",
      });

    } catch (error: any) {
      console.error("Agent chat error:", error);
      res.status(500).json({ 
        error: "Failed to process chat message",
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  setupWebSocket(httpServer);

  return httpServer;
}
