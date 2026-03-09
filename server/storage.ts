import {
  type User,
  type InsertUser,
  type Campaign,
  type InsertCampaign,
  type UpdateCampaign,
  type SystemMetric,
  type InsertSystemMetric,
  type TelemetryData,
  type InsertTelemetryData,
  type ClientAccount,
  type InsertClientAccount,
  type Team,
  type InsertTeam,
  type UpdateTeam,
  type TeamAssignment,
  type InsertTeamAssignment,
  type Resource,
  type InsertResource,
  type AdPlatform,
  type InsertAdPlatform,
  type AdCreative,
  type InsertAdCreative,
  type UpdateAdCreative,
  type AdMetric,
  type InsertAdMetric,
  type PlatformConnection,
  type InsertPlatformConnection,
  type UpdatePlatformConnection,
  type AccountMapping,
  type InsertAccountMapping,
  type UpdateAccountMapping,
  type ClientKpiConfig,
  type InsertClientKpiConfig,
  type UpdateClientKpiConfig,
  type Transaction,
  type InsertTransaction,
  type UpdateTransaction,
  type RecurringTransaction,
  type InsertRecurringTransaction,
  type UpdateRecurringTransaction,
  type Project,
  type InsertProject,
  type UpdateProject,
  type ProjectDeliverable,
  type InsertProjectDeliverable,
  type UpdateProjectDeliverable,
  type ProjectAttachment,
  type InsertProjectAttachment,
  // New Agency Module Types
  type Contact,
  type InsertContact,
  type UpdateContact,
  type BillingProfile,
  type InsertBillingProfile,
  type UpdateBillingProfile,
  type DigitalAsset,
  type InsertDigitalAsset,
  type UpdateDigitalAsset,
  type ClientDocument,
  type InsertClientDocument,
  type Installment,
  type InsertInstallment,
  type UpdateInstallment,
  // Service Catalog Types
  type ServiceCatalog,
  type InsertServiceCatalog,
  type UpdateServiceCatalog,
  type ProjectService,
  type InsertProjectService,
  // Cohete Replica Types
  type Lead,
  type InsertLead,
  type UpdateLead,
  type Poe,
  type InsertPoe,
  type UpdatePoe,
  type ProjectTeamAssignment,
  type InsertProjectTeamAssignment,
  type UpdateProjectTeamAssignment,
  type Supplier,
  type InsertSupplier,
  type UpdateSupplier,
  // Tables
  users,
  campaigns,
  systemMetrics,
  telemetryData,
  clientAccounts,
  team,
  teamAssignments,
  resources,
  adPlatforms,
  adCreatives,
  adMetrics,
  platformConnections,
  accountMappings,
  clientKpiConfig,
  transactions,
  recurringTransactions,
  projects,
  projectDeliverables,
  projectAttachments,
  agencyRoleCatalog,
  // New Agency Module Tables
  contacts,
  billingProfiles,
  digitalAssets,
  clientDocuments,
  installments,
  // Service Catalog Tables
  serviceCatalog,
  projectServices,
  // Cohete Replica Tables
  leads,
  poes,
  projectTeamAssignments,
  suppliers,
  type AgencyRole,
  type InsertAgencyRole,
  type UpdateAgencyRole,
  refreshTokens,
  type RefreshToken,
  type InsertRefreshToken,
  auditLogs,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, sql, and } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

interface PostgresResult {
  count: number;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  updateUserSettings(userId: string, settings: any): Promise<User>;
  /** @deprecated Feature not implemented. Kept for backward compatibility. */
  updateUserWebhook(userId: string, webhookUrl: string): Promise<User>;
  regenerateApiKey(userId: string): Promise<string>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User>;
  deleteUser(id: string): Promise<boolean>;

  // Token Management
  createRefreshToken(data: InsertRefreshToken): Promise<RefreshToken>;
  getRefreshToken(tokenHash: string): Promise<RefreshToken | undefined>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeAllUserRefreshTokens(userId: string): Promise<void>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(options?: { limit?: number; userId?: string; entityType?: string }): Promise<AuditLog[]>;

  getCampaigns(): Promise<Campaign[]>;
  getCampaignById(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: UpdateCampaign): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;

  getSystemMetrics(): Promise<SystemMetric[]>;
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;

  getTelemetryData(limit?: number): Promise<TelemetryData[]>;
  createTelemetryData(data: InsertTelemetryData): Promise<TelemetryData>;
  cleanupOldTelemetry(keepLast: number): Promise<void>;
  cleanupOldMetrics(keepLast: number): Promise<void>;

  getClientAccounts(): Promise<ClientAccount[]>;
  getClientAccountById(id: number): Promise<ClientAccount | undefined>;
  createClientAccount(account: InsertClientAccount): Promise<ClientAccount>;
  updateClientAccount(id: number, account: Partial<InsertClientAccount>): Promise<ClientAccount | undefined>;
  deleteClientAccount(id: number): Promise<boolean>;

  getTeam(): Promise<(Team & { roleData: AgencyRole | null })[]>;
  getTeamById(id: number): Promise<(Team & { roleData: AgencyRole | null }) | undefined>;
  createTeam(person: InsertTeam): Promise<Team>;
  updateTeam(id: number, person: UpdateTeam): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  getTeamAssignments(): Promise<TeamAssignment[]>;
  getAssignmentsByCampaignId(campaignId: number): Promise<TeamAssignment[]>;
  getAssignmentsByTeamId(teamId: number): Promise<TeamAssignment[]>;
  createTeamAssignment(assignment: InsertTeamAssignment): Promise<TeamAssignment>;
  deleteTeamAssignment(id: number): Promise<boolean>;

  getResources(): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;
  cleanupOldResources(keepLast: number): Promise<void>;

  // Agency Role Catalog
  getAgencyRoles(): Promise<AgencyRole[]>;
  getAgencyRoleById(id: number): Promise<AgencyRole | undefined>;
  createAgencyRole(role: InsertAgencyRole): Promise<AgencyRole>;
  updateAgencyRole(id: number, role: UpdateAgencyRole): Promise<AgencyRole | undefined>;
  deleteAgencyRole(id: number): Promise<boolean>;

  // Ads Command Center methods
  getAdPlatforms(): Promise<AdPlatform[]>;
  getAdPlatformById(id: number): Promise<AdPlatform | undefined>;
  getAdPlatformByName(name: string): Promise<AdPlatform | undefined>;
  createAdPlatform(platform: InsertAdPlatform): Promise<AdPlatform>;
  updateAdPlatform(id: number, platform: Partial<InsertAdPlatform>): Promise<AdPlatform | undefined>;
  deleteAdPlatform(id: number): Promise<boolean>;

  getAllAdCreatives(): Promise<AdCreative[]>;
  getAdCreativeById(id: number): Promise<AdCreative | undefined>;
  getAdCreativesByPlatform(platformId: number): Promise<AdCreative[]>;
  getTopPerformingCreatives(limit: number): Promise<(AdCreative & { metrics: AdMetric })[]>;
  getBottomPerformingCreatives(limit: number): Promise<(AdCreative & { metrics: AdMetric })[]>;
  createAdCreative(creative: InsertAdCreative): Promise<AdCreative>;
  updateAdCreative(id: number, creative: UpdateAdCreative): Promise<AdCreative | undefined>;
  deleteAdCreative(id: number): Promise<boolean>;

  getAdMetrics(): Promise<AdMetric[]>;
  getAdMetricsByCreative(creativeId: number): Promise<AdMetric[]>;
  getLatestAdMetricByCreative(creativeId: number): Promise<AdMetric | undefined>;
  createAdMetric(metric: InsertAdMetric): Promise<AdMetric>;
  getBlendedROAS(): Promise<{ roas: number; totalSpend: number; totalRevenue: number }>;

  // Platform Connections
  getPlatformConnections(): Promise<PlatformConnection[]>;
  getPlatformConnectionById(id: number): Promise<PlatformConnection | undefined>;
  getPlatformConnectionsByPlatformId(platformId: number): Promise<PlatformConnection[]>;
  createPlatformConnection(connection: InsertPlatformConnection): Promise<PlatformConnection>;
  updatePlatformConnection(id: number, connection: UpdatePlatformConnection): Promise<PlatformConnection | undefined>;
  deletePlatformConnection(id: number): Promise<boolean>;

  // Account Mappings
  getAccountMappings(): Promise<AccountMapping[]>;
  getAccountMappingById(id: number): Promise<AccountMapping | undefined>;
  getAccountMappingsByConnectionId(connectionId: number): Promise<AccountMapping[]>;
  createAccountMapping(mapping: InsertAccountMapping): Promise<AccountMapping>;
  updateAccountMapping(id: number, mapping: UpdateAccountMapping): Promise<AccountMapping | undefined>;
  deleteAccountMapping(id: number): Promise<boolean>;

  // Client KPI Config
  getClientKpiConfigs(): Promise<ClientKpiConfig[]>;
  getClientKpiConfigByClientName(clientName: string): Promise<ClientKpiConfig | undefined>;
  createClientKpiConfig(config: InsertClientKpiConfig): Promise<ClientKpiConfig>;
  updateClientKpiConfig(clientName: string, config: UpdateClientKpiConfig): Promise<ClientKpiConfig | undefined>;
  deleteClientKpiConfig(clientName: string): Promise<boolean>;

  // Financial Hub - Transactions
  getTransactions(): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: UpdateTransaction): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  getFinancialSummary(startDate?: Date, endDate?: Date): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    cashFlow: number;
    incomeByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
    monthlyData: Array<{ month: string; income: number; expenses: number }>;
  }>;

  // Financial Hub - Recurring Transactions
  getRecurringTransactions(): Promise<RecurringTransaction[]>;
  getRecurringTransactionById(id: number): Promise<RecurringTransaction | undefined>;
  createRecurringTransaction(recurring: InsertRecurringTransaction): Promise<RecurringTransaction>;
  updateRecurringTransaction(id: number, recurring: UpdateRecurringTransaction): Promise<RecurringTransaction | undefined>;
  deleteRecurringTransaction(id: number): Promise<boolean>;
  executeRecurringTransaction(id: number): Promise<Transaction>;
  executePendingRecurringTransactions(): Promise<Transaction[]>;

  // Monthly Obligations (Bidirectional - Payables & Receivables)
  getMonthlyAccountsPayable(year: number, month: number): Promise<RecurringTransaction[]>;
  getMonthlyAccountsReceivable(year: number, month: number): Promise<RecurringTransaction[]>;
  markObligationAsPaid(templateId: number, paidDate: Date): Promise<Transaction>;

  // FIN-001: Delete transaction linked to recurring template for current month
  deleteTransactionByRecurringTemplateId(templateId: number): Promise<boolean>;


  // Projects Management
  getProjects(): Promise<(Project & { client: ClientAccount })[]>;
  getProjectById(id: number): Promise<(Project & { client: ClientAccount; deliverables: ProjectDeliverable[] }) | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: UpdateProject): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  calculateProjectProgress(projectId: number): Promise<number>;
  calculateProjectHealth(projectId: number): Promise<string>;

  // Project Deliverables
  getProjectDeliverables(projectId: number): Promise<ProjectDeliverable[]>;
  createProjectDeliverable(deliverable: InsertProjectDeliverable): Promise<ProjectDeliverable>;
  updateProjectDeliverable(id: number, deliverable: UpdateProjectDeliverable): Promise<ProjectDeliverable | undefined>;
  deleteProjectDeliverable(id: number): Promise<boolean>;

  // Project Attachments
  getProjectAttachments(projectId: number): Promise<ProjectAttachment[]>;
  getProjectAttachmentById(id: number): Promise<ProjectAttachment | undefined>;
  createProjectAttachment(attachment: InsertProjectAttachment): Promise<ProjectAttachment>;
  deleteProjectAttachment(id: number): Promise<boolean>;
  linkAttachmentToDeliverable(deliverableId: number, attachmentId: number): Promise<ProjectDeliverable | undefined>;

  // Project Details (Command Center)
  getProjectDetails(id: number): Promise<ProjectDetails | undefined>;

  // ===========================================
  // 📇 CONTACTS MODULE
  // ===========================================
  getContactsByClientId(clientId: number): Promise<Contact[]>;
  getContactById(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: UpdateContact): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  // ===========================================
  // 🧾 BILLING PROFILES MODULE
  // ===========================================
  getBillingProfilesByClientId(clientId: number): Promise<BillingProfile[]>;
  getBillingProfileById(id: number): Promise<BillingProfile | undefined>;
  createBillingProfile(profile: InsertBillingProfile): Promise<BillingProfile>;
  updateBillingProfile(id: number, profile: UpdateBillingProfile): Promise<BillingProfile | undefined>;
  deleteBillingProfile(id: number): Promise<boolean>;

  // ===========================================
  // 🌐 DIGITAL ASSETS MODULE (D&H)
  // ===========================================
  getDigitalAssetsByClientId(clientId: number): Promise<DigitalAsset[]>;
  getDigitalAssetById(id: number): Promise<DigitalAsset | undefined>;
  createDigitalAsset(asset: InsertDigitalAsset): Promise<DigitalAsset>;
  updateDigitalAsset(id: number, asset: UpdateDigitalAsset): Promise<DigitalAsset | undefined>;
  deleteDigitalAsset(id: number): Promise<boolean>;
  getExpiringDigitalAssets(daysAhead: number): Promise<DigitalAsset[]>;

  // ===========================================
  // 📁 CLIENT DOCUMENTS MODULE
  // ===========================================
  getClientDocumentsByClientId(clientId: number): Promise<ClientDocument[]>;
  getClientDocumentById(id: number): Promise<ClientDocument | undefined>;
  createClientDocument(doc: InsertClientDocument): Promise<ClientDocument>;
  deleteClientDocument(id: number): Promise<boolean>;

  // ===========================================
  // 💰 INSTALLMENTS MODULE
  // ===========================================
  getInstallmentsByProjectId(projectId: number): Promise<Installment[]>;
  getInstallmentById(id: number): Promise<Installment | undefined>;
  createInstallment(installment: InsertInstallment): Promise<Installment>;
  updateInstallment(id: number, installment: UpdateInstallment): Promise<Installment | undefined>;
  deleteInstallment(id: number): Promise<boolean>;
  generateInstallmentsForProject(projectId: number): Promise<Installment[]>;

  // ===========================================
  // 🎯 LEADS MODULE (CRM Kanban)
  // ===========================================
  getLeads(): Promise<Lead[]>;
  getLeadsByOrigin(origin: string): Promise<Lead[]>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  getLeadById(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: UpdateLead): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  convertLeadToClient(leadId: number): Promise<{ lead: Lead; clientId: number }>;
  getLeadsMetrics(): Promise<{ total: number; byOrigin: Record<string, number>; conversionRate: number; avgValue: number }>;

  // ===========================================
  // 📋 POES MODULE (Standard Operating Procedures)
  // ===========================================
  getPoes(): Promise<Poe[]>;
  getPoesByCategory(category: string): Promise<Poe[]>;
  getPoeById(id: number): Promise<Poe | undefined>;
  createPoe(poe: InsertPoe): Promise<Poe>;
  updatePoe(id: number, poe: UpdatePoe): Promise<Poe | undefined>;
  deletePoe(id: number): Promise<boolean>;

  // ===========================================
  // 👥 PROJECT TEAM ASSIGNMENTS MODULE
  // ===========================================
  getProjectTeamAssignments(projectId: number): Promise<(ProjectTeamAssignment & { member: Team })[]>;
  createProjectTeamAssignment(assignment: InsertProjectTeamAssignment): Promise<ProjectTeamAssignment>;
  updateProjectTeamAssignment(id: number, assignment: UpdateProjectTeamAssignment): Promise<ProjectTeamAssignment | undefined>;
  deleteProjectTeamAssignment(id: number): Promise<boolean>;
  getTeamMemberPerformance(teamMemberId: number): Promise<{ revenueGenerated: number; projectsCount: number; hoursLogged: number }>;

  // ===========================================
  // 👥 AGENCY ROLE CATALOG
  // ===========================================
  getAgencyRoles(): Promise<AgencyRole[]>;
  getAgencyRoleById(id: number): Promise<AgencyRole | undefined>;
  createAgencyRole(role: InsertAgencyRole): Promise<AgencyRole>;
  updateAgencyRole(id: number, role: UpdateAgencyRole): Promise<AgencyRole | undefined>;
  deleteAgencyRole(id: number): Promise<boolean>;
}

// Project Details for Command Center view
export interface ProjectDetails {
  project: Project & { client: ClientAccount };
  deliverables: ProjectDeliverable[];
  teamAssignments: Array<TeamAssignment & { member: Team }>;
  financial: {
    budget: number;
    totalExpenses: number;
    laborCosts: number;
    serviceCosts: number;
    adSpend: number;
    actualCost: number;
    margin: number;
    marginPercentage: number;
  };
}

// Type definitions for SQL query results
interface AdCreativeWithMetricsRow {
  id: number;
  platform_id: number;
  creative_name: string;
  creative_type: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  metrics: {
    id: number;
    creativeId: number;
    platformId: number;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: string;
    revenue: string;
    ctr: string;
    cpa: string;
    roas: string;
    metricDate: Date;
    syncedAt: Date;
  };
}

interface BlendedRoasRow {
  total_spend: string;
  total_revenue: string;
  roas: string;
}

interface TransactionRow {
  type: string;
  category: string;
  amount: string;
  month: string;
}

interface ProjectWithClientRow {
  id: number;
  client_id: number;
  name: string;
  service_type: string;
  status: string;
  health: string;
  progress: number;
  description: string | null;
  deadline: Date | null;
  created_at: Date;
  updated_at: Date;
  client: {
    id: number;
    campaignId: number;
    companyName: string;
    industry: string;
    monthlyBudget: string;
    currentSpend: string;
    healthScore: number;
    nextMilestone: string;
    lastContact: Date;
    status: string;
    timestamp: Date;
  };
}

export class DBStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error(`❌ [createUser] Error al insertar usuario:`, {
        input: { username: insertUser.username },
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar el usuario en la base de datos");
    }
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    try {
      const [updated] = await db.update(users)
        .set(user)
        .where(eq(users.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateUser] Error al actualizar usuario:`, { id, error });
      throw new Error("Error al actualizar usuario");
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error(`❌ [deleteUser] Error al eliminar usuario:`, { id, error });
      throw new Error("Error al eliminar usuario");
    }
  }

  // ===========================================
  // 🛡️ REFRESH TOKENS (SEC-001)
  // ===========================================
  async createRefreshToken(data: InsertRefreshToken): Promise<RefreshToken> {
    try {
      const [token] = await db.insert(refreshTokens).values(data).returning();
      return token;
    } catch (error) {
      console.error(`❌ [createRefreshToken] Error:`, error);
      throw new Error("Error al crear refresh token");
    }
  }

  async getRefreshToken(tokenHash: string): Promise<RefreshToken | undefined> {
    const [token] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
    return token;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    try {
      await db.update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.tokenHash, tokenHash));
    } catch (error) {
      console.error(`❌ [revokeRefreshToken] Error:`, error);
      throw new Error("Error al revocar refresh token");
    }
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    try {
      await db.update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.userId, userId));
    } catch (error) {
      console.error(`❌ [revokeAllUserRefreshTokens] Error:`, error);
      throw new Error("Error al revocar todos los refresh tokens del usuario");
    }
  }

  async updateUserSettings(userId: string, settings: any): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({ settings: JSON.stringify(settings) })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error(`❌ [updateUserSettings] Error al actualizar configuración:`, {
        userId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar la configuración del usuario");
    }
  }

  /**
   * @deprecated Feature not implemented. Kept for backward compatibility.
   * TODO: Either implement webhook sender functionality or remove this method entirely.
   */
  async updateUserWebhook(userId: string, webhookUrl: string): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({ webhookUrl })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error(`❌ [updateUserWebhook] Error al actualizar webhook:`, {
        userId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar el webhook del usuario");
    }
  }

  async regenerateApiKey(userId: string): Promise<string> {
    try {
      const newKey = "sk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await db
        .update(users)
        .set({ apiKey: newKey })
        .where(eq(users.id, userId));
      return newKey;
    } catch (error) {
      console.error(`❌ [regenerateApiKey] Error al regenerar API key:`, {
        userId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al regenerar la API key");
    }
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error(`❌ [updateUserPassword] Error al actualizar password:`, {
        userId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar la contraseña del usuario");
    }
  }

  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaignById(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    try {
      const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
      return newCampaign;
    } catch (error) {
      console.error(`❌ [createCampaign] Error al insertar campaña:`, {
        input: { name: campaign.name, campaignCode: campaign.campaignCode },
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar la campaña en la base de datos");
    }
  }

  async updateCampaign(id: number, campaign: UpdateCampaign): Promise<Campaign | undefined> {
    try {
      const [updatedCampaign] = await db
        .update(campaigns)
        .set({ ...campaign, updatedAt: new Date() })
        .where(eq(campaigns.id, id))
        .returning();
      return updatedCampaign;
    } catch (error) {
      console.error(`❌ [updateCampaign] Error al actualizar campaña:`, {
        id,
        input: campaign,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar la campaña en la base de datos");
    }
  }

  async deleteCampaign(id: number): Promise<boolean> {
    try {
      const result = await db.delete(campaigns).where(eq(campaigns.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteCampaign] Error al eliminar campaña:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar la campaña de la base de datos");
    }
  }

  async getSystemMetrics(): Promise<SystemMetric[]> {
    const latestMetrics = await db
      .select()
      .from(systemMetrics)
      .orderBy(desc(systemMetrics.timestamp))
      .limit(4);
    return latestMetrics;
  }

  async createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric> {
    try {
      const [newMetric] = await db.insert(systemMetrics).values(metric).returning();
      return newMetric;
    } catch (error) {
      console.error(`❌ [createSystemMetric] Error al insertar métrica:`, {
        input: metric,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar la métrica del sistema", {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getTelemetryData(limit: number = 24): Promise<TelemetryData[]> {
    return await db
      .select()
      .from(telemetryData)
      .orderBy(desc(telemetryData.timestamp))
      .limit(limit);
  }

  async createTelemetryData(data: InsertTelemetryData): Promise<TelemetryData> {
    try {
      const [newData] = await db.insert(telemetryData).values(data).returning();
      return newData;
    } catch (error) {
      console.error(`❌ [createTelemetryData] Error al insertar telemetría:`, {
        input: data,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar los datos de telemetría", {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async cleanupOldTelemetry(keepLast: number): Promise<void> {
    try {
      await db.execute(sql`
        WITH keep AS (
          SELECT id FROM ${telemetryData}
          ORDER BY timestamp DESC, id DESC
          LIMIT ${keepLast}
        )
        DELETE FROM ${telemetryData}
        WHERE id NOT IN (SELECT id FROM keep)
      `);
    } catch (error) {
      console.error(`❌ [cleanupOldTelemetry] Error al limpiar telemetría antigua:`, {
        keepLast,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al limpiar datos de telemetría antiguos", {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async cleanupOldMetrics(keepLast: number): Promise<void> {
    try {
      await db.execute(sql`
        WITH keep AS (
          SELECT id FROM ${systemMetrics}
          ORDER BY timestamp DESC, id DESC
          LIMIT ${keepLast}
        )
        DELETE FROM ${systemMetrics}
        WHERE id NOT IN (SELECT id FROM keep)
      `);
    } catch (error) {
      console.error(`❌ [cleanupOldMetrics] Error al limpiar métricas antiguas:`, {
        keepLast,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al limpiar métricas del sistema antiguas", {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getClientAccounts(): Promise<ClientAccount[]> {
    return await db
      .select()
      .from(clientAccounts)
      .orderBy(desc(clientAccounts.createdAt));
  }

  async getClientAccountById(id: number): Promise<ClientAccount | undefined> {
    const [account] = await db
      .select()
      .from(clientAccounts)
      .where(eq(clientAccounts.id, id))
      .limit(1);
    return account;
  }

  async createClientAccount(account: InsertClientAccount): Promise<ClientAccount> {
    try {
      const [newAccount] = await db.insert(clientAccounts).values(account).returning();
      return newAccount;
    } catch (error) {
      console.error(`❌ [createClientAccount] Error al insertar cliente:`, {
        input: { companyName: account.companyName, industry: account.industry },
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar el cliente en la base de datos");
    }
  }

  async updateClientAccount(id: number, account: Partial<InsertClientAccount>): Promise<ClientAccount | undefined> {
    try {
      const existing = await this.getClientAccountById(id);
      if (!existing) return undefined;

      const [updated] = await db
        .update(clientAccounts)
        .set({ ...account, updatedAt: new Date() })
        .where(eq(clientAccounts.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateClientAccount] Error al actualizar cliente:`, {
        id,
        input: account,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar el cliente en la base de datos");
    }
  }

  async deleteClientAccount(id: number): Promise<boolean> {
    try {
      const result = await db.delete(clientAccounts).where(eq(clientAccounts.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteClientAccount] Error al eliminar cliente:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar el cliente de la base de datos");
    }
  }

  async getTeam(): Promise<(Team & { roleData: AgencyRole | null })[]> {
    const results = await db
      .select({
        team: team,
        roleData: agencyRoleCatalog,
      })
      .from(team)
      .leftJoin(agencyRoleCatalog, eq(team.roleCatalogId, agencyRoleCatalog.id))
      .orderBy(desc(team.createdAt));

    return results.map(row => ({
      ...row.team,
      roleData: row.roleData
    }));
  }

  async getTeamById(id: number): Promise<(Team & { roleData: AgencyRole | null }) | undefined> {
    const results = await db
      .select({
        team: team,
        roleData: agencyRoleCatalog,
      })
      .from(team)
      .leftJoin(agencyRoleCatalog, eq(team.roleCatalogId, agencyRoleCatalog.id))
      .where(eq(team.id, id));

    if (results.length === 0) return undefined;

    return {
      ...results[0].team,
      roleData: results[0].roleData
    };
  }

  async createTeam(person: InsertTeam): Promise<Team> {
    try {
      // Filter out null values to fix type compatibility with Drizzle
      const cleanPerson = Object.fromEntries(
        Object.entries(person).filter(([_, v]) => v !== null)
      );
      const [newPerson] = await db.insert(team).values(cleanPerson as InsertTeam).returning();
      return newPerson;
    } catch (error) {
      console.error(`❌ [createTeam] Error al insertar miembro del equipo:`, {
        input: person,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar el miembro del equipo en la base de datos");
    }
  }

  async updateTeam(id: number, person: UpdateTeam): Promise<Team | undefined> {
    try {
      // Filter out null values to fix type compatibility with Drizzle
      const cleanPerson = Object.fromEntries(
        Object.entries(person).filter(([_, v]) => v !== null)
      );
      const [updated] = await db
        .update(team)
        .set(cleanPerson)
        .where(eq(team.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateTeam] Error al actualizar miembro del equipo:`, {
        id,
        input: person,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar el miembro del equipo");
    }
  }

  async deleteTeam(id: number): Promise<boolean> {
    try {
      const result = await db.delete(team).where(eq(team.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteTeam] Error al eliminar miembro del equipo:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar el miembro del equipo");
    }
  }

  async getTeamAssignments(): Promise<TeamAssignment[]> {
    return await db.select().from(teamAssignments).orderBy(desc(teamAssignments.assignedAt));
  }

  async getAssignmentsByCampaignId(campaignId: number): Promise<TeamAssignment[]> {
    return await db
      .select()
      .from(teamAssignments)
      .where(eq(teamAssignments.campaignId, campaignId));
  }

  async getAssignmentsByTeamId(teamId: number): Promise<TeamAssignment[]> {
    return await db
      .select()
      .from(teamAssignments)
      .where(eq(teamAssignments.teamId, teamId));
  }

  async createTeamAssignment(assignment: InsertTeamAssignment): Promise<TeamAssignment> {
    try {
      const [newAssignment] = await db.insert(teamAssignments).values(assignment).returning();
      return newAssignment;
    } catch (error) {
      const errorMsg = `❌ [createTeamAssignment] Error: ${error instanceof Error ? error.message : String(error)}\nStack: ${error instanceof Error ? error.stack : 'N/A'}\nInput: ${JSON.stringify(assignment)}\n\n`;
      console.error(errorMsg);
      try {
        const fs = await import('fs');
        fs.appendFileSync('debug_error.log', errorMsg);
      } catch (err) {
        console.error("Failed to write to log file", err);
      }
      throw new Error("Error al guardar la asignación del equipo");
    }
  }

  async deleteTeamAssignment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(teamAssignments).where(eq(teamAssignments.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteTeamAssignment] Error al eliminar asignación:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar la asignación del equipo");
    }
  }

  async getResources(): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .orderBy(desc(resources.createdAt));
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    try {
      const [newResource] = await db.insert(resources).values(resource).returning();
      return newResource;
    } catch (error) {
      console.error(`❌ [createResource] Error al insertar recurso:`, {
        input: resource,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar el recurso en la base de datos");
    }
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    try {
      const [updatedResource] = await db
        .update(resources)
        .set(resource)
        .where(eq(resources.id, id))
        .returning();
      return updatedResource;
    } catch (error) {
      console.error(`❌ [updateResource] Error al actualizar recurso:`, {
        id,
        input: resource,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar el recurso");
    }
  }

  async deleteResource(id: number): Promise<boolean> {
    try {
      const result = await db.delete(resources).where(eq(resources.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteResource] Error al eliminar recurso:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar el recurso");
    }
  }

  async cleanupOldResources(keepLast: number): Promise<void> {
    try {
      await db.execute(sql`
        WITH keep AS (
          SELECT id FROM ${resources}
          ORDER BY created_at DESC, id DESC
          LIMIT ${keepLast}
        )
        DELETE FROM ${resources}
        WHERE id NOT IN (SELECT id FROM keep)
      `);
    } catch (error) {
      console.error(`❌ [cleanupOldResources] Error al limpiar recursos antiguos:`, {
        keepLast,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al limpiar recursos antiguos");
    }
  }

  // Agency Role Catalog implementation
  async getAgencyRoles(): Promise<AgencyRole[]> {
    return await db.select().from(agencyRoleCatalog).orderBy(desc(agencyRoleCatalog.createdAt));
  }

  async getAgencyRoleById(id: number): Promise<AgencyRole | undefined> {
    const [role] = await db.select().from(agencyRoleCatalog).where(eq(agencyRoleCatalog.id, id));
    return role;
  }

  async createAgencyRole(role: InsertAgencyRole): Promise<AgencyRole> {
    try {
      const [newRole] = await db.insert(agencyRoleCatalog).values(role).returning();
      return newRole;
    } catch (error) {
      console.error(`❌ [createAgencyRole] Error al insertar rol de agencia:`, {
        input: role,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar el rol de agencia");
    }
  }

  async updateAgencyRole(id: number, role: UpdateAgencyRole): Promise<AgencyRole | undefined> {
    try {
      const [updated] = await db
        .update(agencyRoleCatalog)
        .set(role)
        .where(eq(agencyRoleCatalog.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateAgencyRole] Error al actualizar rol de agencia:`, {
        id,
        input: role,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar el rol de agencia");
    }
  }

  async deleteAgencyRole(id: number): Promise<boolean> {
    try {
      const result = await db.delete(agencyRoleCatalog).where(eq(agencyRoleCatalog.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteAgencyRole] Error al eliminar rol de agencia:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar el rol de agencia");
    }
  }

  // Ads Command Center implementation
  async getAdPlatforms(): Promise<AdPlatform[]> {
    return await db.select().from(adPlatforms).orderBy(desc(adPlatforms.createdAt));
  }

  async getAdPlatformById(id: number): Promise<AdPlatform | undefined> {
    const [platform] = await db.select().from(adPlatforms).where(eq(adPlatforms.id, id));
    return platform;
  }

  async getAdPlatformByName(name: string): Promise<AdPlatform | undefined> {
    const [platform] = await db.select().from(adPlatforms).where(eq(adPlatforms.platformName, name));
    return platform;
  }

  async createAdPlatform(platform: InsertAdPlatform): Promise<AdPlatform> {
    try {
      const [newPlatform] = await db.insert(adPlatforms).values(platform).returning();
      return newPlatform;
    } catch (error) {
      console.error(`❌ [createAdPlatform] Error al insertar plataforma:`, {
        input: platform,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar la plataforma de ads");
    }
  }

  async updateAdPlatform(id: number, platform: Partial<InsertAdPlatform>): Promise<AdPlatform | undefined> {
    try {
      const [updated] = await db
        .update(adPlatforms)
        .set(platform)
        .where(eq(adPlatforms.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateAdPlatform] Error al actualizar plataforma:`, {
        id,
        input: platform,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar la plataforma de ads");
    }
  }

  async deleteAdPlatform(id: number): Promise<boolean> {
    try {
      const result = await db.delete(adPlatforms).where(eq(adPlatforms.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteAdPlatform] Error al eliminar plataforma:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar la plataforma de ads");
    }
  }

  async getAllAdCreatives(): Promise<AdCreative[]> {
    return await db.select().from(adCreatives).orderBy(desc(adCreatives.createdAt));
  }

  async getAdCreativeById(id: number): Promise<AdCreative | undefined> {
    const [creative] = await db.select().from(adCreatives).where(eq(adCreatives.id, id));
    return creative;
  }

  async getAdCreativesByPlatform(platformId: number): Promise<AdCreative[]> {
    return await db.select().from(adCreatives).where(eq(adCreatives.platformId, platformId));
  }

  async getTopPerformingCreatives(limit: number = 3): Promise<(AdCreative & { metrics: AdMetric })[]> {
    const result = await db.execute(sql`
      SELECT 
        c.*,
        json_build_object(
          'id', m.id,
          'creativeId', m.creative_id,
          'platformId', m.platform_id,
          'impressions', m.impressions,
          'clicks', m.clicks,
          'conversions', m.conversions,
          'spend', m.spend,
          'revenue', m.revenue,
          'ctr', m.ctr,
          'cpa', m.cpa,
          'roas', m.roas,
          'metricDate', m.metric_date,
          'syncedAt', m.synced_at
        ) as metrics
      FROM ${adCreatives} c
      INNER JOIN LATERAL (
        SELECT * FROM ${adMetrics}
        WHERE creative_id = c.id
        ORDER BY metric_date DESC
        LIMIT 1
      ) m ON true
      WHERE c.status = 'active'
      ORDER BY m.roas DESC NULLS LAST
      LIMIT ${limit}
    `);
    return result as unknown as (AdCreative & { metrics: AdMetric })[];
  }

  async getBottomPerformingCreatives(limit: number = 3): Promise<(AdCreative & { metrics: AdMetric })[]> {
    const result = await db.execute(sql`
      SELECT 
        c.*,
        json_build_object(
          'id', m.id,
          'creativeId', m.creative_id,
          'platformId', m.platform_id,
          'impressions', m.impressions,
          'clicks', m.clicks,
          'conversions', m.conversions,
          'spend', m.spend,
          'revenue', m.revenue,
          'ctr', m.ctr,
          'cpa', m.cpa,
          'roas', m.roas,
          'metricDate', m.metric_date,
          'syncedAt', m.synced_at
        ) as metrics
      FROM ${adCreatives} c
      INNER JOIN LATERAL (
        SELECT * FROM ${adMetrics}
        WHERE creative_id = c.id
        ORDER BY metric_date DESC
        LIMIT 1
      ) m ON true
      WHERE c.status = 'active'
      ORDER BY m.roas ASC NULLS LAST
      LIMIT ${limit}
    `);
    return result as unknown as (AdCreative & { metrics: AdMetric })[];
  }

  async createAdCreative(creative: InsertAdCreative): Promise<AdCreative> {
    try {
      const [newCreative] = await db.insert(adCreatives).values(creative).returning();
      return newCreative;
    } catch (error) {
      console.error(`❌ [createAdCreative] Error al insertar creativo:`, {
        input: creative,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar el creativo de ads");
    }
  }

  async updateAdCreative(id: number, creative: UpdateAdCreative): Promise<AdCreative | undefined> {
    try {
      const [updated] = await db
        .update(adCreatives)
        .set({ ...creative, updatedAt: new Date() })
        .where(eq(adCreatives.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateAdCreative] Error al actualizar creativo:`, {
        id,
        input: creative,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar el creativo de ads");
    }
  }

  async deleteAdCreative(id: number): Promise<boolean> {
    try {
      const result = await db.delete(adCreatives).where(eq(adCreatives.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteAdCreative] Error al eliminar creativo:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar el creativo de ads");
    }
  }

  async getAdMetrics(): Promise<AdMetric[]> {
    return await db.select().from(adMetrics).orderBy(desc(adMetrics.metricDate));
  }

  async getAdMetricsByCreative(creativeId: number): Promise<AdMetric[]> {
    return await db
      .select()
      .from(adMetrics)
      .where(eq(adMetrics.creativeId, creativeId))
      .orderBy(desc(adMetrics.metricDate));
  }

  async getLatestAdMetricByCreative(creativeId: number): Promise<AdMetric | undefined> {
    const [metric] = await db
      .select()
      .from(adMetrics)
      .where(eq(adMetrics.creativeId, creativeId))
      .orderBy(desc(adMetrics.metricDate))
      .limit(1);
    return metric;
  }

  async createAdMetric(metric: InsertAdMetric): Promise<AdMetric> {
    try {
      const [newMetric] = await db.insert(adMetrics).values(metric).returning();

      // 360 Bridge 3: Marketing (Ad Metrics) to Finance (Ad Spend Conciliation)
      if (metric.spend && parseFloat(metric.spend.toString()) > 0) {
        // 1. Get Creative to find Campaign
        const [creative] = await db.select().from(adCreatives).where(eq(adCreatives.id, metric.creativeId)).limit(1);

        if (creative && creative.campaignId) {
          // 2. Get Campaign to find Client
          const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, creative.campaignId)).limit(1);

          if (campaign) {
            // Note: campaigns only stores clientName string, not clientId relation.
            // For a perfect 360 link, we try to match the clientAccount by name, but fallback to null if not found
            let matchedClientId = null;
            if (campaign.clientName) {
              const [client] = await db.select().from(clientAccounts)
                .where(eq(clientAccounts.companyName, campaign.clientName))
                .limit(1);
              if (client) matchedClientId = client.id;
            }

            // Get Platform Name for notes
            const [platform] = await db.select().from(adPlatforms).where(eq(adPlatforms.id, metric.platformId)).limit(1);
            const platformName = platform ? platform.displayName : 'Desconocida';

            // 3. Register the Ad Spend as an Expense (Gasto - Pauta)
            await db.insert(transactions).values({
              type: "Gasto",
              category: "Pauta",
              amount: metric.spend.toString(),
              date: new Date(metric.metricDate),
              isPaid: true, // Ad spend is usually already paid/captured by the platform
              clientId: matchedClientId, // Nullable FK, ok if null
              source: "ad_metric",
              sourceId: newMetric.id,
              description: `Gasto Pauta: Ad ${creative.platformAdId} (Campaña: ${campaign.name})`,
              notes: `Métrica de Ads (${platformName}) del ${new Date(metric.metricDate).toLocaleDateString()} importada para ${campaign.clientName}`
            });
          }
        }
      }

      return newMetric;
    } catch (error) {
      console.error(`❌ [createAdMetric] Error al insertar métrica de ads:`, {
        input: metric,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar la métrica de ads");
    }
  }

  async getBlendedROAS(): Promise<{ roas: number; totalSpend: number; totalRevenue: number }> {
    const result = await db.execute(sql`
      SELECT 
        COALESCE(SUM(CAST(spend AS DECIMAL)), 0) as total_spend,
        COALESCE(SUM(CAST(revenue AS DECIMAL)), 0) as total_revenue,
        CASE 
          WHEN SUM(CAST(spend AS DECIMAL)) > 0 
          THEN SUM(CAST(revenue AS DECIMAL)) / SUM(CAST(spend AS DECIMAL))
          ELSE 0
        END as roas
      FROM ${adMetrics}
      WHERE metric_date >= NOW() - INTERVAL '30 days'
    `);
    const row = result[0] as unknown as BlendedRoasRow;
    return {
      totalSpend: parseFloat(row.total_spend || '0'),
      totalRevenue: parseFloat(row.total_revenue || '0'),
      roas: parseFloat(row.roas || '0'),
    };
  }

  // Platform Connections implementation
  async getPlatformConnections(): Promise<PlatformConnection[]> {
    return await db.select().from(platformConnections).orderBy(desc(platformConnections.createdAt));
  }

  async getPlatformConnectionById(id: number): Promise<PlatformConnection | undefined> {
    const [connection] = await db.select().from(platformConnections).where(eq(platformConnections.id, id));
    return connection;
  }

  async getPlatformConnectionsByPlatformId(platformId: number): Promise<PlatformConnection[]> {
    return await db.select().from(platformConnections).where(eq(platformConnections.platformId, platformId));
  }

  async createPlatformConnection(connection: InsertPlatformConnection): Promise<PlatformConnection> {
    try {
      const [newConnection] = await db.insert(platformConnections).values(connection).returning();
      return newConnection;
    } catch (error) {
      console.error(`❌ [createPlatformConnection] Error al insertar conexión:`, {
        input: { platformId: connection.platformId, connectionType: connection.connectionType },
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar la conexión de plataforma");
    }
  }

  async updatePlatformConnection(id: number, connection: UpdatePlatformConnection): Promise<PlatformConnection | undefined> {
    try {
      const [updated] = await db
        .update(platformConnections)
        .set({ ...connection, updatedAt: new Date() })
        .where(eq(platformConnections.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updatePlatformConnection] Error al actualizar conexión:`, {
        id,
        input: connection,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar la conexión de plataforma");
    }
  }

  async deletePlatformConnection(id: number): Promise<boolean> {
    try {
      const result = await db.delete(platformConnections).where(eq(platformConnections.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deletePlatformConnection] Error al eliminar conexión:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar la conexión de plataforma");
    }
  }

  // Account Mappings implementation
  async getAccountMappings(): Promise<AccountMapping[]> {
    return await db.select().from(accountMappings).orderBy(desc(accountMappings.createdAt));
  }

  async getAccountMappingById(id: number): Promise<AccountMapping | undefined> {
    const [mapping] = await db.select().from(accountMappings).where(eq(accountMappings.id, id));
    return mapping;
  }

  async getAccountMappingsByConnectionId(connectionId: number): Promise<AccountMapping[]> {
    return await db.select().from(accountMappings).where(eq(accountMappings.connectionId, connectionId));
  }

  async createAccountMapping(mapping: InsertAccountMapping): Promise<AccountMapping> {
    try {
      const [newMapping] = await db.insert(accountMappings).values(mapping).returning();
      return newMapping;
    } catch (error) {
      console.error(`❌ [createAccountMapping] Error al insertar mapeo de cuenta:`, {
        input: mapping,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar el mapeo de cuenta");
    }
  }

  async updateAccountMapping(id: number, mapping: UpdateAccountMapping): Promise<AccountMapping | undefined> {
    try {
      const [updated] = await db
        .update(accountMappings)
        .set({ ...mapping, updatedAt: new Date() })
        .where(eq(accountMappings.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateAccountMapping] Error al actualizar mapeo de cuenta:`, {
        id,
        input: mapping,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar el mapeo de cuenta");
    }
  }

  async deleteAccountMapping(id: number): Promise<boolean> {
    try {
      const result = await db.delete(accountMappings).where(eq(accountMappings.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteAccountMapping] Error al eliminar mapeo de cuenta:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar el mapeo de cuenta");
    }
  }

  // Client KPI Config implementation
  async getClientKpiConfigs(): Promise<ClientKpiConfig[]> {
    return await db.select().from(clientKpiConfig).orderBy(desc(clientKpiConfig.createdAt));
  }

  async getClientKpiConfigByClientName(clientName: string): Promise<ClientKpiConfig | undefined> {
    const [config] = await db.select().from(clientKpiConfig).where(eq(clientKpiConfig.clientName, clientName));
    return config;
  }

  async createClientKpiConfig(config: InsertClientKpiConfig): Promise<ClientKpiConfig> {
    try {
      const [newConfig] = await db.insert(clientKpiConfig).values(config).returning();
      return newConfig;
    } catch (error) {
      console.error(`❌ [createClientKpiConfig] Error al insertar config KPI:`, {
        input: config,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar la configuración KPI del cliente");
    }
  }

  async updateClientKpiConfig(clientName: string, config: UpdateClientKpiConfig): Promise<ClientKpiConfig | undefined> {
    try {
      const [updated] = await db
        .update(clientKpiConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(clientKpiConfig.clientName, clientName))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateClientKpiConfig] Error al actualizar config KPI:`, {
        clientName,
        input: config,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar la configuración KPI del cliente");
    }
  }

  async deleteClientKpiConfig(clientName: string): Promise<boolean> {
    try {
      const result = await db.delete(clientKpiConfig).where(eq(clientKpiConfig.clientName, clientName));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteClientKpiConfig] Error al eliminar config KPI:`, {
        clientName,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar la configuración KPI del cliente");
    }
  }

  // Financial Hub - Transactions implementation
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.date));
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      // 🛡️ SYNC LOGIC: Enforce legacy 'status' field matches modern 'isPaid' field
      const syncedTransaction: any = {
        ...transaction,
        // If isPaid is true, status MUST be 'Pagado', otherwise 'Pendiente'
        status: transaction.isPaid ? "Pagado" : "Pendiente",
        // If isPaid is true but no paidDate provided, default to now
        paidDate: transaction.isPaid && !transaction.paidDate ? new Date() : transaction.paidDate,
      };

      // 🛡️ TAX LOGIC: Auto-calculate Total if Subtotal is present
      // Ensure numeric fields are strings for Drizzle/Postgres
      if (transaction.subtotal) {
        const sub = parseFloat(transaction.subtotal.toString());
        // Use provided IVA or default to 16%
        const tax = transaction.iva ? parseFloat(transaction.iva.toString()) : sub * 0.16;

        syncedTransaction.subtotal = sub.toFixed(2);
        syncedTransaction.iva = tax.toFixed(2);
        syncedTransaction.amount = (sub + tax).toFixed(2);
      }

      const [newTransaction] = await db.insert(transactions).values(syncedTransaction).returning();
      return newTransaction;
    } catch (error) {
      console.error(`❌ [createTransaction] Error al insertar transacción:`, {
        input: { type: transaction.type, category: transaction.category, amount: transaction.amount },
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar la transacción en la base de datos");
    }
  }

  async updateTransaction(id: number, transaction: UpdateTransaction): Promise<Transaction | undefined> {
    try {
      // 🛡️ SYNC LOGIC: Enforce synchronization during updates
      let syncedTransaction: any = { ...transaction };

      // If 'isPaid' is being updated, we must update 'status' too
      if (transaction.isPaid !== undefined) {
        syncedTransaction.status = transaction.isPaid ? "Pagado" : "Pendiente";
        // If marking as paid and no date provided, set it
        if (transaction.isPaid && !transaction.paidDate) {
          syncedTransaction.paidDate = new Date();
        }
      }
      // Fallback: If 'status' is updated via legacy API but 'isPaid' is missing, sync 'isPaid'
      else if (transaction.status !== undefined) {
        syncedTransaction.isPaid = transaction.status === "Pagado";
        if (syncedTransaction.isPaid && !transaction.paidDate) {
          syncedTransaction.paidDate = new Date();
        }
      }

      // 🛡️ TAX LOGIC: Recalculate if Subtotal is being updated
      if (transaction.subtotal !== undefined) {
        // If null/empty, do nothing or handle clearing? Assumption: if passed, it's a value.
        if (transaction.subtotal) {
          const sub = parseFloat(transaction.subtotal.toString());
          // If IVA is also updated, use it. If not, we might need to fetch current IVA?
          // For now, if Subtotal changes, we enforce 16% unless IVA is strictly provided in this update.
          // This is a safe simplification: changing subtotal usually resets tax calc.
          const tax = transaction.iva ? parseFloat(transaction.iva.toString()) : sub * 0.16;

          syncedTransaction.subtotal = sub.toFixed(2);
          syncedTransaction.iva = tax.toFixed(2);
          syncedTransaction.amount = (sub + tax).toFixed(2);
        }
      }

      const [updated] = await db
        .update(transactions)
        .set({ ...syncedTransaction, updatedAt: new Date() })
        .where(eq(transactions.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateTransaction] Error al actualizar transacción:`, {
        id,
        input: { type: transaction.type, category: transaction.category },
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar la transacción");
    }
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      const result = await db.delete(transactions).where(eq(transactions.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteTransaction] Error al eliminar transacción:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar la transacción");
    }
  }

  async getFinancialSummary(startDate?: Date, endDate?: Date): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    cashFlow: number;
    incomeByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
    monthlyData: Array<{ month: string; income: number; expenses: number }>;
  }> {
    // Default to last 6 months if no dates provided
    const end = endDate || new Date();
    const start = startDate || new Date(end.getFullYear(), end.getMonth() - 5, 1);

    // Get all transactions in range
    const result = await db.execute(sql`
      SELECT 
        type,
        category,
        CAST(amount AS DECIMAL) as amount,
        TO_CHAR(date, 'YYYY-MM') as month
      FROM ${transactions}
      WHERE date >= ${start.toISOString()} AND date <= ${end.toISOString()}
      ORDER BY date DESC
    `);

    const rows = result as unknown as TransactionRow[];

    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    const monthlyMap: Record<string, { income: number; expenses: number }> = {};

    rows.forEach(row => {
      const amount = parseFloat(row.amount || '0');
      const month = row.month;

      // Initialize monthly data if needed
      if (!monthlyMap[month]) {
        monthlyMap[month] = { income: 0, expenses: 0 };
      }

      if (row.type === 'Ingreso') {
        totalIncome += amount;
        incomeByCategory[row.category] = (incomeByCategory[row.category] || 0) + amount;
        monthlyMap[month].income += amount;
      } else if (row.type === 'Gasto') {
        totalExpenses += amount;
        expensesByCategory[row.category] = (expensesByCategory[row.category] || 0) + amount;
        monthlyMap[month].expenses += amount;
      }
    });

    // Generate monthly data array for last 6 months
    const monthlyData: Array<{ month: string; income: number; expenses: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.push({
        month: monthKey,
        income: monthlyMap[monthKey]?.income || 0,
        expenses: monthlyMap[monthKey]?.expenses || 0,
      });
    }

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      cashFlow: totalIncome - totalExpenses, // In this simple version, cashFlow = netProfit
      incomeByCategory,
      expensesByCategory,
      monthlyData,
    };
  }

  // Financial Hub - Recurring Transactions implementation
  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    return await db.select().from(recurringTransactions).orderBy(desc(recurringTransactions.nextExecutionDate));
  }

  async getRecurringTransactionById(id: number): Promise<RecurringTransaction | undefined> {
    const [recurring] = await db.select().from(recurringTransactions).where(eq(recurringTransactions.id, id));
    return recurring;
  }

  async createRecurringTransaction(recurring: InsertRecurringTransaction): Promise<RecurringTransaction> {
    try {
      const [newRecurring] = await db.insert(recurringTransactions).values(recurring).returning();
      return newRecurring;
    } catch (error) {
      console.error(`❌ [createRecurringTransaction] Error al insertar transacción recurrente:`, {
        input: { name: recurring.name, type: recurring.type, frequency: recurring.frequency },
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar la transacción recurrente");
    }
  }

  async updateRecurringTransaction(id: number, recurring: UpdateRecurringTransaction): Promise<RecurringTransaction | undefined> {
    try {
      const [updated] = await db
        .update(recurringTransactions)
        .set({ ...recurring, updatedAt: new Date() })
        .where(eq(recurringTransactions.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateRecurringTransaction] Error al actualizar transacción recurrente:`, {
        id,
        input: recurring,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar la transacción recurrente");
    }
  }

  async deleteRecurringTransaction(id: number): Promise<boolean> {
    try {
      const result = await db.delete(recurringTransactions).where(eq(recurringTransactions.id, id));
      return (result as any).count > 0;
    } catch (error) {
      console.error(`❌ [deleteRecurringTransaction] Error al eliminar transacción recurrente:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar la transacción recurrente");
    }
  }

  // Execute a single recurring transaction manually
  async executeRecurringTransaction(id: number): Promise<Transaction> {
    try {
      const recurring = await this.getRecurringTransactionById(id);
      if (!recurring) throw new Error("Recurring transaction not found");

      // Create transaction from template using new schema fields
      const executionDate = new Date();
      const transaction = await this.createTransaction({
        type: recurring.type as "Ingreso" | "Gasto",
        category: recurring.category,
        amount: recurring.amount,
        date: executionDate,
        isPaid: true,  // ✅ Mark as paid immediately when executed
        // paidDate: executionDate, // createTransaction sets this if isPaid=true
        clientId: recurring.clientId || undefined,
        isRecurringInstance: true,
        recurringTemplateId: id,
        source: 'recurring_template',
        sourceId: id,
        status: 'Pagado',
        description: recurring.description || recurring.name, // Use concept if available
        relatedClient: null,

        // ✅ Fiscal Data
        provider: recurring.provider || undefined,
        rfc: recurring.rfc || undefined,
        subtotal: recurring.subtotal ? recurring.subtotal.toString() : undefined,
        iva: recurring.iva ? recurring.iva.toString() : undefined,
        notes: recurring.notes || undefined,
      });

      // Calculate next execution date
      const nextDate = this.calculateNextExecutionDate(recurring.frequency, recurring.dayOfMonth, recurring.dayOfWeek);

      // Update recurring transaction
      await this.updateRecurringTransaction(id, {
        lastExecutionDate: executionDate,
        nextExecutionDate: nextDate,
      });

      return transaction;
    } catch (error) {
      // Re-throw "not found" errors as-is
      if (error instanceof Error && error.message === "Recurring transaction not found") {
        throw error;
      }
      console.error(`❌ [executeRecurringTransaction] Error al ejecutar transacción recurrente:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al ejecutar la transacción recurrente");
    }
  }

  // Execute all pending recurring transactions (called by cron job)
  async executePendingRecurringTransactions(): Promise<Transaction[]> {
    const now = new Date();
    const pending = await db
      .select()
      .from(recurringTransactions)
      .where(sql`${recurringTransactions.isActive} = true AND ${recurringTransactions.nextExecutionDate} <= ${now}`);

    const created: Transaction[] = [];
    for (const recurring of pending) {
      try {
        const transaction = await this.executeRecurringTransaction(recurring.id);
        created.push(transaction);
      } catch (error) {
        console.error(`Failed to execute recurring transaction ${recurring.id}:`, error);
      }
    }

    return created;
  }

  // Helper to calculate next execution date based on frequency
  private calculateNextExecutionDate(frequency: string, dayOfMonth?: number | null, dayOfWeek?: number | null): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      // ... existing case logic is fine, keeping it consistent or viewing it if needed
      // Re-using existing helper logic if unchanged
      case 'weekly':
        // Set to next occurrence of dayOfWeek
        const targetDay = dayOfWeek ?? 1; // Default to Monday if not set
        const currentDay = next.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        next.setDate(next.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        break;

      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;

      case 'monthly':
        // Set to next month on specified day
        next.setMonth(next.getMonth() + 1);
        if (dayOfMonth) {
          next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        }
        break;

      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        if (dayOfMonth) {
          next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        }
        break;

      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;

      default:
        // Default to next month if frequency is unknown
        next.setMonth(next.getMonth() + 1);
    }

    return next;
  }

  // ============================================
  // Monthly Obligations System (Bidirectional)
  // ============================================

  // Get active recurring expense templates for the month (Gastos)
  async getMonthlyAccountsPayable(year: number, month: number): Promise<RecurringTransaction[]> {
    // Show all active recurring expenses that apply to this month:
    // - Monthly frequency: always show (they recur every month)
    // - Yearly frequency: only show if the month matches
    // - Exclude: already paid this month (lastExecutionDate is in current month)
    const results = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.isActive, true),
          eq(recurringTransactions.type, 'Gasto')
        )
      )
      .orderBy(recurringTransactions.dayOfMonth);

    // Filter by frequency and exclude already paid this month
    return results.filter(r => {
      // Check if already paid this month
      if (r.lastExecutionDate) {
        const lastPaidDate = new Date(r.lastExecutionDate);
        const lastPaidMonth = lastPaidDate.getMonth() + 1;
        const lastPaidYear = lastPaidDate.getFullYear();
        if (lastPaidYear === year && lastPaidMonth === month) {
          return false; // Already paid this month, hide it
        }
      }

      // Check frequency
      if (r.frequency === 'monthly') return true;
      if (r.frequency === 'yearly' && r.nextExecutionDate) {
        const execMonth = new Date(r.nextExecutionDate).getMonth() + 1;
        return execMonth === month;
      }
      return true; // Default show for other frequencies
    });
  }

  // Get active recurring income templates for the month (Ingresos/Retainers)
  async getMonthlyAccountsReceivable(year: number, month: number): Promise<RecurringTransaction[]> {
    // Show all active recurring incomes that apply to this month:
    // - Monthly frequency: always show (they recur every month)
    // - Yearly frequency: only show if the month matches
    // - Exclude: already collected this month (lastExecutionDate is in current month)
    const results = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.isActive, true),
          eq(recurringTransactions.type, 'Ingreso')
        )
      )
      .orderBy(recurringTransactions.dayOfMonth);

    // Filter by frequency and exclude already collected this month
    return results.filter(r => {
      // Check if already collected this month
      if (r.lastExecutionDate) {
        const lastPaidDate = new Date(r.lastExecutionDate);
        const lastPaidMonth = lastPaidDate.getMonth() + 1;
        const lastPaidYear = lastPaidDate.getFullYear();
        if (lastPaidYear === year && lastPaidMonth === month) {
          return false; // Already collected this month, hide it
        }
      }

      // Check frequency
      if (r.frequency === 'monthly') return true;
      if (r.frequency === 'yearly' && r.nextExecutionDate) {
        const execMonth = new Date(r.nextExecutionDate).getMonth() + 1;
        return execMonth === month;
      }
      return true; // Default show for other frequencies
    });
  }

  // Mark an obligation as paid (create actual transaction from template)
  async markObligationAsPaid(templateId: number, paidDate: Date): Promise<Transaction> {
    try {
      const template = await this.getRecurringTransactionById(templateId);
      if (!template) throw new Error("Recurring template not found");

      // Create actual transaction linked to template
      const transaction = await this.createTransaction({
        type: template.type as "Ingreso" | "Gasto",
        category: template.category,
        amount: template.amount,
        date: paidDate,
        isPaid: true,  // ✅ Mark as paid immediately
        paidDate: paidDate,
        clientId: template.clientId || undefined,
        isRecurringInstance: true,  // ✅ Link to template
        recurringTemplateId: templateId,
        source: 'recurring_template',
        sourceId: templateId,
        status: 'Pagado',  // Legacy field
        description: template.description || undefined,
        relatedClient: null,  // Using clientId instead
      });

      // Update template's execution dates
      const nextDate = this.calculateNextExecutionDate(
        template.frequency,
        template.dayOfMonth,
        template.dayOfWeek
      );

      await this.updateRecurringTransaction(templateId, {
        lastExecutionDate: paidDate,
        nextExecutionDate: nextDate,
      });

      return transaction;
    } catch (error) {
      // Re-throw "not found" errors as-is
      if (error instanceof Error && error.message === "Recurring template not found") {
        throw error;
      }
      console.error(`❌ [markObligationAsPaid] Error al marcar obligación como pagada:`, {
        templateId,
        paidDate,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al marcar la obligación como pagada");
    }
  }

  // FIN-001: Delete transaction linked to recurring template for current month
  // Used by the "unpay" feature to properly revert a paid obligation
  async deleteTransactionByRecurringTemplateId(templateId: number): Promise<boolean> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Find and delete transactions linked to this template created this month
      const result = await db.delete(transactions)
        .where(
          and(
            eq(transactions.recurringTemplateId, templateId),
            sql`${transactions.date} >= ${startOfMonth}`,
            sql`${transactions.date} <= ${endOfMonth}`
          )
        );

      const deletedCount = (result as any).rowCount ?? 0;
      console.log(`[deleteTransactionByRecurringTemplateId] Deleted ${deletedCount} transaction(s) for template ${templateId}`);
      return deletedCount > 0;
    } catch (error) {
      console.error(`❌ [deleteTransactionByRecurringTemplateId] Error:`, {
        templateId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar transacción vinculada al template");
    }
  }

  // Projects Management implementation
  async getProjects(): Promise<(Project & { client: ClientAccount })[]> {
    const result = await db.execute(sql`
      SELECT 
        p.*,
        json_build_object(
          'id', c.id,
          'companyName', c.company_name,
          'industry', c.industry,
          'monthlyBudget', c.monthly_budget,
          'currentSpend', c.current_spend,
          'healthScore', c.health_score,
          'nextMilestone', c.next_milestone,
          'lastContact', c.last_contact,
          'status', c.status,
          'createdAt', c.created_at
        ) as client
      FROM ${projects} p
      INNER JOIN ${clientAccounts} c ON p.client_id = c.id
      ORDER BY p.created_at DESC
    `);
    return result as unknown as (Project & { client: ClientAccount })[];
  }

  async getProjectById(id: number): Promise<(Project & { client: ClientAccount; deliverables: ProjectDeliverable[] }) | undefined> {
    const result = await db.execute(sql`
      SELECT 
        p.*,
        json_build_object(
          'id', c.id,
          'companyName', c.company_name,
          'industry', c.industry,
          'monthlyBudget', c.monthly_budget,
          'currentSpend', c.current_spend,
          'healthScore', c.health_score,
          'nextMilestone', c.next_milestone,
          'lastContact', c.last_contact,
          'status', c.status,
          'createdAt', c.created_at
        ) as client,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', d.id,
                'projectId', d.project_id,
                'title', d.title,
                'description', d.description,
                'completed', d.completed,
                'order', d.order,
                'dueDate', d.due_date,
                'requiresFile', d.requires_file,
                'linkedAttachmentId', d.linked_attachment_id,
                'createdAt', d.created_at,
                'updatedAt', d.updated_at
              )
              ORDER BY d.order ASC
            )
            FROM ${projectDeliverables} d
            WHERE d.project_id = p.id
          ),
          '[]'::json
        ) as deliverables
      FROM ${projects} p
      INNER JOIN ${clientAccounts} c ON p.client_id = c.id
      WHERE p.id = ${id}
    `);

    return result[0] as unknown as (Project & { client: ClientAccount; deliverables: ProjectDeliverable[] }) | undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    try {
      const [newProject] = await db.insert(projects).values(project).returning();
      return newProject;
    } catch (error) {
      console.error(`❌ [createProject] Error al insertar proyecto:`, {
        input: { name: project.name, clientId: project.clientId, serviceType: project.serviceType },
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar el proyecto en la base de datos");
    }
  }

  async updateProject(id: number, project: UpdateProject): Promise<Project | undefined> {
    try {
      const [updated] = await db
        .update(projects)
        .set({ ...project, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`❌ [updateProject] Error al actualizar proyecto:`, {
        id,
        input: project,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar el proyecto");
    }
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      const result = await db.delete(projects).where(eq(projects.id, id));
      return (result as unknown as PostgresResult).count > 0;
    } catch (error) {
      console.error(`❌ [deleteProject] Error al eliminar proyecto:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar el proyecto");
    }
  }

  async calculateProjectProgress(projectId: number): Promise<number> {
    const deliverables = await this.getProjectDeliverables(projectId);

    if (deliverables.length === 0) return 0;

    const completedCount = deliverables.filter(d => d.completed).length;
    const progress = Math.round((completedCount / deliverables.length) * 100);

    // Update the project's progress field
    await this.updateProject(projectId, { progress });

    return progress;
  }

  /**
   * Calculate project health based on overdue deliverables that require files.
   * Rule: If any deliverable has requiresFile=true, linkedAttachmentId=NULL, and dueDate < NOW(),
   * the project health becomes 'red'.
   */
  async calculateProjectHealth(projectId: number): Promise<string> {
    const now = new Date();

    // Check for critical blocking conditions:
    // - requiresFile is true
    // - linkedAttachmentId is null (no file attached)
    // - dueDate < now (overdue)
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM ${projectDeliverables}
      WHERE project_id = ${projectId}
        AND requires_file = true
        AND linked_attachment_id IS NULL
        AND due_date IS NOT NULL
        AND due_date < ${now}
    `);

    const overdueWithoutFile = parseInt((result[0] as any)?.count || '0');

    let newHealth = 'green';

    if (overdueWithoutFile > 0) {
      // Critical: Overdue deliverables without required evidence
      newHealth = 'red';
    } else {
      // Check for warning conditions (approaching deadline without file)
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const warningResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM ${projectDeliverables}
        WHERE project_id = ${projectId}
          AND requires_file = true
          AND linked_attachment_id IS NULL
          AND due_date IS NOT NULL
          AND due_date > ${now}
          AND due_date <= ${threeDaysFromNow}
      `);

      const approachingDeadline = parseInt((warningResult[0] as any)?.count || '0');

      if (approachingDeadline > 0) {
        newHealth = 'yellow';
      }
    }

    // Update project health if changed
    await db
      .update(projects)
      .set({ health: newHealth, updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    return newHealth;
  }

  // Project Deliverables implementation
  async getProjectDeliverables(projectId: number): Promise<ProjectDeliverable[]> {
    return await db
      .select()
      .from(projectDeliverables)
      .where(eq(projectDeliverables.projectId, projectId))
      .orderBy(projectDeliverables.order);
  }

  async createProjectDeliverable(deliverable: InsertProjectDeliverable): Promise<ProjectDeliverable> {
    try {
      const [newDeliverable] = await db.insert(projectDeliverables).values(deliverable).returning();

      // Recalculate project progress
      await this.calculateProjectProgress(deliverable.projectId);

      return newDeliverable;
    } catch (error) {
      console.error(`❌ [createProjectDeliverable] Error al insertar entregable:`, {
        input: { projectId: deliverable.projectId, title: deliverable.title },
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar el entregable del proyecto");
    }
  }

  async updateProjectDeliverable(id: number, deliverable: UpdateProjectDeliverable): Promise<ProjectDeliverable | undefined> {
    try {
      // If trying to mark as completed and requiresFile is true, check for linked attachment
      if (deliverable.completed === true) {
        const [existing] = await db
          .select()
          .from(projectDeliverables)
          .where(eq(projectDeliverables.id, id));

        if (existing && existing.requiresFile && !existing.linkedAttachmentId) {
          throw new Error("No se puede completar: se requiere evidencia de archivo");
        }
      }

      const [updated] = await db
        .update(projectDeliverables)
        .set({ ...deliverable, updatedAt: new Date() })
        .where(eq(projectDeliverables.id, id))
        .returning();

      // Recalculate project progress and health if this deliverable was updated
      if (updated) {
        await this.calculateProjectProgress(updated.projectId);
        await this.calculateProjectHealth(updated.projectId);
      }

      return updated;
    } catch (error) {
      // Re-throw validation errors as-is
      if (error instanceof Error && error.message.includes("se requiere evidencia")) {
        throw error;
      }
      console.error(`❌ [updateProjectDeliverable] Error al actualizar entregable:`, {
        id,
        input: deliverable,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al actualizar el entregable del proyecto");
    }
  }

  async deleteProjectDeliverable(id: number): Promise<boolean> {
    try {
      // Get the deliverable BEFORE deletion to know which project to update
      const [deliverable] = await db
        .select()
        .from(projectDeliverables)
        .where(eq(projectDeliverables.id, id));

      if (!deliverable) {
        return false; // Deliverable doesn't exist
      }

      // Store projectId before deletion
      const projectIdToUpdate = deliverable.projectId;

      // Execute deletion
      await db.delete(projectDeliverables).where(eq(projectDeliverables.id, id));

      // ALWAYS recalculate project progress after successful deletion
      // This ensures the parent project's progress bar stays synchronized
      await this.calculateProjectProgress(projectIdToUpdate);

      return true;
    } catch (error) {
      console.error(`❌ [deleteProjectDeliverable] Error al eliminar entregable:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar el entregable del proyecto");
    }
  }

  // Project Attachments implementation
  async getProjectAttachments(projectId: number): Promise<ProjectAttachment[]> {
    return await db
      .select()
      .from(projectAttachments)
      .where(eq(projectAttachments.projectId, projectId))
      .orderBy(desc(projectAttachments.createdAt));
  }

  async getProjectAttachmentById(id: number): Promise<ProjectAttachment | undefined> {
    const [attachment] = await db
      .select()
      .from(projectAttachments)
      .where(eq(projectAttachments.id, id));
    return attachment;
  }

  async createProjectAttachment(attachment: InsertProjectAttachment): Promise<ProjectAttachment> {
    try {
      const [newAttachment] = await db.insert(projectAttachments).values(attachment).returning();
      return newAttachment;
    } catch (error) {
      console.error(`❌ [createProjectAttachment] Error al insertar adjunto:`, {
        input: { projectId: attachment.projectId, name: attachment.name },
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al guardar el adjunto del proyecto");
    }
  }

  async deleteProjectAttachment(id: number): Promise<boolean> {
    try {
      // First, unlink any deliverables that reference this attachment
      await db
        .update(projectDeliverables)
        .set({ linkedAttachmentId: null, updatedAt: new Date() })
        .where(eq(projectDeliverables.linkedAttachmentId, id));

      const result = await db.delete(projectAttachments).where(eq(projectAttachments.id, id));
      return (result as unknown as PostgresResult).count > 0;
    } catch (error) {
      console.error(`❌ [deleteProjectAttachment] Error al eliminar adjunto:`, {
        id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al eliminar el adjunto del proyecto");
    }
  }

  /**
   * Link an attachment to a deliverable and mark it as completed.
   * This is the only way to complete a deliverable that requires a file.
   */
  async linkAttachmentToDeliverable(deliverableId: number, attachmentId: number): Promise<ProjectDeliverable | undefined> {
    try {
      // Verify attachment exists
      const attachment = await this.getProjectAttachmentById(attachmentId);
      if (!attachment) {
        throw new Error("Attachment not found");
      }

      // Update the deliverable with the linked attachment and mark as completed
      const [updated] = await db
        .update(projectDeliverables)
        .set({
          linkedAttachmentId: attachmentId,
          completed: true,
          updatedAt: new Date()
        })
        .where(eq(projectDeliverables.id, deliverableId))
        .returning();

      // Recalculate project progress and health
      if (updated) {
        await this.calculateProjectProgress(updated.projectId);
        await this.calculateProjectHealth(updated.projectId);
      }

      return updated;
    } catch (error) {
      // Re-throw "Attachment not found" as-is
      if (error instanceof Error && error.message === "Attachment not found") {
        throw error;
      }
      console.error(`❌ [linkAttachmentToDeliverable] Error al vincular adjunto:`, {
        deliverableId,
        attachmentId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Error al vincular el adjunto al entregable");
    }
  }

  // Project Details (Command Center) implementation
  async getProjectDetails(id: number): Promise<ProjectDetails | undefined> {
    // 1. Get project with client
    const projectResult = await db.execute(sql`
      SELECT 
        p.*,
        json_build_object(
          'id', c.id,
          'companyName', c.company_name,
          'industry', c.industry,
          'monthlyBudget', c.monthly_budget,
          'currentSpend', c.current_spend,
          'healthScore', c.health_score,
          'nextMilestone', c.next_milestone,
          'lastContact', c.last_contact,
          'status', c.status,
          'createdAt', c.created_at,
          'updatedAt', c.updated_at
        ) as client
      FROM ${projects} p
      INNER JOIN ${clientAccounts} c ON p.client_id = c.id
      WHERE p.id = ${id}
    `);

    if (!projectResult || projectResult.length === 0) {
      return undefined;
    }

    const projectData = projectResult[0] as any;

    // 2. Get deliverables
    const deliverables = await this.getProjectDeliverables(id);

    // 3. Get team assignments with member details
    const teamResult = await db.execute(sql`
      SELECT 
        ta.*,
        json_build_object(
          'id', t.id,
          'name', t.name,
          'role', t.role,
          'department', t.department,
          'status', t.status,
          'avatarUrl', t.avatar_url,
          'workHoursStart', t.work_hours_start,
          'workHoursEnd', t.work_hours_end,
          'internalCostHour', t.internal_cost_hour,
          'billableRate', t.billable_rate,
          'monthlySalary', t.monthly_salary,
          'weeklyCapacity', t.weekly_capacity,
          'skills', t.skills,
          'createdAt', t.created_at
        ) as member
      FROM ${teamAssignments} ta
      INNER JOIN ${team} t ON ta.team_id = t.id
      WHERE ta.project_id = ${id}
    `);

    const teamAssignmentsData = teamResult as unknown as Array<TeamAssignment & { member: Team }>;

    // 4. Calculate financial metrics
    // Get total expenses from transactions where source='project' AND sourceId=project.id
    const expensesResult = await db.execute(sql`
      SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_expenses
      FROM ${transactions}
      WHERE source = 'project' AND source_id = ${id} AND type = 'Gasto'
    `);
    const totalExpenses = parseFloat((expensesResult[0] as any)?.total_expenses || '0');

    // Calculate labor costs: sum of (hours_allocated * team.internal_cost_hour)
    let laborCosts = 0;
    for (const assignment of teamAssignmentsData) {
      const hours = assignment.hoursAllocated || 0;
      const costPerHour = parseFloat((assignment.member as any)?.internalCostHour || '0');
      laborCosts += hours * costPerHour;
    }

    // 360 Bridge 4: Operations (Margin & Profitability)
    // 4.1 Get Project Services Costs
    const servicesResult = await db.execute(sql`
      SELECT COALESCE(SUM(CAST(COALESCE(ps.custom_price, sc.default_price) AS DECIMAL)), 0) as service_costs
      FROM ${projectServices} ps
      INNER JOIN ${serviceCatalog} sc ON ps.service_id = sc.id
      WHERE ps.project_id = ${id}
    `);
    const serviceCosts = parseFloat((servicesResult[0] as any)?.service_costs || '0');

    // 4.2 Get Ad Spend for Campaigns associated with this Project's Client
    let adSpend = 0;
    if (projectData.client_id) {
      const adSpendResult = await db.execute(sql`
        SELECT COALESCE(SUM(CAST(am.spend AS DECIMAL)), 0) as total_ad_spend
        FROM ${adMetrics} am
        INNER JOIN ${adCreatives} ac ON am.creative_id = ac.id
        INNER JOIN ${campaigns} c ON ac.campaign_id = c.id
        INNER JOIN ${clientAccounts} ca ON c.client_name = ca.company_name
        WHERE ca.id = ${projectData.client_id}
      `);
      adSpend = parseFloat((adSpendResult[0] as any)?.total_ad_spend || '0');
    }

    const budget = parseFloat(projectData.budget || '0');
    // True cost includes direct registered expenses + labor + services + ad spend
    const actualCost = totalExpenses + laborCosts + serviceCosts + adSpend;
    const margin = budget - actualCost;
    const marginPercentage = budget > 0 ? (margin / budget) * 100 : 0;

    return {
      project: {
        id: projectData.id,
        clientId: projectData.client_id,
        name: projectData.name,
        serviceType: projectData.service_type,
        status: projectData.status,
        health: projectData.health,
        deadline: projectData.deadline,
        progress: projectData.progress,
        budget: projectData.budget,
        serviceSpecificFields: projectData.service_specific_fields,
        customFields: projectData.custom_fields,
        description: projectData.description,
        // New form fields
        level: projectData.level,
        quotationAmount: projectData.quotation_amount,
        monthlyMaintenance: projectData.monthly_maintenance,
        startDate: projectData.start_date,
        coverImageUrl: projectData.cover_image_url,
        coverColor: projectData.cover_color,
        additionalNotes: projectData.additional_notes,
        // Deal configuration fields
        dealType: projectData.deal_type,
        totalAmount: projectData.total_amount,
        numberOfPayments: projectData.number_of_payments,
        paymentFrequency: projectData.payment_frequency,
        billingDay: projectData.billing_day,
        expectedPaymentDay: projectData.expected_payment_day,
        assignedSellerId: projectData.assigned_seller_id,
        contractUrl: projectData.contract_url,
        createdAt: projectData.created_at,
        updatedAt: projectData.updated_at,
        client: projectData.client,
      },
      deliverables,
      teamAssignments: teamAssignmentsData,
      financial: {
        budget,
        totalExpenses,
        laborCosts,
        serviceCosts,
        adSpend,
        actualCost,
        margin,
        marginPercentage,
      },
    };
  }

  // ===========================================
  // 📇 CONTACTS MODULE IMPLEMENTATION
  // ===========================================

  async getContactsByClientId(clientId: number): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.clientId, clientId));
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, contactData: UpdateContact): Promise<Contact | undefined> {
    const [updated] = await db.update(contacts)
      .set({ ...contactData, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return true;
  }

  // ===========================================
  // 🧾 BILLING PROFILES MODULE IMPLEMENTATION
  // ===========================================

  async getBillingProfilesByClientId(clientId: number): Promise<BillingProfile[]> {
    return await db.select().from(billingProfiles).where(eq(billingProfiles.clientId, clientId));
  }

  async getBillingProfileById(id: number): Promise<BillingProfile | undefined> {
    const [profile] = await db.select().from(billingProfiles).where(eq(billingProfiles.id, id)).limit(1);
    return profile;
  }

  async createBillingProfile(profile: InsertBillingProfile): Promise<BillingProfile> {
    const [newProfile] = await db.insert(billingProfiles).values(profile).returning();
    return newProfile;
  }

  async updateBillingProfile(id: number, profileData: UpdateBillingProfile): Promise<BillingProfile | undefined> {
    const [updated] = await db.update(billingProfiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(billingProfiles.id, id))
      .returning();
    return updated;
  }

  async deleteBillingProfile(id: number): Promise<boolean> {
    await db.delete(billingProfiles).where(eq(billingProfiles.id, id));
    return true;
  }

  // ===========================================
  // 🌐 DIGITAL ASSETS MODULE IMPLEMENTATION
  // ===========================================

  async getDigitalAssetsByClientId(clientId: number): Promise<DigitalAsset[]> {
    return await db.select().from(digitalAssets).where(eq(digitalAssets.clientId, clientId));
  }

  async getDigitalAssetById(id: number): Promise<DigitalAsset | undefined> {
    const [asset] = await db.select().from(digitalAssets).where(eq(digitalAssets.id, id)).limit(1);
    return asset;
  }

  async createDigitalAsset(asset: InsertDigitalAsset): Promise<DigitalAsset> {
    const [newAsset] = await db.insert(digitalAssets).values(asset).returning();

    // 360 Bridge 5: Digital Assets Renewals ➔ Finance (Software Expenses)
    // When a digital asset has autoRenew=true and cost > 0, create a recurring transaction
    if (newAsset.autoRenew && newAsset.cost && parseFloat(newAsset.cost) > 0) {
      // Map renewal frequency to recurringTransactions frequency
      const frequencyMap: Record<string, string> = {
        "monthly": "monthly",
        "quarterly": "quarterly",
        "yearly": "yearly",
        "biennial": "yearly", // Fallback to yearly, adjusted by amount
        "one-time": "yearly", // One-time assets shouldn't auto-renew, but fallback
      };
      const financeFrequency = frequencyMap[newAsset.renewalFrequency || "yearly"] || "yearly";

      // Get client name for description
      const [client] = await db.select().from(clientAccounts).where(eq(clientAccounts.id, newAsset.clientId)).limit(1);
      const clientName = client ? client.companyName : 'Cliente';

      // Calculate next execution date based on expiration or today
      const nextExecution = newAsset.expirationDate || new Date();

      // Create a Recurring Transaction template in Finance
      const [recurringTx] = await db.insert(recurringTransactions).values({
        name: `Renovación: ${newAsset.name}`,
        description: `Gasto recurrente de ${newAsset.assetType} (${newAsset.provider || 'proveedor no especificado'}) para ${clientName}`,
        type: "Gasto",
        category: "Software",
        amount: newAsset.cost,
        frequency: financeFrequency,
        dayOfMonth: nextExecution.getDate(),
        clientId: newAsset.clientId,
        isActive: true,
        nextExecutionDate: nextExecution,
        notes: `Auto-generado por Bridge 5 (Digital Assets). Asset ID: ${newAsset.id}`,
      }).returning();

      // Link the recurring transaction back to the digital asset
      if (recurringTx) {
        await db.update(digitalAssets)
          .set({ linkedRecurringTransactionId: recurringTx.id })
          .where(eq(digitalAssets.id, newAsset.id));
      }
    }

    return newAsset;
  }

  async updateDigitalAsset(id: number, assetData: UpdateDigitalAsset): Promise<DigitalAsset | undefined> {
    const [updated] = await db.update(digitalAssets)
      .set({ ...assetData, updatedAt: new Date() })
      .where(eq(digitalAssets.id, id))
      .returning();
    return updated;
  }

  async deleteDigitalAsset(id: number): Promise<boolean> {
    // Also clean up the linked recurring transaction if it exists
    const [asset] = await db.select().from(digitalAssets).where(eq(digitalAssets.id, id)).limit(1);
    if (asset && asset.linkedRecurringTransactionId) {
      await db.delete(recurringTransactions)
        .where(eq(recurringTransactions.id, asset.linkedRecurringTransactionId));
    }
    await db.delete(digitalAssets).where(eq(digitalAssets.id, id));
    return true;
  }

  async getExpiringDigitalAssets(daysAhead: number): Promise<DigitalAsset[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await db.select().from(digitalAssets)
      .where(
        and(
          eq(digitalAssets.status, "active"),
          sql`${digitalAssets.expirationDate} <= ${futureDate}`
        )
      );
  }

  // ===========================================
  // 📁 CLIENT DOCUMENTS MODULE IMPLEMENTATION
  // ===========================================

  async getClientDocumentsByClientId(clientId: number): Promise<ClientDocument[]> {
    return await db.select().from(clientDocuments).where(eq(clientDocuments.clientId, clientId));
  }

  async getClientDocumentById(id: number): Promise<ClientDocument | undefined> {
    const [doc] = await db.select().from(clientDocuments).where(eq(clientDocuments.id, id)).limit(1);
    return doc;
  }

  async createClientDocument(doc: InsertClientDocument): Promise<ClientDocument> {
    const [newDoc] = await db.insert(clientDocuments).values(doc).returning();
    return newDoc;
  }

  async deleteClientDocument(id: number): Promise<boolean> {
    await db.delete(clientDocuments).where(eq(clientDocuments.id, id));
    return true;
  }

  // ===========================================
  // 💰 INSTALLMENTS MODULE IMPLEMENTATION
  // ===========================================

  async getInstallmentsByProjectId(projectId: number): Promise<Installment[]> {
    return await db.select().from(installments)
      .where(eq(installments.projectId, projectId))
      .orderBy(installments.installmentNumber);
  }

  async getInstallmentById(id: number): Promise<Installment | undefined> {
    const [installment] = await db.select().from(installments).where(eq(installments.id, id)).limit(1);
    return installment;
  }

  async createInstallment(installment: InsertInstallment): Promise<Installment> {
    const [newInstallment] = await db.insert(installments).values(installment).returning();

    // Financial Sync Middleware: Create a Pending Transaction for this installment
    const project = await this.getProjectById(newInstallment.projectId);
    if (project) {
      await db.insert(transactions).values({
        type: "Ingreso",
        category: "Proyectos",
        amount: String(newInstallment.amount),
        date: newInstallment.dueDate,
        isPaid: newInstallment.isPaid || newInstallment.status === "collected",
        paidDate: newInstallment.paidDate,
        clientId: project.clientId,
        projectId: project.id,
        installmentId: newInstallment.id,
        source: "client_project",
        sourceId: project.id,
        notes: newInstallment.notes || "Generado automáticamente desde parcialidad de proyecto",
        description: newInstallment.resolvedConcept || `Parcialidad ${newInstallment.installmentNumber} - ${project.name}`
      });
    }

    return newInstallment;
  }

  async updateInstallment(id: number, installmentData: UpdateInstallment): Promise<Installment | undefined> {
    const [updated] = await db.update(installments)
      .set({ ...installmentData, updatedAt: new Date() })
      .where(eq(installments.id, id))
      .returning();

    if (updated) {
      // Financial Sync Middleware: Sync status with linked transaction
      const isPaid = updated.isPaid || updated.status === "collected";
      await db.update(transactions)
        .set({
          isPaid,
          paidDate: updated.paidDate,
          amount: String(updated.amount),
          date: updated.dueDate,
          updatedAt: new Date()
        })
        .where(eq(transactions.installmentId, updated.id));
    }

    return updated;
  }

  async deleteInstallment(id: number): Promise<boolean> {
    // Financial Sync Middleware: Delete linked transaction
    await db.delete(transactions).where(eq(transactions.installmentId, id));
    await db.delete(installments).where(eq(installments.id, id));
    return true;
  }

  async generateInstallmentsForProject(projectId: number): Promise<Installment[]> {
    // Get project details
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Only generate for "Iguala" type deals
    if (project.dealType !== "Iguala") {
      console.log(`Project ${projectId} is not an Iguala deal, skipping installment generation`);
      return [];
    }

    const numberOfPayments = project.numberOfPayments || 1;
    const totalAmount = parseFloat(project.totalAmount || "0");
    const amountPerInstallment = (totalAmount / numberOfPayments).toFixed(2);

    // Delete existing installments for this project
    await db.delete(installments).where(eq(installments.projectId, projectId));

    const newInstallments: Installment[] = [];
    const baseDate = new Date();

    for (let i = 1; i <= numberOfPayments; i++) {
      const dueDate = new Date(baseDate);

      // Calculate due date based on frequency
      switch (project.paymentFrequency) {
        case "monthly":
          dueDate.setMonth(dueDate.getMonth() + i);
          break;
        case "biweekly":
          dueDate.setDate(dueDate.getDate() + (i * 14));
          break;
        case "quarterly":
          dueDate.setMonth(dueDate.getMonth() + (i * 3));
          break;
        default:
          dueDate.setMonth(dueDate.getMonth() + i);
      }

      // Set billing day if specified
      if (project.billingDay) {
        dueDate.setDate(Math.min(project.billingDay, 28)); // Avoid invalid dates
      }

      const [installment] = await db.insert(installments).values({
        projectId,
        installmentNumber: i,
        amount: amountPerInstallment,
        dueDate,
        status: "pending",
        conceptTemplate: `{{service_name}} - Parcialidad {{installment_number}} de {{total_payments}}`,
        resolvedConcept: `${project.name} - Parcialidad ${i} de ${numberOfPayments}`,
      }).returning();

      // Financial Sync Middleware: Create Transaction for auto-generated installment
      await db.insert(transactions).values({
        type: "Ingreso",
        category: "Proyectos",
        amount: amountPerInstallment,
        date: dueDate,
        isPaid: false,
        clientId: project.clientId,
        projectId: project.id,
        installmentId: installment.id,
        source: "client_project",
        sourceId: project.id,
        notes: "Generado automáticamente (Iguala)",
        description: `${project.name} - Parcialidad ${i} de ${numberOfPayments}`
      });

      newInstallments.push(installment);
    }

    console.log(`Generated ${newInstallments.length} installments for project ${projectId}`);
    return newInstallments;
  }

  // ===========================================
  // 🛠️ SERVICE CATALOG MODULE IMPLEMENTATION
  // ===========================================

  async getServiceCatalog(): Promise<ServiceCatalog[]> {
    return await db.select().from(serviceCatalog)
      .where(eq(serviceCatalog.isActive, true))
      .orderBy(serviceCatalog.name);
  }

  async getServiceCatalogById(id: number): Promise<ServiceCatalog | undefined> {
    const [service] = await db.select().from(serviceCatalog).where(eq(serviceCatalog.id, id)).limit(1);
    return service;
  }

  async createServiceCatalog(service: InsertServiceCatalog): Promise<ServiceCatalog> {
    const [newService] = await db.insert(serviceCatalog).values(service).returning();
    return newService;
  }

  async updateServiceCatalog(id: number, serviceData: UpdateServiceCatalog): Promise<ServiceCatalog | undefined> {
    const [updated] = await db.update(serviceCatalog)
      .set({ ...serviceData, updatedAt: new Date() })
      .where(eq(serviceCatalog.id, id))
      .returning();
    return updated;
  }

  async deleteServiceCatalog(id: number): Promise<boolean> {
    // Soft delete - set isActive to false
    const [updated] = await db.update(serviceCatalog)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(serviceCatalog.id, id))
      .returning();
    return !!updated;
  }

  // ===========================================
  // 🔗 PROJECT SERVICES IMPLEMENTATION
  // ===========================================

  async getProjectServices(projectId: number): Promise<(ProjectService & { service: ServiceCatalog })[]> {
    const result = await db.execute(sql`
      SELECT 
        ps.*,
        json_build_object(
          'id', sc.id,
          'name', sc.name,
          'description', sc.description,
          'defaultPrice', sc.default_price,
          'category', sc.category,
          'icon', sc.icon,
          'isActive', sc.is_active
        ) as service
      FROM ${projectServices} ps
      INNER JOIN ${serviceCatalog} sc ON ps.service_id = sc.id
      WHERE ps.project_id = ${projectId}
      ORDER BY sc.name
    `);
    return result as unknown as (ProjectService & { service: ServiceCatalog })[];
  }

  async addProjectService(data: InsertProjectService): Promise<ProjectService> {
    const [newAssignment] = await db.insert(projectServices).values(data).returning();

    // Financial Sync Middleware: Register cost as 'Egreso' if the service has a cost
    const service = await this.getServiceCatalogById(data.serviceId);
    const amountStr = data.customPrice || (service ? service.defaultPrice : "0");
    const amount = parseFloat(amountStr || "0");

    if (amount > 0 && service) {
      await db.insert(transactions).values({
        type: "Gasto",
        category: "Proyectos",
        amount: String(amount),
        date: new Date(),
        isPaid: false, // Default pending for expenses
        projectId: data.projectId,
        source: "project",
        sourceId: data.projectId,
        notes: data.notes || "Generado automáticamente desde servicio asignado al proyecto",
        description: `Costo asociado: ${service.name}`,
        provider: "Proveedor Interno/Externo"
      });
    }

    return newAssignment;
  }

  async removeProjectService(projectId: number, serviceId: number): Promise<boolean> {
    const service = await this.getServiceCatalogById(serviceId);

    // Financial Sync Middleware: Delete associated pending expense
    if (service) {
      await db.delete(transactions)
        .where(
          and(
            eq(transactions.projectId, projectId),
            eq(transactions.type, "Gasto"),
            eq(transactions.description, `Costo asociado: ${service.name}`),
            eq(transactions.isPaid, false) // Only delete if not already paid
          )
        );
    }

    const result = await db.delete(projectServices)
      .where(and(
        eq(projectServices.projectId, projectId),
        eq(projectServices.serviceId, serviceId)
      ));
    return true;
  }

  async updateProjectServicePrice(projectId: number, serviceId: number, customPrice: string | null, notes?: string): Promise<ProjectService | undefined> {
    const [updated] = await db.update(projectServices)
      .set({ customPrice, notes })
      .where(and(
        eq(projectServices.projectId, projectId),
        eq(projectServices.serviceId, serviceId)
      ))
      .returning();
    return updated;
  }

  async updateProjectServiceLine(projectId: number, serviceId: number, data: {
    quantity?: number;
    customCost?: string | null;
    sellPrice?: string | null;
    customPrice?: string | null;
    notes?: string | null;
  }): Promise<ProjectService | undefined> {
    const updatePayload: Record<string, any> = {};
    if (data.quantity !== undefined) updatePayload.quantity = data.quantity;
    if (data.customCost !== undefined) updatePayload.customCost = data.customCost;
    if (data.sellPrice !== undefined) updatePayload.sellPrice = data.sellPrice;
    if (data.customPrice !== undefined) updatePayload.customPrice = data.customPrice;
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    const [updated] = await db.update(projectServices)
      .set(updatePayload)
      .where(and(
        eq(projectServices.projectId, projectId),
        eq(projectServices.serviceId, serviceId)
      ))
      .returning();
    return updated;
  }

  // ===========================================
  // 🏭 SUPPLIERS MODULE IMPLEMENTATION
  // ===========================================

  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(suppliers.name);
  }

  async getSupplierById(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return supplier;
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(data).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, data: UpdateSupplier): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updated;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    // Unlink services before deleting
    await db.update(serviceCatalog)
      .set({ supplierId: null })
      .where(eq(serviceCatalog.supplierId, id));
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return true;
  }

  // ===========================================
  // 💹 PROJECT PROFITABILITY ENGINE
  // ===========================================

  async getProjectProfitability(projectId: number) {
    // 1. Get project to check dealType (iguala vs proyecto)
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) throw new Error("Proyecto no encontrado");

    // 2. Get all services assigned to this project with full catalog details
    const servicesResult = await db.execute(sql`
      SELECT
        ps.id,
        ps.project_id      AS "projectId",
        ps.service_id      AS "serviceId",
        ps.quantity,
        ps.custom_cost     AS "customCost",
        ps.custom_price    AS "customPrice",
        ps.sell_price      AS "sellPrice",
        ps.notes,
        sc.name            AS "serviceName",
        sc.description     AS "serviceDescription",
        sc.base_cost       AS "baseCost",
        sc.default_price   AS "defaultPrice",
        sc.category,
        sc.icon,
        sup.id             AS "supplierId",
        sup.name           AS "supplierName"
      FROM ${projectServices} ps
      INNER JOIN ${serviceCatalog} sc ON ps.service_id = sc.id
      LEFT JOIN ${suppliers} sup ON sc.supplier_id = sup.id
      WHERE ps.project_id = ${projectId}
      ORDER BY sc.name
    `);

    // 3. Calculate per-line profitability
    const lines = (servicesResult as any[]).map(row => {
      const qty = parseInt(row.quantity || '1');
      // Cost: custom negotiated cost first, then catalog base cost, then 0
      const unitCost = parseFloat(row.customCost || row.baseCost || '0');
      // Price: sellPrice (new field) > customPrice (legacy) > defaultPrice > 0
      const unitPrice = parseFloat(row.sellPrice || row.customPrice || row.defaultPrice || '0');
      const lineCost = qty * unitCost;
      const linePrice = qty * unitPrice;
      const lineMargin = linePrice - lineCost;
      const lineMarginPct = linePrice > 0 ? (lineMargin / linePrice) * 100 : 0;

      return {
        id: row.id,
        serviceId: row.serviceId,
        serviceName: row.serviceName,
        serviceDescription: row.serviceDescription,
        category: row.category,
        icon: row.icon,
        supplierId: row.supplierId,
        supplierName: row.supplierName,
        quantity: qty,
        unitCost,
        unitPrice,
        lineCost,
        linePrice,
        lineMargin,
        lineMarginPct: Math.round(lineMarginPct * 100) / 100,
        notes: row.notes,
      };
    });

    // 4. Aggregate totals
    const totalCost = lines.reduce((s, l) => s + l.lineCost, 0);
    const totalPrice = lines.reduce((s, l) => s + l.linePrice, 0);
    const totalMargin = totalPrice - totalCost;
    const profitabilityPct = totalPrice > 0 ? (totalMargin / totalPrice) * 100 : 0;

    // 5. Health classification
    let health: 'healthy' | 'warning' | 'critical';
    if (profitabilityPct >= 20) health = 'healthy';
    else if (profitabilityPct >= 10) health = 'warning';
    else health = 'critical';

    return {
      projectId,
      projectName: project.name,
      dealType: project.dealType,          // "Proyecto" | "Iguala"
      isRecurringMonthly: project.dealType === 'Iguala',
      lines,
      totals: {
        totalCost: Math.round(totalCost * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
        totalMargin: Math.round(totalMargin * 100) / 100,
        profitabilityPct: Math.round(profitabilityPct * 100) / 100,
        health,
      },
    };
  }

  // ===========================================
  // 🎯 LEADS MODULE IMPLEMENTATION (CRM Kanban)
  // ===========================================


  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLeadsByOrigin(origin: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.origin, origin)).orderBy(desc(leads.createdAt));
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.status, status)).orderBy(desc(leads.createdAt));
  }

  async getLeadById(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: number, lead: UpdateLead): Promise<Lead | undefined> {
    const existingLead = await this.getLeadById(id);
    if (!existingLead) return undefined;

    // 360 Bridge: Auto-convert if status changes to "Ganado" and hasn't been converted
    if (lead.status === "Ganado" && existingLead.status !== "Ganado" && !existingLead.convertedToClientId) {
      const conversionResult = await this.convertLeadToClient(id);
      return conversionResult.lead;
    }

    const [updated] = await db.update(leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updated;
  }

  async deleteLead(id: number): Promise<boolean> {
    await db.delete(leads).where(eq(leads.id, id));
    return true;
  }

  async convertLeadToClient(leadId: number): Promise<{ lead: Lead; clientId: number }> {
    const lead = await this.getLeadById(leadId);
    if (!lead) throw new Error("Lead not found");

    if (lead.convertedToClientId) {
      throw new Error("Este lead ya fue convertido a cliente");
    }

    // 1. Create client from lead data
    let companyName = lead.company || lead.name;
    const newClient = await this.createClientAccount({
      companyName: companyName,
      industry: lead.origin || "Por definir",
      monthlyBudget: Number(lead.estimatedValue) || 0,
      currentSpend: 0,
      healthScore: 100,
      status: "Active",
    });

    // 2. 360 Bridge: Auto-create an initial "Onboarding" Project for Ops handoff
    await this.createProject({
      clientId: newClient.id,
      name: `Onboarding: ${companyName}`,
      serviceType: "Setup Inicial",
      status: "Planning",
      health: "green",
      level: "Plata",
      coverColor: "#3B82F6",
      progress: 0,
      budget: lead.estimatedValue ? lead.estimatedValue.toString() : "0",
      description: `Proyecto generado automáticamente tras cerrar el Lead #${leadId}. Notas del lead: ${lead.notes || "Sin notas"}`,
      dealType: "Proyecto", // Default for onboarding (instead of One-shot which is invalid)
      numberOfPayments: 1,
      totalAmount: lead.estimatedValue ? lead.estimatedValue.toString() : "0"
    });

    // 3. Update lead with conversion info
    const [updatedLead] = await db.update(leads).set({
      status: "Ganado",
      convertedToClientId: newClient.id,
      convertedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(leads.id, leadId)).returning();

    return { lead: updatedLead!, clientId: newClient.id };
  }

  async getLeadsMetrics(): Promise<{ total: number; byOrigin: Record<string, number>; conversionRate: number; avgValue: number }> {
    const allLeads = await this.getLeads();
    const total = allLeads.length;
    const byOrigin: Record<string, number> = {};
    let wonCount = 0;
    let totalValue = 0;

    for (const lead of allLeads) {
      byOrigin[lead.origin] = (byOrigin[lead.origin] || 0) + 1;
      if (lead.status === "Ganado") wonCount++;
      if (lead.estimatedValue) totalValue += Number(lead.estimatedValue);
    }

    return {
      total,
      byOrigin,
      conversionRate: total > 0 ? (wonCount / total) * 100 : 0,
      avgValue: total > 0 ? totalValue / total : 0,
    };
  }

  // ===========================================
  // 📋 POES MODULE IMPLEMENTATION (SOPs)
  // ===========================================

  async getPoes(): Promise<Poe[]> {
    return await db.select().from(poes)
      .where(eq(poes.isActive, true))
      .orderBy(desc(poes.createdAt));
  }

  async getPoesByCategory(category: string): Promise<Poe[]> {
    return await db.select().from(poes)
      .where(and(eq(poes.category, category), eq(poes.isActive, true)))
      .orderBy(desc(poes.createdAt));
  }

  async getPoeById(id: number): Promise<Poe | undefined> {
    const [poe] = await db.select().from(poes).where(eq(poes.id, id)).limit(1);
    return poe;
  }

  async createPoe(poe: InsertPoe): Promise<Poe> {
    const [newPoe] = await db.insert(poes).values(poe).returning();
    return newPoe;
  }

  async updatePoe(id: number, poe: UpdatePoe): Promise<Poe | undefined> {
    const [updated] = await db.update(poes)
      .set({ ...poe, updatedAt: new Date() })
      .where(eq(poes.id, id))
      .returning();
    return updated;
  }

  async deletePoe(id: number): Promise<boolean> {
    // Soft delete
    const [updated] = await db.update(poes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(poes.id, id))
      .returning();
    return !!updated;
  }

  // ===========================================
  // 👥 PROJECT TEAM ASSIGNMENTS IMPLEMENTATION
  // ===========================================

  async getProjectTeamAssignments(projectId: number): Promise<(ProjectTeamAssignment & { member: Team })[]> {
    const result = await db.execute(sql`
      SELECT 
        pta.*,
        json_build_object(
          'id', t.id,
          'name', t.name,
          'role', t.role,
          'seniority', t.department,
          'status', t.status,
          'avatarUrl', t.avatar_url,
          'internalCostHour', t.internal_cost_hour,
          'billableRate', t.billable_rate
        ) as member
      FROM ${projectTeamAssignments} pta
      INNER JOIN ${team} t ON pta.team_member_id = t.id
      WHERE pta.project_id = ${projectId}
      ORDER BY t.name
    `);
    return result as unknown as (ProjectTeamAssignment & { member: Team })[];
  }

  async createProjectTeamAssignment(assignment: InsertProjectTeamAssignment): Promise<ProjectTeamAssignment> {
    const [newAssignment] = await db.insert(projectTeamAssignments).values(assignment).returning();

    // 360 Bridge 2: HR to Finance (Payroll Synchronization)
    // Create an "Egreso" transaction for the team member's cost on this project
    const [teamMember] = await db.select().from(team).where(eq(team.id, assignment.teamMemberId)).limit(1);
    const [project] = await db.select().from(projects).where(eq(projects.id, assignment.projectId)).limit(1);

    if (teamMember && project && teamMember.internalCostHour && assignment.allocatedHours) {
      const costPerHour = parseFloat(teamMember.internalCostHour);
      const totalCost = costPerHour * assignment.allocatedHours;

      if (totalCost > 0) {
        await db.insert(transactions).values({
          type: "Gasto",
          category: "Nómina",
          amount: totalCost.toString(),
          date: new Date(),
          isPaid: false, // Starts as pending payroll
          projectId: assignment.projectId,
          clientId: project.clientId,
          source: "team_assignment",
          sourceId: newAssignment.id,
          description: `Costo Nómina: ${teamMember.firstName} ${teamMember.lastName} en ${project.name}`,
          notes: `${assignment.allocatedHours} horas asignadas a $${costPerHour}/hr`
        });
      }
    }

    return newAssignment;
  }

  async updateProjectTeamAssignment(id: number, assignment: UpdateProjectTeamAssignment): Promise<ProjectTeamAssignment | undefined> {
    const existingAssignment = await db.select().from(projectTeamAssignments).where(eq(projectTeamAssignments.id, id)).limit(1).then(res => res[0]);

    const [updated] = await db.update(projectTeamAssignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(projectTeamAssignments.id, id))
      .returning();

    // 360 Bridge 2: HR to Finance (Update Payroll Sync)
    if (updated && existingAssignment && assignment.allocatedHours !== undefined && assignment.allocatedHours !== existingAssignment.allocatedHours) {
      const [teamMember] = await db.select().from(team).where(eq(team.id, updated.teamMemberId)).limit(1);
      if (teamMember && teamMember.internalCostHour && updated.allocatedHours !== null) {
        const costPerHour = parseFloat(teamMember.internalCostHour);
        const newTotalCost = costPerHour * updated.allocatedHours;

        await db.update(transactions)
          .set({
            amount: newTotalCost.toString(),
            notes: `${updated.allocatedHours} horas asignadas a $${costPerHour}/hr`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(transactions.source, "team_assignment"),
              eq(transactions.sourceId, updated.id),
              eq(transactions.isPaid, false) // Only update if not already paid
            )
          );
      }
    }

    return updated;
  }

  async deleteProjectTeamAssignment(id: number): Promise<boolean> {
    const [assignment] = await db.select().from(projectTeamAssignments).where(eq(projectTeamAssignments.id, id)).limit(1);
    if (!assignment) return false;

    // 360 Bridge 2: HR to Finance (Cancel Payroll Sync if unpaid)
    await db.delete(transactions).where(
      and(
        eq(transactions.source, "team_assignment"),
        eq(transactions.sourceId, id),
        eq(transactions.isPaid, false) // Only delete if not already hit the books
      )
    );

    await db.delete(projectTeamAssignments).where(eq(projectTeamAssignments.id, id));
    return true;
  }

  async getTeamMemberPerformance(teamMemberId: number): Promise<{ revenueGenerated: number; projectsCount: number; hoursLogged: number }> {
    const assignments = await db.select().from(projectTeamAssignments)
      .where(eq(projectTeamAssignments.teamMemberId, teamMemberId));

    let revenueGenerated = 0;
    let hoursLogged = 0;
    const projectIds = new Set<number>();

    for (const assignment of assignments) {
      revenueGenerated += Number(assignment.revenueAttributed) || 0;
      hoursLogged += Number(assignment.loggedHours) || 0;
      projectIds.add(assignment.projectId);
    }

    return {
      revenueGenerated,
      projectsCount: projectIds.size,
      hoursLogged,
    };
  }

  // ===========================================
  // 📋 AUDIT LOGS
  // ===========================================

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [entry] = await db.insert(auditLogs).values(log).returning();
    return entry;
  }

  async getAuditLogs(options?: { limit?: number; userId?: string; entityType?: string }): Promise<AuditLog[]> {
    const limit = options?.limit || 100;
    const conditions = [];

    if (options?.userId) {
      conditions.push(eq(auditLogs.userId, options.userId));
    }
    if (options?.entityType) {
      conditions.push(eq(auditLogs.entityType, options.entityType));
    }

    if (conditions.length > 0) {
      return db.select().from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit);
    }

    return db.select().from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }
}

export const storage = new DBStorage();
