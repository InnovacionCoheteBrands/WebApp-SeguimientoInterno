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

// ... imports ...

export type Project = DBProject & {
  client: ClientAccount;
  deliverables?: ProjectDeliverable[];
};

// 🔒 Security Wrapper: Auto-injects JWT token
async function request(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure credentials are included if not explicitly disabled
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials || "include",
  };

  const res = await fetch(url, fetchOptions);

  // 🚨 Intercept 401 Unauthorized globally
  // Skip dispatching on auth pages to prevent logout cascade during OAuth callback flow
  if (res.status === 401) {
    const isAuthPage = window.location.pathname.startsWith('/auth');
    if (!isAuthPage) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { status: 401 } }));
    }
  }

  return res;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  // ...
  const res = await request("/api/campaigns");
  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json();
}

export async function fetchCampaignById(id: number): Promise<Campaign> {
  const res = await request(`/api/campaigns/${id}`);
  if (!res.ok) throw new Error("Failed to fetch campaign");
  return res.json();
}

export async function createCampaign(campaign: InsertCampaign): Promise<Campaign> {
  const res = await request("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campaign),
  });
  if (!res.ok) throw new Error("Failed to create campaign");
  return res.json();
}

export async function updateCampaign(id: number, campaign: UpdateCampaign): Promise<Campaign> {
  const res = await request(`/api/campaigns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campaign),
  });
  if (!res.ok) throw new Error("Failed to update campaign");
  return res.json();
}

export async function deleteCampaign(id: number): Promise<void> {
  const res = await request(`/api/campaigns/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete campaign");
}

export async function fetchSystemMetrics(): Promise<SystemMetric[]> {
  const res = await request("/api/metrics");
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export async function fetchTelemetryData(limit?: number): Promise<TelemetryData[]> {
  const url = limit ? `/api/telemetry?limit=${limit}` : "/api/telemetry";
  const res = await request(url);
  if (!res.ok) throw new Error("Failed to fetch telemetry");
  return res.json();
}

export async function fetchClientAccounts(): Promise<ClientAccount[]> {
  const res = await request("/api/clients");
  if (!res.ok) {
    throw new Error("Failed to fetch client accounts");
  }
  return res.json();
}

export async function createClientAccount(account: InsertClientAccount): Promise<ClientAccount> {
  const res = await request("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.message || "Failed to create client account";
    throw new Error(Array.isArray(errorMessage) ? JSON.stringify(errorMessage) : errorMessage);
  }
  return res.json();
}

export async function updateClientAccount(id: number, account: Partial<InsertClientAccount>): Promise<ClientAccount> {
  const res = await request(`/api/clients/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.message || "Failed to update client account";
    throw new Error(Array.isArray(errorMessage) ? JSON.stringify(errorMessage) : errorMessage);
  }
  return res.json();
}

export async function deleteClientAccount(id: number): Promise<void> {
  const res = await request(`/api/clients/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.message || "Failed to delete client account";
    throw new Error(Array.isArray(errorMessage) ? JSON.stringify(errorMessage) : errorMessage);
  }
}

export async function fetchTeam(): Promise<Team[]> {
  const res = await request("/api/team");
  if (!res.ok) throw new Error("Failed to fetch team");
  return res.json();
}

export async function createTeam(person: InsertTeam): Promise<Team> {
  const res = await request("/api/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(person),
  });
  if (!res.ok) throw new Error("Failed to create team member");
  return res.json();
}

export async function updateTeam(id: number, person: UpdateTeam): Promise<Team> {
  const res = await request(`/api/team/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(person),
  });
  if (!res.ok) throw new Error("Failed to update team member");
  return res.json();
}

export async function deleteTeam(id: number): Promise<void> {
  const res = await request(`/api/team/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete team member");
}

export async function fetchTeamAssignments(): Promise<TeamAssignment[]> {
  const res = await request("/api/team/assignments");
  if (!res.ok) throw new Error("Failed to fetch assignments");
  return res.json();
}

export async function createTeamAssignment(assignment: InsertTeamAssignment): Promise<TeamAssignment> {
  const res = await request("/api/team/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assignment),
  });
  if (!res.ok) throw new Error("Failed to create assignment");
  return res.json();
}

export async function deleteTeamAssignment(id: number): Promise<void> {
  const res = await request(`/api/team/assignments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete assignment");
}

export async function fetchResources(): Promise<Resource[]> {
  const res = await request("/api/resources");
  if (!res.ok) throw new Error("Failed to fetch resources");
  return res.json();
}

export async function createResource(resource: InsertResource): Promise<Resource> {
  const res = await request("/api/resources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resource),
  });
  if (!res.ok) throw new Error("Failed to create resource entry");
  return res.json();
}

export async function updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource> {
  const res = await request(`/api/resources/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resource),
  });
  if (!res.ok) throw new Error("Failed to update resource entry");
  return res.json();
}

export async function deleteResource(id: number): Promise<void> {
  const res = await request(`/api/resources/${id}`, {
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
  const res = await request("/api/analytics");
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

// =========================
// System Settings (Settings)
// =========================
export async function fetchSystemSettings(): Promise<unknown> {
  const res = await request("/api/settings");
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
  const res = await request("/api/agent/chat", {
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
  const res = await request("/api/agent/chat", {
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
  const res = await request("/api/transactions");
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function createTransaction(transaction: InsertTransaction): Promise<Transaction> {
  const res = await request("/api/transactions", {
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
  const res = await request(`/api/transactions/${id}`, {
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
  const res = await request(`/api/transactions/${id}`, {
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
  const res = await request(url);
  if (!res.ok) throw new Error("Failed to fetch financial summary");
  return res.json();
}

// Monthly Obligations
export async function fetchMonthlyPayables(year?: number, month?: number): Promise<RecurringTransaction[]> {
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month || now.getMonth() + 1;

  const res = await request(`/api/finance/obligations/payables?year=${y}&month=${m}`);
  if (!res.ok) throw new Error("Failed to fetch monthly payables");
  return res.json();
}

export async function fetchMonthlyReceivables(year?: number, month?: number): Promise<RecurringTransaction[]> {
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month || now.getMonth() + 1;

  const res = await request(`/api/finance/obligations/receivables?year=${y}&month=${m}`);
  if (!res.ok) throw new Error("Failed to fetch monthly receivables");
  return res.json();
}

export async function markObligationAsPaid(templateId: number, paidDate?: Date): Promise<Transaction> {
  const res = await request(`/api/finance/obligations/${templateId}/pay`, {
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
  const res = await request(`/api/finance/obligations/${templateId}/unpay`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to revert payment status");
  return res.json();
}


// Recurring Transactions
export async function fetchRecurringTransactions(): Promise<RecurringTransaction[]> {
  const res = await request("/api/recurring-transactions");
  if (!res.ok) throw new Error("Failed to fetch recurring transactions");
  return res.json();
}

export async function createRecurringTransaction(recurring: InsertRecurringTransaction): Promise<RecurringTransaction> {
  const res = await request("/api/recurring-transactions", {
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
  const res = await request(`/api/recurring-transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recurring),
  });
  if (!res.ok) throw new Error("Failed to update recurring transaction");
  return res.json();
}

export async function deleteRecurringTransaction(id: number): Promise<void> {
  const res = await request(`/api/recurring-transactions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete recurring transaction");
}

export async function executeRecurringTransaction(id: number): Promise<Transaction> {
  const res = await request(`/api/recurring-transactions/${id}/execute`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to execute recurring transaction");
  return res.json();
}

export async function executePendingRecurringTransactions(): Promise<{ count: number; transactions: Transaction[] }> {
  const res = await request("/api/recurring-transactions/execute-pending", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to execute pending recurring transactions");
  return res.json();
}

// Projects Management
export async function fetchProjects(): Promise<Project[]> {
  const res = await request("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function fetchProjectById(id: number): Promise<Project> {
  const res = await request(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

// Project Details (Command Center)
export interface ProjectFinancials {
  budget: number;
  totalExpenses: number;
  laborCosts: number;
  actualCost: number;
  margin: number;
  marginPercentage: number;
}

export interface TeamAssignmentWithMember {
  id: number;
  teamId: number;
  campaignId: number | null;
  projectId: number | null;
  hoursAllocated: number;
  assignedAt: string;
  member: Team;
}

export interface ProjectDetails {
  project: Project;
  deliverables: ProjectDeliverable[];
  teamAssignments: TeamAssignmentWithMember[];
  financial: ProjectFinancials;
}

export async function fetchProjectDetails(id: number): Promise<ProjectDetails> {
  const res = await request(`/api/projects/${id}/details`);
  if (!res.ok) throw new Error("Failed to fetch project details");
  return res.json();
}

export async function createProject(project: InsertProject): Promise<DBProject> {
  const res = await request("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let errorMessage = errorData.message || errorData.error || "Failed to create project";
    if (Array.isArray(errorMessage)) {
      errorMessage = errorMessage.map((e: any) => e.message || JSON.stringify(e)).join(", ");
    } else if (typeof errorMessage === 'object') {
      errorMessage = JSON.stringify(errorMessage);
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function updateProject(id: number, project: UpdateProject): Promise<DBProject> {
  const res = await request(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function deleteProject(id: number): Promise<void> {
  const res = await request(`/api/projects/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete project");
}

// Project Deliverables
export async function fetchProjectDeliverables(projectId: number): Promise<ProjectDeliverable[]> {
  const res = await request(`/api/projects/${projectId}/deliverables`);
  if (!res.ok) throw new Error("Failed to fetch deliverables");
  return res.json();
}

export async function createProjectDeliverable(
  projectId: number,
  deliverable: Omit<InsertProjectDeliverable, 'projectId'>
): Promise<ProjectDeliverable> {
  const res = await request(`/api/projects/${projectId}/deliverables`, {
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
  const res = await request(`/api/deliverables/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deliverable),
  });
  if (!res.ok) throw new Error("Failed to update deliverable");
  return res.json();
}

export async function deleteProjectDeliverable(id: number): Promise<void> {
  const res = await request(`/api/deliverables/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete deliverable");
}

// Project Attachments
export async function fetchProjectAttachments(projectId: number): Promise<ProjectAttachment[]> {
  const res = await request(`/api/projects/${projectId}/attachments`);
  if (!res.ok) throw new Error("Failed to fetch attachments");
  return res.json();
}

export async function createProjectAttachment(
  projectId: number,
  attachment: Omit<InsertProjectAttachment, 'projectId'>
): Promise<ProjectAttachment> {
  const res = await request(`/api/projects/${projectId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(attachment),
  });
  if (!res.ok) throw new Error("Failed to create attachment");
  return res.json();
}

export async function deleteProjectAttachment(id: number): Promise<void> {
  const res = await request(`/api/attachments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete attachment");
}

// Link attachment to deliverable (for file-required deliverables)
export async function linkAttachmentToDeliverable(
  deliverableId: number,
  attachmentId: number
): Promise<ProjectDeliverable> {
  const res = await request(`/api/deliverables/${deliverableId}/link-attachment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attachmentId }),
  });
  if (!res.ok) throw new Error("Failed to link attachment to deliverable");
  return res.json();
}

// Upload file and link to deliverable in one operation
export interface UploadAndLinkResult {
  deliverable: ProjectDeliverable;
  attachment: ProjectAttachment;
}

export async function uploadAndLinkToDeliverable(
  deliverableId: number,
  projectId: number,
  file: { name: string; url: string; fileType?: string; fileSize?: number }
): Promise<UploadAndLinkResult> {
  const res = await request(`/api/deliverables/${deliverableId}/upload-and-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      name: file.name,
      url: file.url,
      fileType: file.fileType,
      fileSize: file.fileSize
    }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to upload and link attachment");
  }
  return res.json();
}

// Agency Role Catalog
export async function fetchAgencyRoles(): Promise<AgencyRole[]> {
  const res = await request("/api/agency/roles");
  if (!res.ok) throw new Error("Failed to fetch agency roles");
  return res.json();
}

export async function createAgencyRole(role: InsertAgencyRole): Promise<AgencyRole> {
  const res = await request("/api/agency/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(role),
  });
  if (!res.ok) throw new Error("Failed to create agency role");
  return res.json();
}

export async function updateAgencyRole(id: number, role: UpdateAgencyRole): Promise<AgencyRole> {
  const res = await request(`/api/agency/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(role),
  });
  if (!res.ok) throw new Error("Failed to update agency role");
  return res.json();
}

export async function deleteAgencyRole(id: number): Promise<void> {
  const res = await request(`/api/agency/roles/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete agency role");
}

// ===========================================
// 📇 CONTACTS MODULE
// ===========================================
import type {
  Contact,
  InsertContact,
  UpdateContact,
  BillingProfile,
  InsertBillingProfile,
  UpdateBillingProfile,
  DigitalAsset,
  InsertDigitalAsset,
  UpdateDigitalAsset,
  ClientDocument,
  InsertClientDocument,
  Installment,
  InsertInstallment,
  UpdateInstallment,
} from "@shared/schema";

export async function fetchContactsByClient(clientId: number): Promise<Contact[]> {
  const res = await request(`/api/clients/${clientId}/contacts`);
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
}

export async function fetchContactById(id: number): Promise<Contact> {
  const res = await request(`/api/contacts/${id}`);
  if (!res.ok) throw new Error("Failed to fetch contact");
  return res.json();
}

export async function createContact(contact: InsertContact): Promise<Contact> {
  const res = await request("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });
  if (!res.ok) throw new Error("Failed to create contact");
  return res.json();
}

export async function updateContact(id: number, contact: UpdateContact): Promise<Contact> {
  const res = await request(`/api/contacts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });
  if (!res.ok) throw new Error("Failed to update contact");
  return res.json();
}

export async function deleteContact(id: number): Promise<void> {
  const res = await request(`/api/contacts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete contact");
}

// ===========================================
// 🧾 BILLING PROFILES MODULE
// ===========================================

export async function fetchBillingProfilesByClient(clientId: number): Promise<BillingProfile[]> {
  const res = await request(`/api/clients/${clientId}/billing-profiles`);
  if (!res.ok) throw new Error("Failed to fetch billing profiles");
  return res.json();
}

export async function fetchBillingProfileById(id: number): Promise<BillingProfile> {
  const res = await request(`/api/billing-profiles/${id}`);
  if (!res.ok) throw new Error("Failed to fetch billing profile");
  return res.json();
}

export async function createBillingProfile(profile: InsertBillingProfile): Promise<BillingProfile> {
  const res = await request("/api/billing-profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error("Failed to create billing profile");
  return res.json();
}

export async function updateBillingProfile(id: number, profile: UpdateBillingProfile): Promise<BillingProfile> {
  const res = await request(`/api/billing-profiles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error("Failed to update billing profile");
  return res.json();
}

export async function deleteBillingProfile(id: number): Promise<void> {
  const res = await request(`/api/billing-profiles/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete billing profile");
}

// ===========================================
// 🌐 DIGITAL ASSETS MODULE (D&H)
// ===========================================

export async function fetchDigitalAssetsByClient(clientId: number): Promise<DigitalAsset[]> {
  const res = await request(`/api/clients/${clientId}/digital-assets`);
  if (!res.ok) throw new Error("Failed to fetch digital assets");
  return res.json();
}

export async function fetchExpiringDigitalAssets(daysAhead: number = 30): Promise<DigitalAsset[]> {
  const res = await request(`/api/digital-assets/expiring?days=${daysAhead}`);
  if (!res.ok) throw new Error("Failed to fetch expiring digital assets");
  return res.json();
}

export async function fetchDigitalAssetById(id: number): Promise<DigitalAsset> {
  const res = await request(`/api/digital-assets/${id}`);
  if (!res.ok) throw new Error("Failed to fetch digital asset");
  return res.json();
}

export async function createDigitalAsset(asset: InsertDigitalAsset | FormData): Promise<DigitalAsset> {
  const isFormData = asset instanceof FormData;
  const headers: HeadersInit = isFormData ? {} : { "Content-Type": "application/json" };
  const body = isFormData ? asset : JSON.stringify(asset);

  const res = await request("/api/digital-assets", {
    method: "POST",
    headers,
    body,
  });
  if (!res.ok) throw new Error("Failed to create digital asset");
  return res.json();
}

export async function updateDigitalAsset(id: number, asset: UpdateDigitalAsset | FormData): Promise<DigitalAsset> {
  const isFormData = asset instanceof FormData;
  const headers: HeadersInit = isFormData ? {} : { "Content-Type": "application/json" };
  const body = isFormData ? asset : JSON.stringify(asset);

  const res = await request(`/api/digital-assets/${id}`, {
    method: "PATCH",
    headers,
    body,
  });
  if (!res.ok) throw new Error("Failed to update digital asset");
  return res.json();
}

export async function deleteDigitalAsset(id: number): Promise<void> {
  const res = await request(`/api/digital-assets/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete digital asset");
}

// ===========================================
// 📁 CLIENT DOCUMENTS MODULE
// ===========================================

export async function fetchClientDocuments(clientId: number): Promise<ClientDocument[]> {
  const res = await request(`/api/clients/${clientId}/documents`);
  if (!res.ok) throw new Error("Failed to fetch client documents");
  return res.json();
}

export async function fetchClientDocumentById(id: number): Promise<ClientDocument> {
  const res = await request(`/api/client-documents/${id}`);
  if (!res.ok) throw new Error("Failed to fetch client document");
  return res.json();
}

export async function createClientDocument(doc: InsertClientDocument): Promise<ClientDocument> {
  const res = await request("/api/client-documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error("Failed to create client document");
  return res.json();
}

export async function deleteClientDocument(id: number): Promise<void> {
  const res = await request(`/api/client-documents/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete client document");
}

// ===========================================
// 💰 INSTALLMENTS MODULE
// ===========================================

export async function fetchInstallmentsByProject(projectId: number): Promise<Installment[]> {
  const res = await request(`/api/projects/${projectId}/installments`);
  if (!res.ok) throw new Error("Failed to fetch installments");
  return res.json();
}

export async function generateInstallmentsForProject(projectId: number): Promise<Installment[]> {
  const res = await request(`/api/projects/${projectId}/installments/generate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate installments");
  return res.json();
}

export async function fetchInstallmentById(id: number): Promise<Installment> {
  const res = await request(`/api/installments/${id}`);
  if (!res.ok) throw new Error("Failed to fetch installment");
  return res.json();
}

export async function createInstallment(installment: InsertInstallment): Promise<Installment> {
  const res = await request("/api/installments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(installment),
  });
  if (!res.ok) throw new Error("Failed to create installment");
  return res.json();
}

export async function updateInstallment(id: number, installment: UpdateInstallment): Promise<Installment> {
  const res = await request(`/api/installments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(installment),
  });
  if (!res.ok) throw new Error("Failed to update installment");
  return res.json();
}

export async function deleteInstallment(id: number): Promise<void> {
  const res = await request(`/api/installments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete installment");
}

// ===========================================
// 🛠️ SERVICE CATALOG MODULE
// ===========================================

import type {
  ServiceCatalog,
  InsertServiceCatalog,
  UpdateServiceCatalog,
  ProjectService,
  InsertProjectService,
} from "@shared/schema";

export type { ServiceCatalog, InsertServiceCatalog, UpdateServiceCatalog, ProjectService };

export async function fetchServiceCatalog(): Promise<ServiceCatalog[]> {
  const res = await request("/api/services");
  if (!res.ok) throw new Error("Failed to fetch service catalog");
  return res.json();
}

export async function fetchServiceById(id: number): Promise<ServiceCatalog> {
  const res = await request(`/api/services/${id}`);
  if (!res.ok) throw new Error("Failed to fetch service");
  return res.json();
}

export async function createService(service: InsertServiceCatalog): Promise<ServiceCatalog> {
  const res = await request("/api/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(service),
  });
  if (!res.ok) throw new Error("Failed to create service");
  return res.json();
}

export async function updateService(id: number, service: UpdateServiceCatalog): Promise<ServiceCatalog> {
  const res = await request(`/api/services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(service),
  });
  if (!res.ok) throw new Error("Failed to update service");
  return res.json();
}

export async function deleteService(id: number): Promise<void> {
  const res = await request(`/api/services/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete service");
}

// ===========================================
// 🔗 PROJECT SERVICES (Service Assignment)
// ===========================================

export interface ProjectServiceWithDetails extends ProjectService {
  service: ServiceCatalog;
}

export async function fetchProjectServices(projectId: number): Promise<ProjectServiceWithDetails[]> {
  const res = await request(`/api/projects/${projectId}/services`);
  if (!res.ok) throw new Error("Failed to fetch project services");
  return res.json();
}

export async function addProjectService(projectId: number, serviceId: number, customPrice?: string, notes?: string): Promise<ProjectService> {
  const res = await request(`/api/projects/${projectId}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceId, customPrice, notes }),
  });
  if (!res.ok) throw new Error("Failed to add service to project");
  return res.json();
}

export async function removeProjectService(projectId: number, serviceId: number): Promise<void> {
  const res = await request(`/api/projects/${projectId}/services/${serviceId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove service from project");
}

export async function updateProjectService(projectId: number, serviceId: number, customPrice?: string, notes?: string): Promise<ProjectService> {
  const res = await request(`/api/projects/${projectId}/services/${serviceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customPrice, notes }),
  });
  if (!res.ok) throw new Error("Failed to update project service");
  return res.json();
}

// ===========================================
// 🎯 LEADS MODULE (CRM Kanban)
// ===========================================
import type {
  Lead,
  InsertLead,
  UpdateLead,
  Poe,
  InsertPoe,
  UpdatePoe,
} from "@shared/schema";

export type { Lead, Poe };

export interface LeadsMetrics {
  total: number;
  byOrigin: Record<string, number>;
  conversionRate: number;
  avgValue: number;
}

export async function fetchLeads(): Promise<Lead[]> {
  const res = await request("/api/leads");
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json();
}

export async function fetchLeadsByOrigin(origin: string): Promise<Lead[]> {
  const res = await request(`/api/leads/origin/${encodeURIComponent(origin)}`);
  if (!res.ok) throw new Error("Failed to fetch leads by origin");
  return res.json();
}

export async function fetchLeadById(id: number): Promise<Lead> {
  const res = await request(`/api/leads/${id}`);
  if (!res.ok) throw new Error("Failed to fetch lead");
  return res.json();
}

export async function fetchLeadsMetrics(): Promise<LeadsMetrics> {
  const res = await request("/api/leads/metrics");
  if (!res.ok) throw new Error("Failed to fetch leads metrics");
  return res.json();
}

export async function createLead(lead: InsertLead): Promise<Lead> {
  const res = await request("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error("Failed to create lead");
  return res.json();
}

export async function updateLead(id: number, lead: UpdateLead): Promise<Lead> {
  const res = await request(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error("Failed to update lead");
  return res.json();
}

export async function deleteLead(id: number): Promise<void> {
  const res = await request(`/api/leads/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete lead");
}

export async function convertLeadToClient(leadId: number): Promise<{ lead: Lead; clientId: number }> {
  const res = await request(`/api/leads/${leadId}/convert`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to convert lead to client");
  return res.json();
}

// ===========================================
// 📋 POES MODULE (Standard Operating Procedures)
// ===========================================

export async function fetchPoes(): Promise<Poe[]> {
  const res = await request("/api/poes");
  if (!res.ok) throw new Error("Failed to fetch POES");
  return res.json();
}

export async function fetchPoesByCategory(category: string): Promise<Poe[]> {
  const res = await request(`/api/poes/category/${encodeURIComponent(category)}`);
  if (!res.ok) throw new Error("Failed to fetch POES by category");
  return res.json();
}

export async function fetchPoeById(id: number): Promise<Poe> {
  const res = await request(`/api/poes/${id}`);
  if (!res.ok) throw new Error("Failed to fetch POE");
  return res.json();
}

export async function createPoe(poe: InsertPoe): Promise<Poe> {
  const res = await request("/api/poes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(poe),
  });
  if (!res.ok) throw new Error("Failed to create POE");
  return res.json();
}

export async function updatePoe(id: number, poe: UpdatePoe): Promise<Poe> {
  const res = await request(`/api/poes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(poe),
  });
  if (!res.ok) throw new Error("Failed to update POE");
  return res.json();
}

export async function deletePoe(id: number): Promise<void> {
  const res = await request(`/api/poes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete POE");
}

// ===========================================
// 👥 PROJECT TEAM (New Controller)
// ===========================================

export async function fetchProjectTeam(projectId: number): Promise<any[]> {
  const res = await request(`/api/projects/${projectId}/team`);
  if (!res.ok) throw new Error("Failed to fetch project team");
  return res.json();
}

export async function addProjectTeamMember(projectId: number, data: any): Promise<any> {
  const res = await request(`/api/projects/${projectId}/team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add team member");
  return res.json();
}

export async function removeProjectTeamMember(assignmentId: number): Promise<void> {
  const res = await request(`/api/project-team/${assignmentId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove team member");
}
