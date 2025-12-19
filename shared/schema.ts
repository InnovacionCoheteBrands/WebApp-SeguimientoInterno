import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, numeric, boolean } from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(),
  // Settings & Integrations
  settings: text("settings").default("{}"), // JSON string for preferences
  apiKey: text("api_key"),
  /** @deprecated Feature not implemented. Kept for backward compatibility. Consider removing in future version. */
  webhookUrl: text("webhook_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  campaignCode: text("campaign_code").notNull().unique(),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("Planning"),
  progress: integer("progress").notNull().default(0),
  priority: text("priority").notNull().default("Medium"),
  budget: integer("budget").notNull().default(0),
  spend: integer("spend").notNull().default(0),
  targetAudience: text("target_audience"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCampaignSchema = insertCampaignSchema.partial();

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type UpdateCampaign = z.infer<typeof updateCampaignSchema>;

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(),
  value: text("value").notNull(),
  label: text("label").notNull(),
  trend: text("trend"),
  trendLabel: text("trend_label"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;

export const telemetryData = pgTable("telemetry_data", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: integer("value").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertTelemetryDataSchema = createInsertSchema(telemetryData).omit({
  id: true,
  timestamp: true,
});

export type TelemetryData = typeof telemetryData.$inferSelect;
export type InsertTelemetryData = z.infer<typeof insertTelemetryDataSchema>;

export const clientAccounts = pgTable("client_accounts", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  monthlyBudget: integer("monthly_budget").notNull(),
  currentSpend: integer("current_spend").notNull().default(0),
  healthScore: integer("health_score").notNull().default(100),
  nextMilestone: text("next_milestone"),
  lastContact: timestamp("last_contact").defaultNow().notNull(),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientAccountSchema = createInsertSchema(clientAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateClientAccountSchema = insertClientAccountSchema.partial();

export type ClientAccount = typeof clientAccounts.$inferSelect;
export type InsertClientAccount = z.infer<typeof insertClientAccountSchema>;
export type UpdateClientAccount = z.infer<typeof updateClientAccountSchema>;

export const team = pgTable("team", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  status: text("status").notNull().default("Available"),
  avatarUrl: text("avatar_url"),
  workHoursStart: text("work_hours_start").notNull(),
  workHoursEnd: text("work_hours_end").notNull(),
  internalCostHour: numeric("internal_cost_hour").default("0"),
  billableRate: numeric("billable_rate").default("0"),
  monthlySalary: numeric("monthly_salary").default("0"),
  weeklyCapacity: integer("weekly_capacity").default(40),
  roleCatalogId: integer("role_catalog_id"), // FK to agency_role_catalog (added below, circular dependency handled by drizzle usually or just integer)
  skills: text("skills"), // JSON string or comma-separated
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeamSchema = createInsertSchema(team).omit({
  id: true,
  createdAt: true,
});

export const updateTeamSchema = insertTeamSchema.partial();

export type Team = typeof team.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type UpdateTeam = z.infer<typeof updateTeamSchema>;

export const teamAssignments = pgTable("team_assignments", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }), // Made nullable to allow project-only assignments
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  hoursAllocated: integer("hours_allocated").default(0),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const insertTeamAssignmentSchema = createInsertSchema(teamAssignments).omit({
  id: true,
  assignedAt: true,
});

export type TeamAssignment = typeof teamAssignments.$inferSelect;
export type InsertTeamAssignment = z.infer<typeof insertTeamAssignmentSchema>;

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  format: text("format").notNull(),
  fileSize: numeric("file_size"),
  status: text("status").notNull(),
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  lastModified: text("last_modified"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

// Master Service Catalog
export const agencyRoleCatalog = pgTable("agency_role_catalog", {
  id: serial("id").primaryKey(),
  roleName: text("role_name").notNull(),
  department: text("department").notNull(), // Creative, Tech, Growth, etc.
  defaultBillableRate: numeric("default_billable_rate").notNull().default("0"),
  allowedActivities: text("allowed_activities"), // JSON string array ["Logo Design", "Coding"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgencyRoleSchema = createInsertSchema(agencyRoleCatalog).omit({
  id: true,
  createdAt: true,
});

export const updateAgencyRoleSchema = insertAgencyRoleSchema.partial();

export type AgencyRole = typeof agencyRoleCatalog.$inferSelect;
export type InsertAgencyRole = z.infer<typeof insertAgencyRoleSchema>;
export type UpdateAgencyRole = z.infer<typeof updateAgencyRoleSchema>;

// Ads Command Center Tables
export const adPlatforms = pgTable("ad_platforms", {
  id: serial("id").primaryKey(),
  platformName: text("platform_name").notNull().unique(), // Meta, Google, LinkedIn, TikTok
  displayName: text("display_name").notNull(),
  apiCredentials: text("api_credentials"), // Encrypted JSON credentials
  webhookUrl: text("webhook_url"),
  isActive: text("is_active").notNull().default("true"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdPlatformSchema = createInsertSchema(adPlatforms).omit({
  id: true,
  createdAt: true,
});

export type AdPlatform = typeof adPlatforms.$inferSelect;
export type InsertAdPlatform = z.infer<typeof insertAdPlatformSchema>;

export const adCreatives = pgTable("ad_creatives", {
  id: serial("id").primaryKey(),
  platformId: integer("platform_id").notNull().references(() => adPlatforms.id, { onDelete: "cascade" }),
  platformAdId: text("platform_ad_id").notNull(), // External ad ID from platform
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  creativeType: text("creative_type").notNull(), // image, video, carousel
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  headline: text("headline"),
  primaryText: text("primary_text"),
  ctaText: text("cta_text"),
  status: text("status").notNull().default("active"), // active, paused, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdCreativeSchema = createInsertSchema(adCreatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAdCreativeSchema = insertAdCreativeSchema.partial();

export type AdCreative = typeof adCreatives.$inferSelect;
export type InsertAdCreative = z.infer<typeof insertAdCreativeSchema>;
export type UpdateAdCreative = z.infer<typeof updateAdCreativeSchema>;

export const adMetrics = pgTable("ad_metrics", {
  id: serial("id").primaryKey(),
  creativeId: integer("creative_id").notNull().references(() => adCreatives.id, { onDelete: "cascade" }),
  platformId: integer("platform_id").notNull().references(() => adPlatforms.id, { onDelete: "cascade" }),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  spend: numeric("spend", { precision: 12, scale: 2 }).notNull().default("0"),
  revenue: numeric("revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  ctr: numeric("ctr", { precision: 5, scale: 2 }), // Click-through rate
  cpa: numeric("cpa", { precision: 12, scale: 2 }), // Cost per acquisition
  roas: numeric("roas", { precision: 5, scale: 2 }), // Return on ad spend
  metricDate: timestamp("metric_date").notNull().defaultNow(),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});

export const insertAdMetricSchema = createInsertSchema(adMetrics).omit({
  id: true,
  syncedAt: true,
});

export type AdMetric = typeof adMetrics.$inferSelect;
export type InsertAdMetric = z.infer<typeof insertAdMetricSchema>;

// Platform Connections (OAuth or API Key)
export const platformConnections = pgTable("platform_connections", {
  id: serial("id").primaryKey(),
  platformId: integer("platform_id").notNull().references(() => adPlatforms.id, { onDelete: "cascade" }),
  connectionType: text("connection_type").notNull().default("oauth"), // "oauth" or "api_key"
  userId: text("user_id"), // Future: link to user who authorized

  // For both OAuth and API Key
  accessToken: text("access_token").notNull(), // OAuth token or API Key (encrypted)

  // OAuth-specific fields (optional for API Key)
  refreshToken: text("refresh_token"), // For OAuth token refresh
  tokenExpiresAt: timestamp("token_expires_at"), // When OAuth token expires
  scope: text("scope"), // OAuth scopes granted

  // API Key-specific fields (optional for OAuth)
  apiKeyName: text("api_key_name"), // Descriptive name for the API key
  apiSecret: text("api_secret"), // For platforms that use key+secret (encrypted)

  // Common fields
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlatformConnectionSchema = createInsertSchema(platformConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePlatformConnectionSchema = insertPlatformConnectionSchema.partial();

export type PlatformConnection = typeof platformConnections.$inferSelect;
export type InsertPlatformConnection = z.infer<typeof insertPlatformConnectionSchema>;
export type UpdatePlatformConnection = z.infer<typeof updatePlatformConnectionSchema>;

// Account Mappings (Ad Account to Internal Client)
export const accountMappings = pgTable("account_mappings", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").notNull().references(() => platformConnections.id, { onDelete: "cascade" }),
  platformAccountId: text("platform_account_id").notNull(), // External Ad Account ID
  platformAccountName: text("platform_account_name"), // Display name from platform
  internalClientId: integer("internal_client_id"), // Future: reference to clients table
  internalClientName: text("internal_client_name").notNull(), // For now, just text
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAccountMappingSchema = createInsertSchema(accountMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAccountMappingSchema = insertAccountMappingSchema.partial();

export type AccountMapping = typeof accountMappings.$inferSelect;
export type InsertAccountMapping = z.infer<typeof insertAccountMappingSchema>;
export type UpdateAccountMapping = z.infer<typeof updateAccountMappingSchema>;

// Client KPI Configuration
export const clientKpiConfig = pgTable("client_kpi_config", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull().unique(), // Keyed by client name for now
  targetROAS: numeric("target_roas", { precision: 5, scale: 2 }), // e.g., 4.00
  targetCPA: numeric("target_cpa", { precision: 12, scale: 2 }), // e.g., 15.00
  monthlyBudgetCap: numeric("monthly_budget_cap", { precision: 12, scale: 2 }), // e.g., 50000.00
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientKpiConfigSchema = createInsertSchema(clientKpiConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateClientKpiConfigSchema = insertClientKpiConfigSchema.partial();

export type ClientKpiConfig = typeof clientKpiConfig.$inferSelect;
export type InsertClientKpiConfig = z.infer<typeof insertClientKpiConfigSchema>;
export type UpdateClientKpiConfig = z.infer<typeof updateClientKpiConfigSchema>;

// Financial Hub - Transactions Table
// ✅ Strict Categories
export const INCOME_CATEGORIES = [
  "Iguala",
  "Iguala 360",
  "Desarrollo de Branding",
  "Página Web",
  "Plataforma de comunicación",
  "Proyecto full",
  "Pauta",
  "Proyectos impresos",
  "Instalaciones",
] as const;

export const EXPENSE_CATEGORIES = [
  "Limpieza",
  "Mantenimiento Equipos",
  "Nómina",
  "Dispersión",
  "Viáticos",
  "Pautas",
  "Eventos",
  "Artículos de limpieza/cafetería",
  "Impresos",
  "Software",
  "CFE",
  "Internet",
  "Celulares",
  "Renta",
  "Uber",
  "Combustible",
] as const;

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES] as const;

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "Ingreso" or "Gasto" (Mapped to Egreso in UI)
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(), // This is the TOTAL
  date: timestamp("date").notNull(),

  // ✅ Fiscal Fields
  rfc: text("rfc"),
  invoiceNumber: text("invoice_number"),
  provider: text("provider"), // Only for Egresos
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }),
  iva: numeric("iva", { precision: 12, scale: 2 }),
  notes: text("notes"),

  // ✅ Payment Status Control (replaces old "status")
  isPaid: boolean("is_paid").notNull().default(false),
  paidDate: timestamp("paid_date"), // Actual payment/collection date

  // ✅ Client Assignment for Profitability Tracking
  clientId: integer("client_id").references(() => clientAccounts.id, { onDelete: "set null" }),

  // ✅ Recurring Template Linkage
  isRecurringInstance: boolean("is_recurring_instance").notNull().default(false),
  recurringTemplateId: integer("recurring_template_id").references(() => recurringTransactions.id, { onDelete: "set null" }),

  // ✅ Transaction Origin Tracking (Centralization)
  source: text("source"), // "manual", "client_project", "recurring_template"
  sourceId: integer("source_id"), // Reference to project or other entity

  // Legacy/Optional fields (marked for deprecation)
  status: text("status").default("Pendiente"), // ⚠️ Deprecated: use isPaid instead. Kept for backward compatibility
  description: text("description"), // Mapped to Concepto
  relatedClient: text("related_client"), // ⚠️ Deprecated: use clientId instead

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(),
  paidDate: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTransactionSchema = insertTransactionSchema.partial();

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;

// Financial Hub - Recurring Transactions (Templates)
export const recurringTransactions = pgTable("recurring_transactions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Template name
  description: text("description"), // Concepto validation default
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

  // ✅ Fiscal Fields for Templates
  rfc: text("rfc"),
  provider: text("provider"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }),
  iva: numeric("iva", { precision: 12, scale: 2 }),
  notes: text("notes"),
  frequency: text("frequency").notNull(), // "monthly", "weekly", "biweekly", "quarterly", "yearly"
  dayOfMonth: integer("day_of_month"), // For monthly: 1-31, null for other frequencies
  dayOfWeek: integer("day_of_week"), // For weekly: 0-6 (0=Sunday), null for other frequencies

  // ✅ Client Assignment for Retainers/Igualas
  clientId: integer("client_id").references(() => clientAccounts.id, { onDelete: "set null" }),


  isActive: boolean("is_active").notNull().default(true),
  nextExecutionDate: timestamp("next_execution_date").notNull(),
  lastExecutionDate: timestamp("last_execution_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRecurringTransactionSchema = createInsertSchema(recurringTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRecurringTransactionSchema = insertRecurringTransactionSchema.partial();

export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type InsertRecurringTransaction = z.infer<typeof insertRecurringTransactionSchema>;
export type UpdateRecurringTransaction = z.infer<typeof updateRecurringTransactionSchema>;

// Projects Management Module
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientAccounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(), // "SEO", "Web", "Ads", "General"
  status: text("status").notNull().default("Planificación"), // "Planificación", "En Curso", "En Revisión", "Bloqueado", "Completado"
  health: text("health").notNull().default("green"), // "green", "yellow", "red"
  deadline: timestamp("deadline"),
  progress: integer("progress").notNull().default(0), // Calculated from deliverables
  budget: numeric("budget").default("0"), // Project budget for profitability calculations
  serviceSpecificFields: text("service_specific_fields"), // JSON string for dynamic fields
  customFields: text("custom_fields"), // JSON string for user-defined fields
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects, {
  deadline: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectSchema = insertProjectSchema.partial();

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

// Project Attachments (defined before deliverables due to foreign key reference)
export const projectAttachments = pgTable("project_attachments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"), // in bytes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectAttachmentSchema = createInsertSchema(projectAttachments).omit({
  id: true,
  createdAt: true,
});

export type ProjectAttachment = typeof projectAttachments.$inferSelect;
export type InsertProjectAttachment = z.infer<typeof insertProjectAttachmentSchema>;

// Project Deliverables (Tasks/Milestones)
export const projectDeliverables = pgTable("project_deliverables", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),
  dueDate: timestamp("due_date"),
  // File requirement fields for blocking workflow
  requiresFile: boolean("requires_file").notNull().default(false),
  linkedAttachmentId: integer("linked_attachment_id").references(() => projectAttachments.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectDeliverableSchema = createInsertSchema(projectDeliverables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectDeliverableSchema = insertProjectDeliverableSchema.partial();

export type ProjectDeliverable = typeof projectDeliverables.$inferSelect;
export type InsertProjectDeliverable = z.infer<typeof insertProjectDeliverableSchema>;
export type UpdateProjectDeliverable = z.infer<typeof updateProjectDeliverableSchema>;


