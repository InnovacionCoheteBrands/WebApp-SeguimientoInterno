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
  type AgencyRole,
  type InsertAgencyRole,
  type UpdateAgencyRole,
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
  createUser(user: InsertUser): Promise<User>;
  updateUserSettings(userId: string, settings: any): Promise<User>;
  /** @deprecated Feature not implemented. Kept for backward compatibility. */
  updateUserWebhook(userId: string, webhookUrl: string): Promise<User>;
  regenerateApiKey(userId: string): Promise<string>;

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
  getClientAccountByCampaignId(campaignId: number): Promise<ClientAccount | undefined>;
  createClientAccount(account: InsertClientAccount): Promise<ClientAccount>;
  updateClientAccount(campaignId: number, account: Partial<InsertClientAccount>): Promise<ClientAccount | undefined>;
  deleteClientAccount(campaignId: number): Promise<boolean>;

  getTeam(): Promise<Team[]>;
  getTeamById(id: number): Promise<Team | undefined>;
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

  getAdCreatives(): Promise<AdCreative[]>;
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


  // Projects Management
  getProjects(): Promise<(Project & { client: ClientAccount })[]>;
  getProjectById(id: number): Promise<(Project & { client: ClientAccount; deliverables: ProjectDeliverable[] }) | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: UpdateProject): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  calculateProjectProgress(projectId: number): Promise<number>;

  // Project Deliverables
  getProjectDeliverables(projectId: number): Promise<ProjectDeliverable[]>;
  createProjectDeliverable(deliverable: InsertProjectDeliverable): Promise<ProjectDeliverable>;
  updateProjectDeliverable(id: number, deliverable: UpdateProjectDeliverable): Promise<ProjectDeliverable | undefined>;
  deleteProjectDeliverable(id: number): Promise<boolean>;

  // Project Attachments
  getProjectAttachments(projectId: number): Promise<ProjectAttachment[]>;
  createProjectAttachment(attachment: InsertProjectAttachment): Promise<ProjectAttachment>;
  deleteProjectAttachment(id: number): Promise<boolean>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserSettings(userId: string, settings: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ settings: JSON.stringify(settings) })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  /**
   * @deprecated Feature not implemented. Kept for backward compatibility.
   * TODO: Either implement webhook sender functionality or remove this method entirely.
   */
  async updateUserWebhook(userId: string, webhookUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ webhookUrl })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async regenerateApiKey(userId: string): Promise<string> {
    const newKey = "sk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await db
      .update(users)
      .set({ apiKey: newKey })
      .where(eq(users.id, userId));
    return newKey;
  }

  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaignById(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: UpdateCampaign): Promise<Campaign | undefined> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return (result as any).count > 0;
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
    const [newMetric] = await db.insert(systemMetrics).values(metric).returning();
    return newMetric;
  }

  async getTelemetryData(limit: number = 24): Promise<TelemetryData[]> {
    return await db
      .select()
      .from(telemetryData)
      .orderBy(desc(telemetryData.timestamp))
      .limit(limit);
  }

  async createTelemetryData(data: InsertTelemetryData): Promise<TelemetryData> {
    const [newData] = await db.insert(telemetryData).values(data).returning();
    return newData;
  }

  async cleanupOldTelemetry(keepLast: number): Promise<void> {
    await db.execute(sql`
      WITH keep AS (
        SELECT id FROM ${telemetryData}
        ORDER BY timestamp DESC, id DESC
        LIMIT ${keepLast}
      )
      DELETE FROM ${telemetryData}
      WHERE id NOT IN (SELECT id FROM keep)
    `);
  }

  async cleanupOldMetrics(keepLast: number): Promise<void> {
    await db.execute(sql`
      WITH keep AS (
        SELECT id FROM ${systemMetrics}
        ORDER BY timestamp DESC, id DESC
        LIMIT ${keepLast}
      )
      DELETE FROM ${systemMetrics}
      WHERE id NOT IN (SELECT id FROM keep)
    `);
  }

  async getClientAccounts(): Promise<ClientAccount[]> {
    return await db
      .select()
      .from(clientAccounts)
      .orderBy(desc(clientAccounts.timestamp));
  }

  async getClientAccountByCampaignId(campaignId: number): Promise<ClientAccount | undefined> {
    const [account] = await db
      .select()
      .from(clientAccounts)
      .where(eq(clientAccounts.campaignId, campaignId))
      .orderBy(desc(clientAccounts.timestamp))
      .limit(1);
    return account;
  }

  async createClientAccount(account: InsertClientAccount): Promise<ClientAccount> {
    const [newAccount] = await db.insert(clientAccounts).values(account).returning();
    return newAccount;
  }

  async updateClientAccount(campaignId: number, account: Partial<InsertClientAccount>): Promise<ClientAccount | undefined> {
    const existing = await this.getClientAccountByCampaignId(campaignId);
    if (!existing) return undefined;

    const [updated] = await db
      .update(clientAccounts)
      .set({ ...account, timestamp: new Date() })
      .where(eq(clientAccounts.id, existing.id))
      .returning();
    return updated;
  }

  async deleteClientAccount(campaignId: number): Promise<boolean> {
    const result = await db.delete(clientAccounts).where(eq(clientAccounts.campaignId, campaignId));
    return (result as any).count > 0;
  }

  async getTeam(): Promise<Team[]> {
    return await db.select().from(team).orderBy(desc(team.createdAt));
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    const [person] = await db.select().from(team).where(eq(team.id, id));
    return person;
  }

  async createTeam(person: InsertTeam): Promise<Team> {
    const [newPerson] = await db.insert(team).values(person).returning();
    return newPerson;
  }

  async updateTeam(id: number, person: UpdateTeam): Promise<Team | undefined> {
    const [updated] = await db
      .update(team)
      .set(person)
      .where(eq(team.id, id))
      .returning();
    return updated;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(team).where(eq(team.id, id));
    return (result as any).count > 0;
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
    const [newAssignment] = await db.insert(teamAssignments).values(assignment).returning();
    return newAssignment;
  }

  async deleteTeamAssignment(id: number): Promise<boolean> {
    const result = await db.delete(teamAssignments).where(eq(teamAssignments.id, id));
    return (result as any).count > 0;
  }

  async getResources(): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .orderBy(desc(resources.createdAt));
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set(resource)
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    const result = await db.delete(resources).where(eq(resources.id, id));
    return (result as any).count > 0;
  }

  async cleanupOldResources(keepLast: number): Promise<void> {
    await db.execute(sql`
      WITH keep AS (
        SELECT id FROM ${resources}
        ORDER BY created_at DESC, id DESC
        LIMIT ${keepLast}
      )
      DELETE FROM ${resources}
      WHERE id NOT IN (SELECT id FROM keep)
    `);
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
    const [newRole] = await db.insert(agencyRoleCatalog).values(role).returning();
    return newRole;
  }

  async updateAgencyRole(id: number, role: UpdateAgencyRole): Promise<AgencyRole | undefined> {
    const [updated] = await db
      .update(agencyRoleCatalog)
      .set(role)
      .where(eq(agencyRoleCatalog.id, id))
      .returning();
    return updated;
  }

  async deleteAgencyRole(id: number): Promise<boolean> {
    const result = await db.delete(agencyRoleCatalog).where(eq(agencyRoleCatalog.id, id));
    return (result as any).count > 0;
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
    const [newPlatform] = await db.insert(adPlatforms).values(platform).returning();
    return newPlatform;
  }

  async updateAdPlatform(id: number, platform: Partial<InsertAdPlatform>): Promise<AdPlatform | undefined> {
    const [updated] = await db
      .update(adPlatforms)
      .set(platform)
      .where(eq(adPlatforms.id, id))
      .returning();
    return updated;
  }

  async deleteAdPlatform(id: number): Promise<boolean> {
    const result = await db.delete(adPlatforms).where(eq(adPlatforms.id, id));
    return (result as any).count > 0;
  }

  async getAdCreatives(): Promise<AdCreative[]> {
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
    const [newCreative] = await db.insert(adCreatives).values(creative).returning();
    return newCreative;
  }

  async updateAdCreative(id: number, creative: UpdateAdCreative): Promise<AdCreative | undefined> {
    const [updated] = await db
      .update(adCreatives)
      .set({ ...creative, updatedAt: new Date() })
      .where(eq(adCreatives.id, id))
      .returning();
    return updated;
  }

  async deleteAdCreative(id: number): Promise<boolean> {
    const result = await db.delete(adCreatives).where(eq(adCreatives.id, id));
    return (result as any).count > 0;
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
    const [newMetric] = await db.insert(adMetrics).values(metric).returning();
    return newMetric;
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
    const [newConnection] = await db.insert(platformConnections).values(connection).returning();
    return newConnection;
  }

  async updatePlatformConnection(id: number, connection: UpdatePlatformConnection): Promise<PlatformConnection | undefined> {
    const [updated] = await db
      .update(platformConnections)
      .set({ ...connection, updatedAt: new Date() })
      .where(eq(platformConnections.id, id))
      .returning();
    return updated;
  }

  async deletePlatformConnection(id: number): Promise<boolean> {
    const result = await db.delete(platformConnections).where(eq(platformConnections.id, id));
    return (result as any).count > 0;
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
    const [newMapping] = await db.insert(accountMappings).values(mapping).returning();
    return newMapping;
  }

  async updateAccountMapping(id: number, mapping: UpdateAccountMapping): Promise<AccountMapping | undefined> {
    const [updated] = await db
      .update(accountMappings)
      .set({ ...mapping, updatedAt: new Date() })
      .where(eq(accountMappings.id, id))
      .returning();
    return updated;
  }

  async deleteAccountMapping(id: number): Promise<boolean> {
    const result = await db.delete(accountMappings).where(eq(accountMappings.id, id));
    return (result as any).count > 0;
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
    const [newConfig] = await db.insert(clientKpiConfig).values(config).returning();
    return newConfig;
  }

  async updateClientKpiConfig(clientName: string, config: UpdateClientKpiConfig): Promise<ClientKpiConfig | undefined> {
    const [updated] = await db
      .update(clientKpiConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(clientKpiConfig.clientName, clientName))
      .returning();
    return updated;
  }

  async deleteClientKpiConfig(clientName: string): Promise<boolean> {
    const result = await db.delete(clientKpiConfig).where(eq(clientKpiConfig.clientName, clientName));
    return (result as any).count > 0;
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
  }

  async updateTransaction(id: number, transaction: UpdateTransaction): Promise<Transaction | undefined> {
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
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return (result as any).count > 0;
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
      WHERE date >= ${start} AND date <= ${end}
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
    const [newRecurring] = await db.insert(recurringTransactions).values(recurring).returning();
    return newRecurring;
  }

  async updateRecurringTransaction(id: number, recurring: UpdateRecurringTransaction): Promise<RecurringTransaction | undefined> {
    const [updated] = await db
      .update(recurringTransactions)
      .set({ ...recurring, updatedAt: new Date() })
      .where(eq(recurringTransactions.id, id))
      .returning();
    return updated;
  }

  async deleteRecurringTransaction(id: number): Promise<boolean> {
    const result = await db.delete(recurringTransactions).where(eq(recurringTransactions.id, id));
    return (result as any).count > 0;
  }

  // Execute a single recurring transaction manually
  async executeRecurringTransaction(id: number): Promise<Transaction> {
    const recurring = await this.getRecurringTransactionById(id);
    if (!recurring) throw new Error("Recurring transaction not found");

    // Create transaction from template using new schema fields
    const executionDate = new Date();
    const transaction = await this.createTransaction({
      type: recurring.type,
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
    const template = await this.getRecurringTransactionById(templateId);
    if (!template) throw new Error("Recurring template not found");

    // Create actual transaction linked to template
    const transaction = await this.createTransaction({
      type: template.type,
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
  }

  // Projects Management implementation
  async getProjects(): Promise<(Project & { client: ClientAccount })[]> {
    const result = await db.execute(sql`
      SELECT 
        p.*,
        json_build_object(
          'id', c.id,
          'campaignId', c.campaign_id,
          'companyName', c.company_name,
          'industry', c.industry,
          'monthlyBudget', c.monthly_budget,
          'currentSpend', c.current_spend,
          'healthScore', c.health_score,
          'nextMilestone', c.next_milestone,
          'lastContact', c.last_contact,
          'status', c.status,
          'timestamp', c.timestamp
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
          'campaignId', c.campaign_id,
          'companyName', c.company_name,
          'industry', c.industry,
          'monthlyBudget', c.monthly_budget,
          'currentSpend', c.current_spend,
          'healthScore', c.health_score,
          'nextMilestone', c.next_milestone,
          'lastContact', c.last_contact,
          'status', c.status,
          'timestamp', c.timestamp
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
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, project: UpdateProject): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result as unknown as PostgresResult).count > 0;
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

  // Project Deliverables implementation
  async getProjectDeliverables(projectId: number): Promise<ProjectDeliverable[]> {
    return await db
      .select()
      .from(projectDeliverables)
      .where(eq(projectDeliverables.projectId, projectId))
      .orderBy(projectDeliverables.order);
  }

  async createProjectDeliverable(deliverable: InsertProjectDeliverable): Promise<ProjectDeliverable> {
    const [newDeliverable] = await db.insert(projectDeliverables).values(deliverable).returning();

    // Recalculate project progress
    await this.calculateProjectProgress(deliverable.projectId);

    return newDeliverable;
  }

  async updateProjectDeliverable(id: number, deliverable: UpdateProjectDeliverable): Promise<ProjectDeliverable | undefined> {
    const [updated] = await db
      .update(projectDeliverables)
      .set({ ...deliverable, updatedAt: new Date() })
      .where(eq(projectDeliverables.id, id))
      .returning();

    // Recalculate project progress if this deliverable was updated
    if (updated) {
      await this.calculateProjectProgress(updated.projectId);
    }

    return updated;
  }

  async deleteProjectDeliverable(id: number): Promise<boolean> {
    // Get the deliverable to know which project to update
    const [deliverable] = await db
      .select()
      .from(projectDeliverables)
      .where(eq(projectDeliverables.id, id));

    const result = await db.delete(projectDeliverables).where(eq(projectDeliverables.id, id));

    // Recalculate project progress after deletion
    if ((result as unknown as PostgresResult).count && (result as unknown as PostgresResult).count > 0 && deliverable) {
      await this.calculateProjectProgress(deliverable.projectId);
    }

    return (result as unknown as PostgresResult).count > 0;
  }

  // Project Attachments implementation
  async getProjectAttachments(projectId: number): Promise<ProjectAttachment[]> {
    return await db
      .select()
      .from(projectAttachments)
      .where(eq(projectAttachments.projectId, projectId))
      .orderBy(desc(projectAttachments.createdAt));
  }

  async createProjectAttachment(attachment: InsertProjectAttachment): Promise<ProjectAttachment> {
    const [newAttachment] = await db.insert(projectAttachments).values(attachment).returning();
    return newAttachment;
  }

  async deleteProjectAttachment(id: number): Promise<boolean> {
    const result = await db.delete(projectAttachments).where(eq(projectAttachments.id, id));
    return (result as unknown as PostgresResult).count > 0;
  }
}

export const storage = new DBStorage();
