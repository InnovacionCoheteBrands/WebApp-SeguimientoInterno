import type { IStorage } from "./storage";
import type { InsertCampaign } from "@shared/schema";

export interface AgentToolContext {
  storage: IStorage;
}

export async function getCampaigns(ctx: AgentToolContext) {
  const campaigns = await ctx.storage.getCampaigns();
  return {
    success: true,
    data: campaigns,
    message: `Found ${campaigns.length} campaigns in the system`,
  };
}

export async function getAnalytics(ctx: AgentToolContext) {
  const campaigns = await ctx.storage.getCampaigns();
  const telemetry = await ctx.storage.getTelemetryData(100);

  const analytics = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === "Active" || c.status === "In Progress").length,
    completedCampaigns: campaigns.filter(c => c.status === "Completed").length,
    averageProgress: campaigns.length > 0
      ? Math.round(campaigns.reduce((sum, c) => sum + c.progress, 0) / campaigns.length)
      : 0,
    successRate: campaigns.length > 0
      ? Math.round((campaigns.filter(c => c.status === "Completed").length / campaigns.length) * 100)
      : 0,
    priorityBreakdown: {
      critical: campaigns.filter(c => c.priority === "Critical").length,
      high: campaigns.filter(c => c.priority === "High").length,
      medium: campaigns.filter(c => c.priority === "Medium").length,
      low: campaigns.filter(c => c.priority === "Low").length,
    },
    recentActivity: telemetry.slice(0, 20).reverse(),
  };

  return {
    success: true,
    data: analytics,
    message: "Retrieved analytics data successfully",
  };
}

export async function getTeam(ctx: AgentToolContext) {
  const team = await ctx.storage.getTeam();
  return {
    success: true,
    data: team,
    message: `Found ${team.length} team members in the system`,
  };
}

export async function getClientStatus(ctx: AgentToolContext) {
  const clientAccounts = await ctx.storage.getClientAccounts();
  const campaigns = await ctx.storage.getCampaigns();

  const clientData = campaigns.map((campaign) => {
    const account = clientAccounts.find((a) => a.campaignId === campaign.id);
    return {
      campaign,
      account,
    };
  });

  return {
    success: true,
    data: clientData,
    message: `Retrieved status for ${clientData.length} client accounts`,
  };
}

export async function getResources(ctx: AgentToolContext) {
  const resources = await ctx.storage.getResources();
  return {
    success: true,
    data: resources,
    message: `Retrieved ${resources.length} resources`,
  };
}

export async function getDatabaseStats(ctx: AgentToolContext) {
  const campaigns = await ctx.storage.getCampaigns();
  const team = await ctx.storage.getTeam();
  const clientAccounts = await ctx.storage.getClientAccounts();
  const resources = await ctx.storage.getResources();

  const stats = {
    campaigns: {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === "Active" || c.status === "In Progress").length,
      planning: campaigns.filter(c => c.status === "Planning").length,
      completed: campaigns.filter(c => c.status === "Completed").length,
    },
    team: {
      total: team.length,
      available: team.filter(t => t.status === "Available").length,
      busy: team.filter(t => t.status === "Busy").length,
    },
    clients: {
      tracked: clientAccounts.length,
    },
    resources: {
      total: resources.length,
      operational: resources.filter(r => r.status === "Operational").length,
    }
  };

  return {
    success: true,
    data: stats,
    message: "Retrieved comprehensive database statistics",
  };
}

type CreateCampaignAction = {
  actionType: "create_campaign";
  actionData: InsertCampaign;
};

type UpdateCampaignAction = {
  actionType: "update_campaign";
  actionData: { campaignId: number; updates: Partial<InsertCampaign> };
};

type DeleteCampaignAction = {
  actionType: "delete_campaign";
  actionData: { campaignId: number };
};

type AgentAction = CreateCampaignAction | UpdateCampaignAction | DeleteCampaignAction;

export type ActionProposal = AgentAction & {
  requiresApproval: true;
  description: string;
};

export function proposeCreateCampaign(campaignData: InsertCampaign): ActionProposal {
  return {
    requiresApproval: true,
    actionType: "create_campaign",
    actionData: campaignData,
    description: `Create new campaign: ${campaignData.name} for ${campaignData.clientName} on ${campaignData.channel} with priority ${campaignData.priority}`,
  };
}

export function proposeUpdateCampaign(campaignId: number, updates: Partial<InsertCampaign>): ActionProposal {
  const updateFields = Object.keys(updates).join(", ");
  return {
    requiresApproval: true,
    actionType: "update_campaign",
    actionData: { campaignId, updates },
    description: `Update campaign #${campaignId}: ${updateFields}`,
  };
}

export function proposeDeleteCampaign(campaignId: number): ActionProposal {
  return {
    requiresApproval: true,
    actionType: "delete_campaign",
    actionData: { campaignId },
    description: `Delete campaign #${campaignId}`,
  };
}

export async function executeApprovedAction(
  ctx: AgentToolContext,
  actionType: string,
  actionData: unknown
) {
  switch (actionType) {
    case "create_campaign":
      const createData = actionData as InsertCampaign;
      const newCampaign = await ctx.storage.createCampaign(createData);
      return {
        success: true,
        data: newCampaign,
        message: `Campaign "${createData.name}" created successfully`,
      };

    case "update_campaign":
      const updateData = actionData as { campaignId: number; updates: Partial<InsertCampaign> };
      const updatedCampaign = await ctx.storage.updateCampaign(
        updateData.campaignId,
        updateData.updates
      );
      return {
        success: true,
        data: updatedCampaign,
        message: `Campaign #${updateData.campaignId} updated successfully`,
      };

    case "delete_campaign":
      const deleteData = actionData as { campaignId: number };
      await ctx.storage.deleteCampaign(deleteData.campaignId);
      return {
        success: true,
        data: { id: deleteData.campaignId },
        message: `Campaign #${deleteData.campaignId} deleted successfully`,
      };

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

export const agentTools = [
  {
    type: "function" as const,
    function: {
      name: "get_campaigns",
      description: "Get all marketing campaigns with their status, progress, budget, and client info",
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
      description: "Get campaign analytics including performance metrics, ROI, and trends",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_team",
      description: "Get all team members with their roles, departments, and availability",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_client_status",
      description: "Get client account status including health scores, budgets, and milestones",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_resources",
      description: "Get marketing resources and deliverables status",
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
      description: "Get comprehensive database statistics including counts and statuses across all data",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_create_campaign",
      description: "Propose creating a new marketing campaign (requires user approval before execution)",
      parameters: {
        type: "object",
        properties: {
          campaignCode: {
            type: "string",
            description: "Unique campaign code (e.g., CAMP-001)",
          },
          name: {
            type: "string",
            description: "Campaign name",
          },
          clientName: {
            type: "string",
            description: "Client company name",
          },
          channel: {
            type: "string",
            description: "Marketing channel (e.g., Meta, Google Ads, LinkedIn)",
          },
          priority: {
            type: "string",
            enum: ["Low", "Medium", "High", "Critical"],
            description: "Campaign priority level",
          },
          status: {
            type: "string",
            enum: ["Planning", "Active", "In Progress", "Paused", "Completed"],
            description: "Initial campaign status",
          },
          budget: {
            type: "number",
            description: "Total campaign budget",
          },
          progress: {
            type: "number",
            description: "Initial progress percentage (0-100)",
          },
        },
        required: ["campaignCode", "name", "clientName", "channel", "priority", "budget"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_update_campaign",
      description: "Propose updating an existing campaign (requires user approval before execution)",
      parameters: {
        type: "object",
        properties: {
          campaignId: {
            type: "number",
            description: "ID of the campaign to update",
          },
          updates: {
            type: "object",
            properties: {
              name: { type: "string" },
              status: { type: "string", enum: ["Planning", "Active", "In Progress", "Paused", "Completed"] },
              progress: { type: "number" },
              priority: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
              budget: { type: "number" },
              spend: { type: "number" },
            },
            description: "Fields to update",
          },
        },
        required: ["campaignId", "updates"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_delete_campaign",
      description: "Propose deleting a campaign (requires user approval before execution)",
      parameters: {
        type: "object",
        properties: {
          campaignId: {
            type: "number",
            description: "ID of the campaign to delete",
          },
        },
        required: ["campaignId"],
      },
    },
  },
];
