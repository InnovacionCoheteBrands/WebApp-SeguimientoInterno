import type { AgentToolContext } from "./agent-tools";
import {
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
    getLeads,
    getLeadsMetrics,
    directCreateLead,
    directUpdateLead,
    directDeleteLead,
    getProjects,
    directCreateProject,
    directUpdateProject,
    directDeleteProject,
    getTransactions,
    getFinancialSummary,
} from "./agent-tools";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolKind = "read" | "write";
export type RiskLevel = "low" | "medium" | "high";

export interface ToolPolicy {
    kind: ToolKind;
    riskLevel: RiskLevel;
    requiresApproval: boolean;
    allowedRoles: string[];
    auditAction: string;
    entityType: string;
}

export interface ToolSchema {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}

export interface RegisteredTool {
    schema: ToolSchema;
    policy: ToolPolicy;
    execute: (ctx: AgentToolContext, args: Record<string, any>) => Promise<any>;
    describeAction: (args: Record<string, any>) => string;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const registry = new Map<string, RegisteredTool>();

function register(tool: RegisteredTool): void {
    registry.set(tool.schema.function.name, tool);
}

export function getRegisteredTool(name: string): RegisteredTool | undefined {
    return registry.get(name);
}

export function getLlmToolSchemas(): ToolSchema[] {
    return Array.from(registry.values()).map((t) => t.schema);
}

export function getAllRegisteredTools(): Map<string, RegisteredTool> {
    return registry;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const readPolicy = (entityType: string): ToolPolicy => ({
    kind: "read",
    riskLevel: "low",
    requiresApproval: false,
    allowedRoles: [],
    auditAction: "QUERY",
    entityType,
});

const writePolicy = (
    riskLevel: RiskLevel,
    auditAction: string,
    entityType: string,
    requiresApproval = true,
    allowedRoles: string[] = [],
): ToolPolicy => ({
    kind: "write",
    riskLevel,
    requiresApproval,
    allowedRoles,
    auditAction,
    entityType,
});

// ---------------------------------------------------------------------------
// READ TOOLS
// ---------------------------------------------------------------------------

register({
    schema: {
        type: "function",
        function: {
            name: "get_campaigns",
            description: "Get all marketing campaigns with their status, progress, budget, and client info",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("CAMPAIGN"),
    execute: (ctx) => getCampaigns(ctx),
    describeAction: () => "Consultar campañas de marketing",
});

register({
    schema: {
        type: "function",
        function: {
            name: "get_analytics",
            description: "Get campaign analytics including performance metrics, ROI, and trends",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("ANALYTICS"),
    execute: (ctx) => getAnalytics(ctx),
    describeAction: () => "Consultar analíticas de campañas",
});

register({
    schema: {
        type: "function",
        function: {
            name: "get_team",
            description: "Get all team members with their roles, departments, and availability",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("TEAM"),
    execute: (ctx) => getTeam(ctx),
    describeAction: () => "Consultar miembros del equipo",
});

register({
    schema: {
        type: "function",
        function: {
            name: "get_client_status",
            description: "Get client account status including health scores, budgets, and milestones",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("CLIENT"),
    execute: (ctx) => getClientStatus(ctx),
    describeAction: () => "Consultar estado de clientes",
});

register({
    schema: {
        type: "function",
        function: {
            name: "get_resources",
            description: "Get marketing resources and deliverables status",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("RESOURCE"),
    execute: (ctx) => getResources(ctx),
    describeAction: () => "Consultar recursos de marketing",
});

register({
    schema: {
        type: "function",
        function: {
            name: "get_database_stats",
            description: "Get comprehensive database statistics including counts and statuses across all data",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("DATABASE"),
    execute: (ctx) => getDatabaseStats(ctx),
    describeAction: () => "Consultar estadísticas de la base de datos",
});

// ---------------------------------------------------------------------------
// WRITE TOOLS — Campaigns
// ---------------------------------------------------------------------------

register({
    schema: {
        type: "function",
        function: {
            name: "create_campaign",
            description: "Create a new marketing campaign in the system. Requires user approval.",
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
    policy: writePolicy("medium", "CREATE", "CAMPAIGN"),
    execute: (ctx, args) => directCreateCampaign(ctx, args as any),
    describeAction: (args) => `Crear campaña '${args.name || "sin nombre"}' para ${args.clientName || "cliente"}`,
});

register({
    schema: {
        type: "function",
        function: {
            name: "update_campaign",
            description: "Update an existing campaign. Requires user approval.",
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
    policy: writePolicy("medium", "UPDATE", "CAMPAIGN"),
    execute: (ctx, args) => directUpdateCampaign(ctx, args.campaignId, args.updates),
    describeAction: (args) => `Actualizar campaña #${args.campaignId}`,
});

register({
    schema: {
        type: "function",
        function: {
            name: "delete_campaign",
            description: "Delete a campaign. Requires user approval.",
            parameters: {
                type: "object",
                properties: {
                    campaignId: { type: "number", description: "ID of the campaign to delete" },
                },
                required: ["campaignId"],
            },
        },
    },
    policy: writePolicy("high", "DELETE", "CAMPAIGN"),
    execute: (ctx, args) => directDeleteCampaign(ctx, args.campaignId),
    describeAction: (args) => `Eliminar campaña #${args.campaignId}`,
});

// ---------------------------------------------------------------------------
// WRITE TOOLS — Clients
// ---------------------------------------------------------------------------

register({
    schema: {
        type: "function",
        function: {
            name: "create_client",
            description: "Create a new client account. Requires user approval.",
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
    policy: writePolicy("medium", "CREATE", "CLIENT"),
    execute: (ctx, args) => createClient(ctx, args as any),
    describeAction: (args) => `Crear cliente '${args.companyName || "sin nombre"}'`,
});

register({
    schema: {
        type: "function",
        function: {
            name: "update_client",
            description: "Update an existing client account. Requires user approval.",
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
    policy: writePolicy("medium", "UPDATE", "CLIENT"),
    execute: (ctx, args) => updateClient(ctx, args.clientId, args.updates),
    describeAction: (args) => `Actualizar cliente #${args.clientId}`,
});

register({
    schema: {
        type: "function",
        function: {
            name: "delete_client",
            description: "Delete an existing client account. Requires user approval.",
            parameters: {
                type: "object",
                properties: {
                    clientId: { type: "number" },
                },
                required: ["clientId"],
            },
        },
    },
    policy: writePolicy("high", "DELETE", "CLIENT"),
    execute: (ctx, args) => deleteClient(ctx, args.clientId),
    describeAction: (args) => `Eliminar cliente #${args.clientId}`,
});

// ---------------------------------------------------------------------------
// WRITE TOOLS — Team
// ---------------------------------------------------------------------------

register({
    schema: {
        type: "function",
        function: {
            name: "create_team_member",
            description: "Create a new team member/employee. Requires user approval.",
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
    policy: writePolicy("medium", "CREATE", "TEAM"),
    execute: (ctx, args) => createTeamMember(ctx, args as any),
    describeAction: (args) =>
        `Crear miembro de equipo '${[args.firstName, args.lastName].filter(Boolean).join(" ") || args.name || "sin nombre"}'`,
});

register({
    schema: {
        type: "function",
        function: {
            name: "update_team_member",
            description: "Update a team member. Requires user approval.",
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
    policy: writePolicy("medium", "UPDATE", "TEAM"),
    execute: (ctx, args) => updateTeamMember(ctx, args.teamId, args.updates),
    describeAction: (args) => `Actualizar miembro de equipo #${args.teamId}`,
});

register({
    schema: {
        type: "function",
        function: {
            name: "delete_team_member",
            description: "Delete a team member. Requires user approval.",
            parameters: {
                type: "object",
                properties: {
                    teamId: { type: "number" },
                },
                required: ["teamId"],
            },
        },
    },
    policy: writePolicy("high", "DELETE", "TEAM"),
    execute: (ctx, args) => deleteTeamMember(ctx, args.teamId),
    describeAction: (args) => `Eliminar miembro de equipo #${args.teamId}`,
});

// ---------------------------------------------------------------------------
// READ TOOLS — Leads
// ---------------------------------------------------------------------------

register({
    schema: {
        type: "function",
        function: {
            name: "get_leads",
            description: "Get all leads/prospects with their status, origin, estimated value, and assigned agent",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("LEAD"),
    execute: (ctx) => getLeads(ctx),
    describeAction: () => "Consultar leads/prospectos",
});

register({
    schema: {
        type: "function",
        function: {
            name: "get_leads_metrics",
            description: "Get leads funnel metrics: total, by origin, conversion rate, average value",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("LEAD"),
    execute: (ctx) => getLeadsMetrics(ctx),
    describeAction: () => "Consultar métricas del funnel de leads",
});

// ---------------------------------------------------------------------------
// WRITE TOOLS — Leads
// ---------------------------------------------------------------------------

register({
    schema: {
        type: "function",
        function: {
            name: "create_lead",
            description: "Create a new lead/prospect. Requires user approval.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Lead contact name" },
                    email: { type: "string", description: "Email address" },
                    phone: { type: "string", description: "Phone number" },
                    company: { type: "string", description: "Company name" },
                    origin: { type: "string", enum: ["Referido", "Sitio Web", "Redes Sociales", "Cold Call", "Evento", "Otro"], description: "Lead origin/source" },
                    status: { type: "string", enum: ["Nuevo", "Contactado", "Calificado", "Propuesta", "Negociación", "Ganado", "Perdido"], description: "Lead status" },
                    estimatedValue: { type: "string", description: "Estimated deal value" },
                    priority: { type: "string", enum: ["Baja", "Media", "Alta", "Urgente"], description: "Lead priority" },
                    notes: { type: "string", description: "Additional notes" },
                },
                required: ["name"],
            },
        },
    },
    policy: writePolicy("medium", "CREATE", "LEAD"),
    execute: (ctx, args) => directCreateLead(ctx, args as any),
    describeAction: (args) => `Crear lead '${args.name || "sin nombre"}'`,
});

register({
    schema: {
        type: "function",
        function: {
            name: "update_lead",
            description: "Update an existing lead. Requires user approval.",
            parameters: {
                type: "object",
                properties: {
                    leadId: { type: "number", description: "ID of the lead to update" },
                    updates: {
                        type: "object",
                        properties: {
                            status: { type: "string", enum: ["Nuevo", "Contactado", "Calificado", "Propuesta", "Negociación", "Ganado", "Perdido"] },
                            priority: { type: "string", enum: ["Baja", "Media", "Alta", "Urgente"] },
                            estimatedValue: { type: "string" },
                            notes: { type: "string" },
                        },
                    },
                },
                required: ["leadId", "updates"],
            },
        },
    },
    policy: writePolicy("medium", "UPDATE", "LEAD"),
    execute: (ctx, args) => directUpdateLead(ctx, args.leadId, args.updates),
    describeAction: (args) => `Actualizar lead #${args.leadId}`,
});

register({
    schema: {
        type: "function",
        function: {
            name: "delete_lead",
            description: "Delete a lead. Requires user approval.",
            parameters: {
                type: "object",
                properties: {
                    leadId: { type: "number", description: "ID of the lead to delete" },
                },
                required: ["leadId"],
            },
        },
    },
    policy: writePolicy("high", "DELETE", "LEAD"),
    execute: (ctx, args) => directDeleteLead(ctx, args.leadId),
    describeAction: (args) => `Eliminar lead #${args.leadId}`,
});

// ---------------------------------------------------------------------------
// READ TOOLS — Projects
// ---------------------------------------------------------------------------

register({
    schema: {
        type: "function",
        function: {
            name: "get_projects",
            description: "Get all projects with their status, client, progress, and health indicator",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("PROJECT"),
    execute: (ctx) => getProjects(ctx),
    describeAction: () => "Consultar proyectos",
});

// ---------------------------------------------------------------------------
// WRITE TOOLS — Projects
// ---------------------------------------------------------------------------

register({
    schema: {
        type: "function",
        function: {
            name: "create_project",
            description: "Create a new project. Requires user approval.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Project name" },
                    clientId: { type: "number", description: "ID of the client for this project" },
                    serviceType: { type: "string", description: "Service type (e.g., Diseño Web, Social Media, Branding)" },
                    status: { type: "string", description: "Project status (e.g., Planning, Active, Completed)" },
                    health: { type: "string", enum: ["green", "yellow", "red"], description: "Project health indicator" },
                    budget: { type: "string", description: "Project budget" },
                    description: { type: "string", description: "Project description" },
                },
                required: ["name", "clientId", "serviceType"],
            },
        },
    },
    policy: writePolicy("medium", "CREATE", "PROJECT"),
    execute: (ctx, args) => directCreateProject(ctx, args as any),
    describeAction: (args) => `Crear proyecto '${args.name || "sin nombre"}'`,
});

register({
    schema: {
        type: "function",
        function: {
            name: "update_project",
            description: "Update an existing project. Requires user approval.",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "number", description: "ID of the project to update" },
                    updates: {
                        type: "object",
                        properties: {
                            status: { type: "string" },
                            health: { type: "string", enum: ["green", "yellow", "red"] },
                            progress: { type: "number" },
                            budget: { type: "string" },
                        },
                    },
                },
                required: ["projectId", "updates"],
            },
        },
    },
    policy: writePolicy("medium", "UPDATE", "PROJECT"),
    execute: (ctx, args) => directUpdateProject(ctx, args.projectId, args.updates),
    describeAction: (args) => `Actualizar proyecto #${args.projectId}`,
});

register({
    schema: {
        type: "function",
        function: {
            name: "delete_project",
            description: "Delete a project. Requires user approval.",
            parameters: {
                type: "object",
                properties: {
                    projectId: { type: "number", description: "ID of the project to delete" },
                },
                required: ["projectId"],
            },
        },
    },
    policy: writePolicy("high", "DELETE", "PROJECT"),
    execute: (ctx, args) => directDeleteProject(ctx, args.projectId),
    describeAction: (args) => `Eliminar proyecto #${args.projectId}`,
});

// ---------------------------------------------------------------------------
// READ TOOLS — Financial
// ---------------------------------------------------------------------------

register({
    schema: {
        type: "function",
        function: {
            name: "get_transactions",
            description: "Get all financial transactions (income and expenses)",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("TRANSACTION"),
    execute: (ctx) => getTransactions(ctx),
    describeAction: () => "Consultar transacciones financieras",
});

register({
    schema: {
        type: "function",
        function: {
            name: "get_financial_summary",
            description: "Get financial summary: total income, total expenses, net profit, transaction counts",
            parameters: { type: "object", properties: {} },
        },
    },
    policy: readPolicy("FINANCE"),
    execute: (ctx) => getFinancialSummary(ctx),
    describeAction: () => "Consultar resumen financiero",
});

// ---------------------------------------------------------------------------
// Authorization & Validation helpers
// ---------------------------------------------------------------------------

export interface AuthorizationResult {
    allowed: boolean;
    reason?: string;
    code?: string;
}

export function authorizeAgentAction(
    user: { id: string; username: string; role: string } | undefined,
    tool: RegisteredTool,
): AuthorizationResult {
    if (!user) {
        return { allowed: false, reason: "Se requiere autenticación.", code: "AUTH_REQUIRED" };
    }

    const { policy } = tool;

    if (policy.allowedRoles.length > 0 && !policy.allowedRoles.includes(user.role)) {
        return {
            allowed: false,
            reason: `El rol '${user.role}' no tiene permiso para ejecutar '${tool.schema.function.name}'.`,
            code: "ROLE_DENIED",
        };
    }

    return { allowed: true };
}

export function safeParseToolArgs(raw: string): { ok: true; args: Record<string, any> } | { ok: false; error: string } {
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            return { ok: false, error: "Tool arguments must be a JSON object." };
        }
        return { ok: true, args: parsed };
    } catch {
        return { ok: false, error: "Invalid JSON in tool arguments." };
    }
}

export function validateRequiredFields(
    toolName: string,
    args: Record<string, any>,
): AuthorizationResult {
    const tool = getRegisteredTool(toolName);
    if (!tool) return { allowed: false, reason: "Tool not found.", code: "TOOL_NOT_FOUND" };

    const params = tool.schema.function.parameters as Record<string, any>;
    const required: string[] = params.required || [];

    for (const field of required) {
        if (args[field] === undefined || args[field] === null || args[field] === "") {
            return {
                allowed: false,
                reason: `Campo requerido '${field}' no fue proporcionado para '${toolName}'.`,
                code: "MISSING_REQUIRED_FIELD",
            };
        }
    }

    return { allowed: true };
}
