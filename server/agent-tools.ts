import type { IStorage } from "./storage";
import type { InsertCampaign, InsertClientAccount, InsertTeam } from "@shared/schema";

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

  return {
    success: true,
    data: clientAccounts,
    message: `Retrieved ${clientAccounts.length} client accounts`,
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

// ==========================================
// DIRECT EXECUTION MUTATORS
// ==========================================

// --- Campaigns ---
export async function directCreateCampaign(ctx: AgentToolContext, campaignData: InsertCampaign) {
  const newCampaign = await ctx.storage.createCampaign(campaignData);
  return {
    success: true,
    data: newCampaign,
    message: `Campaign "${campaignData.name}" created successfully with ID ${newCampaign.id}.`,
  };
}

export async function directUpdateCampaign(ctx: AgentToolContext, campaignId: number, updates: Partial<InsertCampaign>) {
  const updatedCampaign = await ctx.storage.updateCampaign(campaignId, updates);
  if (!updatedCampaign) throw new Error(`Campaign ID ${campaignId} not found.`);
  return {
    success: true,
    data: updatedCampaign,
    message: `Campaign #${campaignId} updated successfully.`,
  };
}

export async function directDeleteCampaign(ctx: AgentToolContext, campaignId: number) {
  const success = await ctx.storage.deleteCampaign(campaignId);
  if (!success) throw new Error(`Campaign ID ${campaignId} not found or could not be deleted.`);
  return {
    success: true,
    message: `Campaign #${campaignId} deleted successfully.`,
  };
}

// --- Clients ---
export async function createClient(ctx: AgentToolContext, clientData: InsertClientAccount) {
  const newClient = await ctx.storage.createClientAccount(clientData);
  return {
    success: true,
    data: newClient,
    message: `Client "${clientData.companyName}" created successfully with ID ${newClient.id}.`,
  };
}

export async function updateClient(ctx: AgentToolContext, clientId: number, updates: Partial<InsertClientAccount>) {
  const updatedClient = await ctx.storage.updateClientAccount(clientId, updates);
  if (!updatedClient) throw new Error(`Client ID ${clientId} not found.`);
  return {
    success: true,
    data: updatedClient,
    message: `Client #${clientId} updated successfully.`,
  };
}

export async function deleteClient(ctx: AgentToolContext, clientId: number) {
  const success = await ctx.storage.deleteClientAccount(clientId);
  if (!success) throw new Error(`Client ID ${clientId} not found or could not be deleted.`);
  return {
    success: true,
    message: `Client #${clientId} deleted successfully.`,
  };
}

// --- Team ---
export async function createTeamMember(ctx: AgentToolContext, teamData: InsertTeam) {
  const newMember = await ctx.storage.createTeam(teamData);
  return {
    success: true,
    data: newMember,
    message: `Team member "${teamData.name}" created successfully with ID ${newMember.id}.`,
  };
}

export async function updateTeamMember(ctx: AgentToolContext, teamId: number, updates: Partial<InsertTeam>) {
  const updatedMember = await ctx.storage.updateTeam(teamId, updates);
  if (!updatedMember) throw new Error(`Team member ID ${teamId} not found.`);
  return {
    success: true,
    data: updatedMember,
    message: `Team member #${teamId} updated successfully.`,
  };
}

export async function deleteTeamMember(ctx: AgentToolContext, teamId: number) {
  const success = await ctx.storage.deleteTeam(teamId);
  if (!success) throw new Error(`Team member ID ${teamId} not found or could not be deleted.`);
  return {
    success: true,
    message: `Team member #${teamId} deleted successfully.`,
  };
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
      name: "create_campaign",
      description: "Directly create a new marketing campaign in the system.",
      parameters: {
        type: "object",
        properties: {
          campaignCode: { type: "string", description: "Unique campaign code (e.g., CAMP-001)" },
          name: { type: "string", description: "Campaign name" },
          clientName: { type: "string", description: "Client company name" },
          channel: { type: "string", description: "Marketing channel (e.g., Meta, Google Ads, LinkedIn)" },
          priority: { type: "string", enum: ["Low", "Medium", "High", "Critical"], description: "Campaign priority level" },
          status: { type: "string", enum: ["Planning", "Active", "In Progress", "Paused", "Completed"], description: "Initial campaign status" },
          budget: { type: "number", description: "Total campaign budget" },
          progress: { type: "number", description: "Initial progress percentage (0-100)" },
        },
        required: ["campaignCode", "name", "clientName", "channel", "priority", "budget"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_campaign",
      description: "Directly update an existing campaign.",
      parameters: {
        type: "object",
        properties: {
          campaignId: { type: "number", description: "ID of the campaign to update" },
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
      name: "delete_campaign",
      description: "Directly delete a campaign.",
      parameters: {
        type: "object",
        properties: {
          campaignId: { type: "number", description: "ID of the campaign to delete" },
        },
        required: ["campaignId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_client",
      description: "Create a new client account.",
      parameters: {
        type: "object",
        properties: {
          companyName: { type: "string" },
          industry: { type: "string" },
          monthlyBudget: { type: "number" },
        },
        required: ["companyName", "industry", "monthlyBudget"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_client",
      description: "Update an existing client account.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "number" },
          updates: {
            type: "object",
            properties: {
              companyName: { type: "string" },
              industry: { type: "string" },
              monthlyBudget: { type: "number" },
              healthScore: { type: "number" },
              status: { type: "string" },
            },
          },
        },
        required: ["clientId", "updates"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_client",
      description: "Delete an existing client account.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "number" },
        },
        required: ["clientId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_team_member",
      description: "Create a new team member/employee.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name (legacy)" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          role: { type: "string", description: "Job title" },
          department: { type: "string" },
        },
        required: ["firstName", "lastName", "email", "role"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_team_member",
      description: "Update a team member.",
      parameters: {
        type: "object",
        properties: {
          teamId: { type: "number" },
          updates: {
            type: "object",
            properties: {
              status: { type: "string", description: "e.g. Available, Busy" },
              role: { type: "string" },
            },
          },
        },
        required: ["teamId", "updates"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_team_member",
      description: "Delete a team member.",
      parameters: {
        type: "object",
        properties: {
          teamId: { type: "number" },
        },
        required: ["teamId"],
      },
    },
  },
];
