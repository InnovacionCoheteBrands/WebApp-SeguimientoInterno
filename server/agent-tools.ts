import type { IStorage } from "./storage";
import type { InsertMission } from "@shared/schema";

/**
 * Agent tools - Functions that the AI agent can call to query data and perform actions
 * All actions require user approval before execution
 */

export interface AgentToolContext {
  storage: IStorage;
}

/**
 * Query Functions - Safe read-only operations
 */

export async function getMissions(ctx: AgentToolContext) {
  const missions = await ctx.storage.getMissions();
  return {
    success: true,
    data: missions,
    message: `Found ${missions.length} missions in the system`,
  };
}

export async function getAnalytics(ctx: AgentToolContext) {
  const missions = await ctx.storage.getMissions();
  const telemetry = await ctx.storage.getTelemetryData(100);
  
  const analytics = {
    totalMissions: missions.length,
    activeMissions: missions.filter(m => m.status === "Active").length,
    completedMissions: missions.filter(m => m.status === "Completed").length,
    averageProgress: missions.length > 0 
      ? Math.round(missions.reduce((sum, m) => sum + m.progress, 0) / missions.length)
      : 0,
    successRate: missions.length > 0
      ? Math.round((missions.filter(m => m.status === "Completed").length / missions.length) * 100)
      : 0,
    priorityBreakdown: {
      critical: missions.filter(m => m.priority === "Critical").length,
      high: missions.filter(m => m.priority === "High").length,
      medium: missions.filter(m => m.priority === "Medium").length,
      low: missions.filter(m => m.priority === "Low").length,
    },
    recentActivity: telemetry.slice(0, 20).reverse(),
  };
  
  return {
    success: true,
    data: analytics,
    message: "Retrieved analytics data successfully",
  };
}

export async function getPersonnel(ctx: AgentToolContext) {
  const personnel = await ctx.storage.getPersonnel();
  return {
    success: true,
    data: personnel,
    message: `Found ${personnel.length} personnel in the system`,
  };
}

export async function getFleetStatus(ctx: AgentToolContext) {
  const fleetPositions = await ctx.storage.getFleetPositions();
  const missions = await ctx.storage.getMissions();
  
  const fleetData = missions.map((mission) => {
    const position = fleetPositions.find((p) => p.missionId === mission.id);
    return {
      mission,
      position,
    };
  });

  return {
    success: true,
    data: fleetData,
    message: `Retrieved status for ${fleetData.length} fleet vessels`,
  };
}

export async function getDataHealth(ctx: AgentToolContext) {
  const healthData = await ctx.storage.getDataHealth();
  return {
    success: true,
    data: healthData,
    message: `Retrieved health status for ${healthData.length} system components`,
  };
}

export async function getDatabaseStats(ctx: AgentToolContext) {
  const missions = await ctx.storage.getMissions();
  const personnel = await ctx.storage.getPersonnel();
  const fleetPositions = await ctx.storage.getFleetPositions();
  const healthComponents = await ctx.storage.getDataHealth();

  const stats = {
    missions: {
      total: missions.length,
      active: missions.filter(m => m.status === "Active").length,
      pending: missions.filter(m => m.status === "Pending").length,
      completed: missions.filter(m => m.status === "Completed").length,
    },
    personnel: {
      total: personnel.length,
      onDuty: personnel.filter(p => p.status === "On Duty").length,
      offDuty: personnel.filter(p => p.status === "Off Duty").length,
    },
    fleet: {
      tracked: fleetPositions.length,
    },
    health: {
      components: healthComponents.length,
      operational: healthComponents.filter(h => h.status === "Operational").length,
    }
  };

  return {
    success: true,
    data: stats,
    message: "Retrieved comprehensive database statistics",
  };
}

/**
 * Action Functions - Require user approval
 * These return action proposals that must be approved by the user
 */

export interface ActionProposal {
  requiresApproval: true;
  actionType: string;
  actionData: any;
  description: string;
}

export function proposeCreateMission(missionData: InsertMission): ActionProposal {
  return {
    requiresApproval: true,
    actionType: "create_mission",
    actionData: missionData,
    description: `Create new mission: ${missionData.name} (${missionData.missionCode}) with priority ${missionData.priority}`,
  };
}

export function proposeUpdateMission(missionId: number, updates: Partial<InsertMission>): ActionProposal {
  const updateFields = Object.keys(updates).join(", ");
  return {
    requiresApproval: true,
    actionType: "update_mission",
    actionData: { missionId, updates },
    description: `Update mission #${missionId}: ${updateFields}`,
  };
}

export function proposeDeleteMission(missionId: number): ActionProposal {
  return {
    requiresApproval: true,
    actionType: "delete_mission",
    actionData: { missionId },
    description: `Delete mission #${missionId}`,
  };
}

/**
 * Execute approved actions
 */

export async function executeApprovedAction(
  ctx: AgentToolContext,
  actionType: string,
  actionData: any
) {
  switch (actionType) {
    case "create_mission":
      const newMission = await ctx.storage.createMission(actionData);
      return {
        success: true,
        data: newMission,
        message: `Mission "${actionData.name}" created successfully`,
      };

    case "update_mission":
      const updatedMission = await ctx.storage.updateMission(
        actionData.missionId,
        actionData.updates
      );
      return {
        success: true,
        data: updatedMission,
        message: `Mission #${actionData.missionId} updated successfully`,
      };

    case "delete_mission":
      await ctx.storage.deleteMission(actionData.missionId);
      return {
        success: true,
        data: { id: actionData.missionId },
        message: `Mission #${actionData.missionId} deleted successfully`,
      };

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

/**
 * Tool definitions for OpenAI function calling
 */

export const agentTools = [
  {
    type: "function" as const,
    function: {
      name: "get_missions",
      description: "Get all missions in the system with their status, progress, and priority",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_analytics",
      description: "Get analytics data including mission distribution, success rates, and trends",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_personnel",
      description: "Get all personnel with their roles, clearance levels, and shift schedules",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_fleet_status",
      description: "Get real-time fleet status including positions, velocities, and mission assignments",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_data_health",
      description: "Get system health status for all components including storage and replication metrics",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_database_stats",
      description: "Get comprehensive database statistics including counts and statuses across all tables",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_create_mission",
      description: "Propose creating a new mission (requires user approval before execution)",
      parameters: {
        type: "object",
        properties: {
          missionCode: {
            type: "string",
            description: "Unique mission code (e.g., MSN-001)",
          },
          name: {
            type: "string",
            description: "Mission name",
          },
          priority: {
            type: "string",
            enum: ["Low", "Medium", "High", "Critical"],
            description: "Mission priority level",
          },
          status: {
            type: "string",
            enum: ["Pending", "Active", "Completed"],
            description: "Initial mission status",
          },
          progress: {
            type: "number",
            description: "Initial progress percentage (0-100)",
          },
        },
        required: ["missionCode", "name", "priority"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_update_mission",
      description: "Propose updating an existing mission (requires user approval before execution)",
      parameters: {
        type: "object",
        properties: {
          missionId: {
            type: "number",
            description: "ID of the mission to update",
          },
          updates: {
            type: "object",
            properties: {
              name: { type: "string" },
              status: { type: "string", enum: ["Pending", "Active", "Completed"] },
              progress: { type: "number" },
              priority: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
            },
            description: "Fields to update",
          },
        },
        required: ["missionId", "updates"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_delete_mission",
      description: "Propose deleting a mission (requires user approval before execution)",
      parameters: {
        type: "object",
        properties: {
          missionId: {
            type: "number",
            description: "ID of the mission to delete",
          },
        },
        required: ["missionId"],
      },
    },
  },
];
