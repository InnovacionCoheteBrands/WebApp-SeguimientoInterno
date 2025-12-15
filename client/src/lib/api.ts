import type {
  Campaign,
  InsertCampaign,
  UpdateCampaign,
  SystemMetric,
  TelemetryData,
  ClientAccount as DBClientAccount,
  InsertClientAccount,
  Team,
  InsertTeam,
  UpdateTeam,
  TeamAssignment,
  InsertTeamAssignment,
  Resource,
  InsertResource,
  Transaction,
  InsertTransaction,
  UpdateTransaction,
  RecurringTransaction,
  InsertRecurringTransaction,
  UpdateRecurringTransaction,
  Project as DBProject,
  InsertProject,
  UpdateProject,
  ProjectDeliverable,
  InsertProjectDeliverable,
  UpdateProjectDeliverable,
  ProjectAttachment,
  InsertProjectAttachment,
  AgencyRole,
  InsertAgencyRole,
  UpdateAgencyRole
} from "@shared/schema";

export type ClientAccount = Omit<DBClientAccount, 'lastContact' | 'timestamp'> & {
  lastContact: string;
  timestamp: string;
};

export type Project = DBProject & {
  client: ClientAccount;
  deliverables?: ProjectDeliverable[];
};

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await fetch("/api/campaigns");
  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json();
}

export async function fetchCampaignById(id: number): Promise<Campaign> {
  const res = await fetch(`/api/campaigns/${id}`);
  if (!res.ok) throw new Error("Failed to fetch campaign");
  return res.json();
}

export async function createCampaign(campaign: InsertCampaign): Promise<Campaign> {
  const res = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campaign),
  });
  if (!res.ok) throw new Error("Failed to create campaign");
  return res.json();
}

export async function updateCampaign(id: number, campaign: UpdateCampaign): Promise<Campaign> {
  const res = await fetch(`/api/campaigns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campaign),
  });
  if (!res.ok) throw new Error("Failed to update campaign");
  return res.json();
}

export async function deleteCampaign(id: number): Promise<void> {
  const res = await fetch(`/api/campaigns/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete campaign");
}

export async function fetchSystemMetrics(): Promise<SystemMetric[]> {
  const res = await fetch("/api/metrics");
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export async function fetchTelemetryData(limit?: number): Promise<TelemetryData[]> {
  const url = limit ? `/api/telemetry?limit=${limit}` : "/api/telemetry";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch telemetry");
  return res.json();
}

export async function fetchClientAccounts(): Promise<ClientAccount[]> {
  const res = await fetch("/api/clients");
  if (!res.ok) throw new Error("Failed to fetch client accounts");
  return res.json();
}

export async function createClientAccount(account: InsertClientAccount): Promise<ClientAccount> {
  const res = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });
  if (!res.ok) throw new Error("Failed to create client account");
  return res.json();
}

export async function updateClientAccount(campaignId: number, account: Partial<InsertClientAccount>): Promise<ClientAccount> {
  const res = await fetch(`/api/clients/${campaignId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });
  if (!res.ok) throw new Error("Failed to update client account");
  return res.json();
}

export async function deleteClientAccount(campaignId: number): Promise<void> {
  const res = await fetch(`/api/clients/${campaignId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete client account");
}

export async function fetchTeam(): Promise<Team[]> {
  const res = await fetch("/api/team");
  if (!res.ok) throw new Error("Failed to fetch team");
  return res.json();
}

export async function createTeam(person: InsertTeam): Promise<Team> {
  const res = await fetch("/api/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(person),
  });
  if (!res.ok) throw new Error("Failed to create team member");
  return res.json();
}

export async function updateTeam(id: number, person: UpdateTeam): Promise<Team> {
  const res = await fetch(`/api/team/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(person),
  });
  if (!res.ok) throw new Error("Failed to update team member");
  return res.json();
}

export async function deleteTeam(id: number): Promise<void> {
  const res = await fetch(`/api/team/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete team member");
}

export async function fetchTeamAssignments(): Promise<TeamAssignment[]> {
  const res = await fetch("/api/team/assignments");
  if (!res.ok) throw new Error("Failed to fetch assignments");
  return res.json();
}

export async function createTeamAssignment(assignment: InsertTeamAssignment): Promise<TeamAssignment> {
  const res = await fetch("/api/team/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assignment),
  });
  if (!res.ok) throw new Error("Failed to create assignment");
  return res.json();
}

export async function deleteTeamAssignment(id: number): Promise<void> {
  const res = await fetch(`/api/team/assignments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete assignment");
}

export async function fetchResources(): Promise<Resource[]> {
  const res = await fetch("/api/resources");
  if (!res.ok) throw new Error("Failed to fetch resources");
  return res.json();
}

export async function createResource(resource: InsertResource): Promise<Resource> {
  const res = await fetch("/api/resources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resource),
  });
  if (!res.ok) throw new Error("Failed to create resource entry");
  return res.json();
}

export async function updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource> {
  const res = await fetch(`/api/resources/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resource),
  });
  if (!res.ok) throw new Error("Failed to update resource entry");
  return res.json();
}

export async function deleteResource(id: number): Promise<void> {
  const res = await fetch(`/api/resources/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete resource entry");
}

export interface Analytics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  averageProgress: number;
  priorityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  channelBreakdown: {
    meta: number;
    googleAds: number;
    linkedin: number;
    email: number;
    other: number;
  };
  recentActivity: TelemetryData[];
}

export async function fetchAnalytics(): Promise<Analytics> {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

// =========================
// System Settings (Settings)
// =========================
export async function fetchSystemSettings(): Promise<unknown> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProposedAction {
  requiresApproval: true;
  actionType: string;
  actionData: any;
  description: string;
  handled?: boolean;
}

export interface AgentResponse {
  role: "assistant";
  content: string;
  proposedActions?: ProposedAction[];
  executedAction?: boolean;
}

export async function sendAgentMessage(messages: ChatMessage[]): Promise<AgentResponse> {
  const res = await fetch("/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.details || "Failed to send message to agent");
  }
  return res.json();
}

export async function executeAgentAction(actionType: string, actionData: any): Promise<AgentResponse> {
  const res = await fetch("/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [],
      executeAction: { actionType, actionData }
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.details || "Failed to execute action");
  }
  return res.json();
}

// Financial Hub - Transactions
export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions");
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function createTransaction(transaction: InsertTransaction): Promise<Transaction> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let errorMessage = errorData.message || errorData.error || "Failed to create transaction";
    if (Array.isArray(errorMessage)) {
      errorMessage = errorMessage.map((e: any) => e.message || JSON.stringify(e)).join(", ");
    } else if (typeof errorMessage === 'object') {
      errorMessage = JSON.stringify(errorMessage);
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function updateTransaction(id: number, transaction: UpdateTransaction): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let errorMessage = errorData.message || errorData.error || "Failed to update transaction";
    if (Array.isArray(errorMessage)) {
      errorMessage = errorMessage.map((e: any) => e.message || JSON.stringify(e)).join(", ");
    } else if (typeof errorMessage === 'object') {
      errorMessage = JSON.stringify(errorMessage);
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function deleteTransaction(id: number): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete transaction");
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  cashFlow: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  monthlyData: Array<{ month: string; income: number; expenses: number }>;
}

export async function fetchFinancialSummary(
  startDate?: Date,
  endDate?: Date
): Promise<FinancialSummary> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate.toISOString());
  if (endDate) params.append("endDate", endDate.toISOString());

  const url = params.toString() ? `/api/finance/summary?${params}` : "/api/finance/summary";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch financial summary");
  return res.json();
}

// Monthly Obligations
export async function fetchMonthlyPayables(year?: number, month?: number): Promise<RecurringTransaction[]> {
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month || now.getMonth() + 1;

  const res = await fetch(`/api/finance/obligations/payables?year=${y}&month=${m}`);
  if (!res.ok) throw new Error("Failed to fetch monthly payables");
  return res.json();
}

export async function fetchMonthlyReceivables(year?: number, month?: number): Promise<RecurringTransaction[]> {
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month || now.getMonth() + 1;

  const res = await fetch(`/api/finance/obligations/receivables?year=${y}&month=${m}`);
  if (!res.ok) throw new Error("Failed to fetch monthly receivables");
  return res.json();
}

export async function markObligationAsPaid(templateId: number, paidDate?: Date): Promise<Transaction> {
  const res = await fetch(`/api/finance/obligations/${templateId}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paidDate: paidDate?.toISOString() || new Date().toISOString()
    }),
  });
  if (!res.ok) throw new Error("Failed to mark obligation as paid");
  return res.json();
}

export async function unpayObligation(templateId: number): Promise<RecurringTransaction> {
  const res = await fetch(`/api/finance/obligations/${templateId}/unpay`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to revert payment status");
  return res.json();
}


// Recurring Transactions
export async function fetchRecurringTransactions(): Promise<RecurringTransaction[]> {
  const res = await fetch("/api/recurring-transactions");
  if (!res.ok) throw new Error("Failed to fetch recurring transactions");
  return res.json();
}

export async function createRecurringTransaction(recurring: InsertRecurringTransaction): Promise<RecurringTransaction> {
  const res = await fetch("/api/recurring-transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recurring),
  });
  if (!res.ok) throw new Error("Failed to create recurring transaction");
  return res.json();
}

export async function updateRecurringTransaction(
  id: number,
  recurring: UpdateRecurringTransaction
): Promise<RecurringTransaction> {
  const res = await fetch(`/api/recurring-transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recurring),
  });
  if (!res.ok) throw new Error("Failed to update recurring transaction");
  return res.json();
}

export async function deleteRecurringTransaction(id: number): Promise<void> {
  const res = await fetch(`/api/recurring-transactions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete recurring transaction");
}

export async function executeRecurringTransaction(id: number): Promise<Transaction> {
  const res = await fetch(`/api/recurring-transactions/${id}/execute`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to execute recurring transaction");
  return res.json();
}

export async function executePendingRecurringTransactions(): Promise<{ count: number; transactions: Transaction[] }> {
  const res = await fetch("/api/recurring-transactions/execute-pending", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to execute pending recurring transactions");
  return res.json();
}

// Projects Management
export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function fetchProjectById(id: number): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

export async function createProject(project: InsertProject): Promise<DBProject> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function updateProject(id: number, project: UpdateProject): Promise<DBProject> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete project");
}

// Project Deliverables
export async function fetchProjectDeliverables(projectId: number): Promise<ProjectDeliverable[]> {
  const res = await fetch(`/api/projects/${projectId}/deliverables`);
  if (!res.ok) throw new Error("Failed to fetch deliverables");
  return res.json();
}

export async function createProjectDeliverable(
  projectId: number,
  deliverable: Omit<InsertProjectDeliverable, 'projectId'>
): Promise<ProjectDeliverable> {
  const res = await fetch(`/api/projects/${projectId}/deliverables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deliverable),
  });
  if (!res.ok) throw new Error("Failed to create deliverable");
  return res.json();
}

export async function updateProjectDeliverable(
  id: number,
  deliverable: UpdateProjectDeliverable
): Promise<ProjectDeliverable> {
  const res = await fetch(`/api/deliverables/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deliverable),
  });
  if (!res.ok) throw new Error("Failed to update deliverable");
  return res.json();
}

export async function deleteProjectDeliverable(id: number): Promise<void> {
  const res = await fetch(`/api/deliverables/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete deliverable");
}

// Project Attachments
export async function fetchProjectAttachments(projectId: number): Promise<ProjectAttachment[]> {
  const res = await fetch(`/api/projects/${projectId}/attachments`);
  if (!res.ok) throw new Error("Failed to fetch attachments");
  return res.json();
}

export async function createProjectAttachment(
  projectId: number,
  attachment: Omit<InsertProjectAttachment, 'projectId'>
): Promise<ProjectAttachment> {
  const res = await fetch(`/api/projects/${projectId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(attachment),
  });
  if (!res.ok) throw new Error("Failed to create attachment");
  return res.json();
}

export async function deleteProjectAttachment(id: number): Promise<void> {
  const res = await fetch(`/api/attachments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete attachment");
}

// Agency Role Catalog
export async function fetchAgencyRoles(): Promise<AgencyRole[]> {
  const res = await fetch("/api/agency/roles");
  if (!res.ok) throw new Error("Failed to fetch agency roles");
  return res.json();
}

export async function createAgencyRole(role: InsertAgencyRole): Promise<AgencyRole> {
  const res = await fetch("/api/agency/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(role),
  });
  if (!res.ok) throw new Error("Failed to create agency role");
  return res.json();
}

export async function updateAgencyRole(id: number, role: UpdateAgencyRole): Promise<AgencyRole> {
  const res = await fetch(`/api/agency/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(role),
  });
  if (!res.ok) throw new Error("Failed to update agency role");
  return res.json();
}

export async function deleteAgencyRole(id: number): Promise<void> {
  const res = await fetch(`/api/agency/roles/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete agency role");
}
