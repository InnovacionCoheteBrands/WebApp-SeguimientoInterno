import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, numeric, boolean, json } from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===========================================
// 🛡️ SECURITY UTILITIES
// ===========================================

/**
 * Escape HTML entities to prevent XSS attacks.
 * Converts dangerous characters to their HTML entity equivalents.
 */
const escapeHtml = (value: string): string => {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return value.replace(/[&<>"'`=\/]/g, (char) => htmlEntities[char] || char);
};

/**
 * Sanitize user input to prevent XSS attacks.
 * First escapes HTML entities, then removes any remaining dangerous patterns.
 */
const sanitizeString = (value: string): string => {
  if (!value || typeof value !== 'string') return value;

  // Step 1: Escape all HTML entities first (primary defense)
  let sanitized = escapeHtml(value);

  // Step 2: Remove any remaining dangerous patterns as secondary defense
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<img[^>]*onerror[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<iframe[^>]*>/gi, '')
    .replace(/<object[^>]*>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim();

  return sanitized;
};

/**
 * Safe string schema with XSS protection and required validation.
 * Use for mandatory fields that cannot be empty.
 */
const safeString = (maxLength: number = 500) =>
  z.string()
    .min(1, "Este campo es requerido")
    .max(maxLength, `Máximo ${maxLength} caracteres`)
    .transform(sanitizeString);

/**
 * Safe legacy string schema - allows empty strings for auto-generated fields
 * Use for fields like 'name' that are auto-generated from other fields
 */
const safeLegacyString = (maxLength: number = 500) =>
  z.string()
    .max(maxLength, `Máximo ${maxLength} caracteres`)
    .transform(sanitizeString)
    .default("");

/**
 * Safe optional string schema with XSS protection
 */
const safeOptionalString = (maxLength: number = 500) =>
  z.string()
    .max(maxLength, `Máximo ${maxLength} caracteres`)
    .transform(sanitizeString)
    .optional()
    .nullable();

/**
 * Positive number coercion - accepts strings or numbers, rejects negative values.
 * Returns validation error if value is negative (does not silently convert).
 */
const positiveNumericString = () =>
  z.union([z.string(), z.number()])
    .refine((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) || num >= 0;
    }, { message: "El valor no puede ser negativo" })
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? "0" : num.toFixed(2);
    });

/**
 * Optional positive number coercion - rejects negative values with validation error.
 */
const optionalPositiveNumericString = () =>
  z.union([z.string(), z.number(), z.null(), z.undefined()])
    .refine((val) => {
      if (val === null || val === undefined || val === '') return true;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) || num >= 0;
    }, { message: "El valor no puede ser negativo" })
    .transform((val) => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num.toFixed(2);
    })
    .optional();

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
  role: true,
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

export const insertCampaignSchema = createInsertSchema(campaigns, {
  // 🛡️ XSS Protection for text fields
  campaignCode: safeString(50),
  name: safeString(200),
  clientName: safeString(200),
  channel: safeString(100),
  status: safeString(50),
  priority: safeString(50),
  targetAudience: safeOptionalString(500),

  // 🔢 Positive number validation for financial/metric fields
  budget: z.coerce.number().int().min(0, "El presupuesto no puede ser negativo"),
  spend: z.coerce.number().int().min(0, "El gasto no puede ser negativo"),
  progress: z.coerce.number().int().min(0).max(100, "El progreso debe estar entre 0 y 100"),
}).omit({
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
  tradeName: text("trade_name"),  // Nombre comercial / Nombre de fantasía
  logoUrl: text("logo_url"),
  industry: text("industry").notNull(),
  sector: text("sector"),  // Giro específico del cliente
  companySize: text("company_size"),  // "Micro", "Pequeña", "Mediana", "Grande"
  leadOrigin: text("lead_origin"),  // Fuente: "Facebook", "Referido", "Google", etc.
  websiteUrl: text("website_url"),

  // Address composite fields
  addressStreet: text("address_street"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  addressZip: text("address_zip"),
  addressCountry: text("address_country").default("México"),

  // Existing financial/operational fields
  monthlyBudget: integer("monthly_budget").notNull(),
  currentSpend: integer("current_spend").notNull().default(0),
  healthScore: integer("health_score").notNull().default(100),
  nextMilestone: text("next_milestone"),
  lastContact: timestamp("last_contact").defaultNow().notNull(),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientAccountSchema = createInsertSchema(clientAccounts, {
  // 🛡️ XSS Protection for text fields
  companyName: safeString(200),
  tradeName: safeOptionalString(200),
  logoUrl: safeOptionalString(500),
  industry: safeString(100),
  sector: safeOptionalString(100),
  companySize: safeOptionalString(50),
  leadOrigin: safeOptionalString(100),
  websiteUrl: safeOptionalString(500),

  // Address fields
  addressStreet: safeOptionalString(300),
  addressCity: safeOptionalString(100),
  addressState: safeOptionalString(100),
  addressZip: safeOptionalString(20),
  addressCountry: safeOptionalString(100),

  nextMilestone: safeOptionalString(300),
  status: safeString(50),

  // 🔢 Positive number validation for financial/metric fields
  monthlyBudget: z.coerce.number().int().min(0, "El presupuesto mensual no puede ser negativo"),
  currentSpend: z.coerce.number().int().min(0, "El gasto actual no puede ser negativo"),
  healthScore: z.coerce.number().int().min(0).max(100, "El health score debe estar entre 0 y 100"),

  // 📅 Date coercion
  lastContact: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateClientAccountSchema = insertClientAccountSchema.partial();

export type ClientAccount = typeof clientAccounts.$inferSelect;
export type InsertClientAccount = z.infer<typeof insertClientAccountSchema>;
export type UpdateClientAccount = z.infer<typeof updateClientAccountSchema>;

// ===========================================
// 📇 CONTACTS MODULE
// ===========================================

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientAccounts.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  mobile: text("mobile"),
  position: text("position"),  // Puesto

  // Notification Preferences
  notifyBilling: boolean("notify_billing").notNull().default(true),
  notifyPayments: boolean("notify_payments").notNull().default(true),
  notifyGeneral: boolean("notify_general").notNull().default(true),

  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contacts, {
  // 🛡️ XSS Protection
  firstName: safeString(100),
  lastName: safeString(100),
  email: z.string().email("Email inválido").max(200),
  phone: safeOptionalString(30),
  mobile: safeOptionalString(30),
  position: safeOptionalString(100),

  // 🔗 FK coercion
  clientId: z.coerce.number().int().positive("Se requiere un cliente válido"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateContactSchema = insertContactSchema.partial();

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type UpdateContact = z.infer<typeof updateContactSchema>;

// ===========================================
// 🧾 BILLING PROFILES MODULE
// ===========================================

export const billingProfiles = pgTable("billing_profiles", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientAccounts.id, { onDelete: "cascade" }),
  rfc: text("rfc").notNull(),  // RFC validation handled in schema
  businessName: text("business_name").notNull(),  // Razón Social
  cfdiUse: text("cfdi_use").notNull(),  // "G03 - Gastos en general", etc.
  taxRegime: text("tax_regime"),  // Régimen Fiscal

  // Fiscal Address
  fiscalStreet: text("fiscal_street"),
  fiscalCity: text("fiscal_city"),
  fiscalState: text("fiscal_state"),
  fiscalZip: text("fiscal_zip"),

  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBillingProfileSchema = createInsertSchema(billingProfiles, {
  // 🛡️ XSS Protection
  rfc: safeString(20),
  businessName: safeString(300),
  cfdiUse: safeString(100),
  taxRegime: safeOptionalString(100),
  fiscalStreet: safeOptionalString(300),
  fiscalCity: safeOptionalString(100),
  fiscalState: safeOptionalString(100),
  fiscalZip: safeOptionalString(10),

  // 🔗 FK coercion
  clientId: z.coerce.number().int().positive("Se requiere un cliente válido"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBillingProfileSchema = insertBillingProfileSchema.partial();

export type BillingProfile = typeof billingProfiles.$inferSelect;
export type InsertBillingProfile = z.infer<typeof insertBillingProfileSchema>;
export type UpdateBillingProfile = z.infer<typeof updateBillingProfileSchema>;

// ===========================================
// 🌐 DIGITAL ASSETS MODULE (D&H)
// ===========================================

export const digitalAssets = pgTable("digital_assets", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientAccounts.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(),  // "domain", "hosting", "ssl", "email"
  name: text("name").notNull(),  // e.g., "clientwebsite.com"
  provider: text("provider"),  // "GoDaddy", "Namecheap", etc.
  cost: numeric("cost", { precision: 12, scale: 2 }),
  renewalFrequency: text("renewal_frequency"),  // "yearly", "monthly", "biannual"
  expirationDate: timestamp("expiration_date"),
  lastRenewalDate: timestamp("last_renewal_date"),
  autoRenew: boolean("auto_renew").notNull().default(false),

  // Access/notes (encrypted in production)
  accessNotes: text("access_notes"),
  files: json("files").$type<{ name: string, url: string, type?: string, size?: number }[]>().default([]),

  // Alert configuration
  alertDaysBefore: integer("alert_days_before").default(30),
  assignedManagerId: integer("assigned_manager_id"),  // FK to team added later

  status: text("status").notNull().default("active"),  // "active", "expired", "transferred"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDigitalAssetSchema = createInsertSchema(digitalAssets, {
  // 🛡️ XSS Protection
  assetType: safeString(50),
  name: safeString(200),
  provider: safeOptionalString(100),
  renewalFrequency: safeOptionalString(50),
  accessNotes: safeOptionalString(2000),
  status: safeString(50),

  // 🔢 Number validation
  cost: optionalPositiveNumericString(),
  alertDaysBefore: z.coerce.number().int().min(1).max(365).default(30),

  // 🔗 FK coercion
  clientId: z.coerce.number().int().positive("Se requiere un cliente válido"),
  assignedManagerId: z.coerce.number().int().positive().optional().nullable(),
  files: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string().optional(),
    size: z.number().optional()
  })).optional().default([]),

  // 📅 Date coercion
  expirationDate: z.coerce.date().optional().nullable(),
  lastRenewalDate: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDigitalAssetSchema = insertDigitalAssetSchema.partial();

export type DigitalAsset = typeof digitalAssets.$inferSelect;
export type InsertDigitalAsset = z.infer<typeof insertDigitalAssetSchema>;
export type UpdateDigitalAsset = z.infer<typeof updateDigitalAssetSchema>;

// ===========================================
// 📁 CLIENT DOCUMENTS MODULE
// ===========================================

export const clientDocuments = pgTable("client_documents", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientAccounts.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),  // "acta_constitutiva", "csf", "contrato", "otro"
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertClientDocumentSchema = createInsertSchema(clientDocuments, {
  // 🛡️ XSS Protection
  documentType: safeString(50),
  name: safeString(200),
  fileUrl: safeString(500),
  mimeType: safeOptionalString(100),
  notes: safeOptionalString(500),

  // 🔢 Number validation
  fileSize: z.coerce.number().int().min(0).optional().nullable(),

  // 🔗 FK coercion
  clientId: z.coerce.number().int().positive("Se requiere un cliente válido"),
}).omit({
  id: true,
  uploadedAt: true,
});

export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = z.infer<typeof insertClientDocumentSchema>;

export const team = pgTable("team", {
  id: serial("id").primaryKey(),
  // Legacy field (kept for backward compatibility)
  name: text("name").notNull(),
  // New employee-focused fields
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  payrollType: text("payroll_type").default("Fija"), // "Fija" or "Variable"
  startDate: timestamp("start_date"),
  employeeStatus: text("employee_status").default("Activo"), // "Activo" or "Inactivo"
  notes: text("notes"),
  // Legacy agency fields (kept for backward compatibility, made optional)
  role: text("role").notNull().default(""),
  seniority: text("department").notNull().default("Junior"), // Mapped to existing 'department' column
  area: text("area"),
  status: text("status").notNull().default("Available"),
  avatarUrl: text("avatar_url"),
  workHoursStart: text("work_hours_start").default("09:00"),
  workHoursEnd: text("work_hours_end").default("18:00"),
  internalCostHour: numeric("internal_cost_hour").default("0"),
  billableRate: numeric("billable_rate").default("0"),
  monthlySalary: numeric("monthly_salary").default("0"),
  weeklyCapacity: integer("weekly_capacity").default(40),
  roleCatalogId: integer("role_catalog_id"),
  skills: text("skills"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeamSchema = createInsertSchema(team, {
  // New employee-focused fields (required for new flow)
  firstName: safeString(100),
  lastName: safeString(100),
  email: z.string().email("Email inválido").max(200),
  phone: safeOptionalString(50),
  payrollType: z.enum(["Fija", "Variable"]).default("Fija"),
  startDate: z.coerce.date().optional(),
  employeeStatus: z.enum(["Activo", "Inactivo"]).default("Activo"),
  notes: safeOptionalString(1000),

  // Legacy field (will be auto-generated from firstName + lastName if not provided)
  name: safeLegacyString(200),
  role: safeLegacyString(100),
  seniority: safeOptionalString(100).or(z.literal("")).transform(v => v || "Junior"),
  area: safeString(100).optional(),
  status: safeString(50).default("Available"),
  avatarUrl: safeOptionalString(100000), // Base64 images can be large
  workHoursStart: safeOptionalString(10).or(z.literal("")).transform(v => v || "09:00"),
  workHoursEnd: safeOptionalString(10).or(z.literal("")).transform(v => v || "18:00"),
  skills: safeOptionalString(500),

  // 🔢 Positive number coercion for financial fields
  internalCostHour: optionalPositiveNumericString(),
  billableRate: optionalPositiveNumericString(),
  monthlySalary: optionalPositiveNumericString(),

  // Integer coercion
  weeklyCapacity: z.coerce.number().int().min(0).max(168).default(40),
  // Integer coercion - handle null correctly BEFORE coercion
  roleCatalogId: z.preprocess(
    (val) => (val === null || val === "" ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
}).omit({
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

export const insertTeamAssignmentSchema = createInsertSchema(teamAssignments, {
  // 🔗 Integer coercion for FKs
  teamId: z.coerce.number().int().positive("Se requiere un miembro del equipo válido"),
  campaignId: z.coerce.number().int().positive().optional().nullable(),
  projectId: z.coerce.number().int().positive().optional().nullable(),

  // 🔢 Positive number validation for hours
  hoursAllocated: z.coerce.number().int().min(0, "Las horas no pueden ser negativas").default(0),
}).omit({
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

export const insertResourceSchema = createInsertSchema(resources, {
  // 🛡️ XSS Protection for text fields
  name: safeString(200),
  type: safeString(100),
  format: safeString(50),
  status: safeString(50),
  lastModified: safeOptionalString(100),

  // 🔢 Positive number validation
  fileSize: optionalPositiveNumericString(),

  // 🔗 Integer coercion for campaign FK
  campaignId: z.coerce.number().int().positive().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

// Master Service Catalog
export const agencyRoleCatalog = pgTable("agency_role_catalog", {
  id: serial("id").primaryKey(),
  roleName: text("role_name").notNull(),
  department: text("department").notNull(), // Renamed from department
  defaultBillableRate: numeric("default_billable_rate").notNull().default("0"),
  allowedActivities: text("allowed_activities"), // JSON string array ["Logo Design", "Coding"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgencyRoleSchema = createInsertSchema(agencyRoleCatalog, {
  // 🛡️ XSS Protection for text fields
  roleName: safeString(100),
  department: safeString(100),
  allowedActivities: safeOptionalString(2000), // JSON array needs space

  // 🔢 Positive number validation
  defaultBillableRate: positiveNumericString(),
}).omit({
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

export const insertAdPlatformSchema = createInsertSchema(adPlatforms, {
  // 🛡️ XSS Protection for text fields
  platformName: safeString(100),
  displayName: safeString(100),
  apiCredentials: safeOptionalString(2000), // Encrypted JSON
  webhookUrl: safeOptionalString(500),
  isActive: safeString(10),
}).omit({
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

export const insertAdCreativeSchema = createInsertSchema(adCreatives, {
  // 🛡️ XSS Protection for text fields
  platformAdId: safeString(200),
  creativeType: safeString(50),
  imageUrl: safeOptionalString(1000),
  videoUrl: safeOptionalString(1000),
  thumbnailUrl: safeOptionalString(1000),
  headline: safeOptionalString(200),
  primaryText: safeOptionalString(1000),
  ctaText: safeOptionalString(100),
  status: safeString(50),

  // 🔗 Integer coercion for FKs
  platformId: z.coerce.number().int().positive("Se requiere una plataforma válida"),
  campaignId: z.coerce.number().int().positive().optional().nullable(),
}).omit({
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

export const insertAdMetricSchema = createInsertSchema(adMetrics, {
  // 🔗 Integer coercion for FKs
  creativeId: z.coerce.number().int().positive("Se requiere un creativo válido"),
  platformId: z.coerce.number().int().positive("Se requiere una plataforma válida"),

  // 🔢 Positive number validation for metrics
  impressions: z.coerce.number().int().min(0).default(0),
  clicks: z.coerce.number().int().min(0).default(0),
  conversions: z.coerce.number().int().min(0).default(0),
  spend: positiveNumericString(),
  revenue: positiveNumericString(),
  ctr: optionalPositiveNumericString(),
  cpa: optionalPositiveNumericString(),
  roas: optionalPositiveNumericString(),

  // 📅 Date coercion
  metricDate: z.coerce.date(),
}).omit({
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

export const insertPlatformConnectionSchema = createInsertSchema(platformConnections, {
  // 🛡️ XSS Protection for text fields
  connectionType: safeString(50),
  userId: safeOptionalString(100),
  accessToken: safeString(2000), // Encrypted token
  refreshToken: safeOptionalString(2000),
  scope: safeOptionalString(500),
  apiKeyName: safeOptionalString(200),
  apiSecret: safeOptionalString(2000), // Encrypted

  // 🔗 Integer coercion for FKs
  platformId: z.coerce.number().int().positive("Se requiere una plataforma válida"),

  // 📅 Date coercion
  tokenExpiresAt: z.coerce.date().optional().nullable(),
  lastSyncAt: z.coerce.date().optional().nullable(),
}).omit({
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

export const insertAccountMappingSchema = createInsertSchema(accountMappings, {
  // 🛡️ XSS Protection for text fields
  platformAccountId: safeString(200),
  platformAccountName: safeOptionalString(200),
  internalClientName: safeString(200),

  // 🔗 Integer coercion for FKs
  connectionId: z.coerce.number().int().positive("Se requiere una conexión válida"),
  internalClientId: z.coerce.number().int().positive().optional().nullable(),
}).omit({
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

export const insertClientKpiConfigSchema = createInsertSchema(clientKpiConfig, {
  // 🛡️ XSS Protection for text fields
  clientName: safeString(200),

  // 🔢 Positive number validation for KPIs
  targetROAS: optionalPositiveNumericString(),
  targetCPA: optionalPositiveNumericString(),
  monthlyBudgetCap: optionalPositiveNumericString(),
}).omit({
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
  // 🛡️ Secure string fields with XSS protection
  type: z.enum(["Ingreso", "Gasto"]),
  category: safeString(100),
  description: safeOptionalString(500),
  rfc: safeOptionalString(20),
  invoiceNumber: safeOptionalString(50),
  provider: safeOptionalString(200),
  notes: safeOptionalString(1000),
  status: safeOptionalString(50),
  relatedClient: safeOptionalString(200),
  source: safeOptionalString(100),

  // 🔢 Positive number coercion - amount must be >= 0
  amount: positiveNumericString(),
  subtotal: optionalPositiveNumericString(),
  iva: optionalPositiveNumericString(),

  // 📅 Date coercion
  date: z.coerce.date(),
  paidDate: z.coerce.date().optional().nullable(),

  // 🔗 Integer coercion for IDs
  clientId: z.coerce.number().int().positive().optional().nullable(),
  recurringTemplateId: z.coerce.number().int().positive().optional().nullable(),
  sourceId: z.coerce.number().int().positive().optional().nullable(),
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

export const insertRecurringTransactionSchema = createInsertSchema(recurringTransactions, {
  // 🛡️ Secure string fields with XSS protection
  name: safeString(200),
  description: safeOptionalString(500),
  type: z.enum(["Ingreso", "Gasto"]),
  category: safeString(100),
  rfc: safeOptionalString(20),
  provider: safeOptionalString(200),
  notes: safeOptionalString(1000),
  frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly"]),

  // 🔢 Positive number coercion
  amount: positiveNumericString(),
  subtotal: optionalPositiveNumericString(),
  iva: optionalPositiveNumericString(),

  // Integer coercion
  dayOfMonth: z.coerce.number().int().min(1).max(31).optional().nullable(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional().nullable(),
  clientId: z.coerce.number().int().positive().optional().nullable(),

  // 📅 Date coercion
  nextExecutionDate: z.coerce.date(),
  lastExecutionDate: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRecurringTransactionSchema = insertRecurringTransactionSchema.partial();

export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type InsertRecurringTransaction = z.infer<typeof insertRecurringTransactionSchema>;
export type UpdateRecurringTransaction = z.infer<typeof updateRecurringTransactionSchema>;

// Projects Management Module (Extended for Deals/Negocios)
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientAccounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(), // "SEO", "Web", "Ads", "General"
  status: text("status").notNull().default("Planificación"), // "Planificación", "En Desarrollo", "Pausa", "Terminado", "Cancelado"
  health: text("health").notNull().default("green"), // "green", "yellow", "red"
  deadline: timestamp("deadline"),
  progress: integer("progress").notNull().default(0), // Calculated from deliverables
  budget: numeric("budget").default("0"), // Project budget for profitability calculations
  serviceSpecificFields: text("service_specific_fields"), // JSON string for dynamic fields
  customFields: text("custom_fields"), // JSON string for user-defined fields
  description: text("description"),

  // ===========================================
  // 🎯 PROJECT LEVEL/CATEGORY (Nuevo Formulario)
  // ===========================================
  level: text("level").notNull().default("Plata"),  // "Bronce", "Plata", "Oro", "Diamante"

  // ===========================================
  // 💵 FINANCIAL FIELDS (Cotización & Mantenimiento)
  // ===========================================
  quotationAmount: numeric("quotation_amount", { precision: 12, scale: 2 }),  // Cotización en MXN
  monthlyMaintenance: numeric("monthly_maintenance", { precision: 12, scale: 2 }),  // Mantenimiento mensual opcional

  // ===========================================
  // 📅 DATE FIELDS
  // ===========================================
  startDate: timestamp("start_date"),  // Fecha de inicio del proyecto

  // ===========================================
  // 🖼️ COVER/PORTADA FIELDS
  // ===========================================
  coverImageUrl: text("cover_image_url"),  // URL de imagen de portada (opcional)
  coverColor: text("cover_color").default("#3B82F6"),  // Color de fondo si no hay imagen

  // ===========================================
  // 📝 ADDITIONAL NOTES
  // ===========================================
  additionalNotes: text("additional_notes"),  // Notas adicionales

  // ===========================================
  // 💼 DEAL CONFIGURATION (Negocio/Iguala)
  // ===========================================
  dealType: text("deal_type").notNull().default("Proyecto"),  // "Proyecto" | "Iguala" (Retainer)
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),  // Total or monthly for iguala
  numberOfPayments: integer("number_of_payments").default(1),  // Quantity of installments
  paymentFrequency: text("payment_frequency"),  // "monthly", "biweekly", "quarterly", "custom"
  billingDay: integer("billing_day"),  // Day of month for billing alerts (1-31)
  expectedPaymentDay: integer("expected_payment_day"),  // Expected collection day (1-31)
  assignedSellerId: integer("assigned_seller_id"),  // FK to team (vendedor)
  contractUrl: text("contract_url"),  // Link to uploaded contract/quote

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects, {
  // 🛡️ XSS Protection for text fields
  name: safeString(200),
  serviceType: safeString(100),
  status: safeString(50),
  health: z.enum(["green", "yellow", "red"]).default("green"),
  description: safeOptionalString(1000),
  serviceSpecificFields: safeOptionalString(5000), // JSON fields need more space
  customFields: safeOptionalString(5000),

  // 🎯 NEW: Level/Category validation
  level: z.enum(["Bronce", "Plata", "Oro", "Diamante"]).default("Plata"),

  // 💵 NEW: Financial fields validation
  quotationAmount: optionalPositiveNumericString(),
  monthlyMaintenance: optionalPositiveNumericString(),

  // 🖼️ NEW: Cover fields validation
  coverImageUrl: safeOptionalString(1000),
  coverColor: safeOptionalString(20).default("#3B82F6"),

  // 📝 NEW: Additional notes validation
  additionalNotes: safeOptionalString(2000),

  // 💼 Deal configuration fields
  dealType: z.enum(["Proyecto", "Iguala"]).default("Proyecto"),
  totalAmount: optionalPositiveNumericString(),
  paymentFrequency: safeOptionalString(50),
  contractUrl: safeOptionalString(1000),

  // 🔢 Positive number validation
  progress: z.coerce.number().int().min(0).max(100, "El progreso debe estar entre 0 y 100").default(0),
  budget: optionalPositiveNumericString(),
  numberOfPayments: z.coerce.number().int().min(1).max(120).default(1),
  billingDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
  expectedPaymentDay: z.coerce.number().int().min(1).max(31).optional().nullable(),

  // 🔗 Integer coercion for FKs
  clientId: z.coerce.number().int().positive("Se requiere un cliente válido"),
  assignedSellerId: z.coerce.number().int().positive().optional().nullable(),

  // 📅 Date coercion
  deadline: z.coerce.date().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectSchema = insertProjectSchema.partial();

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

// ===========================================
// 💰 INSTALLMENTS MODULE (Payment Schedule)
// ===========================================

export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  installmentNumber: integer("installment_number").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),

  // Status tracking
  status: text("status").notNull().default("pending"),  // "pending", "collected", "overdue", "cancelled"

  // Concept with dynamic placeholders
  conceptTemplate: text("concept_template"),  // "{{service_name}} - Mes {{month}}"
  resolvedConcept: text("resolved_concept"),  // Computed: "Iguala Marketing - Mes Enero 2026"

  // Payment linkage
  isPaid: boolean("is_paid").notNull().default(false),
  paidDate: timestamp("paid_date"),
  transactionId: integer("transaction_id"),  // FK to transactions

  // Simple Note (non-fiscal receipt)
  simpleNoteNumber: text("simple_note_number"),
  simpleNoteIssuedAt: timestamp("simple_note_issued_at"),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInstallmentSchema = createInsertSchema(installments, {
  // 🛡️ XSS Protection
  status: z.enum(["pending", "collected", "overdue", "cancelled"]).default("pending"),
  conceptTemplate: safeOptionalString(500),
  resolvedConcept: safeOptionalString(500),
  simpleNoteNumber: safeOptionalString(50),
  notes: safeOptionalString(1000),

  // 🔢 Number validation
  amount: positiveNumericString(),
  installmentNumber: z.coerce.number().int().min(1),

  // 🔗 FK coercion
  projectId: z.coerce.number().int().positive("Se requiere un proyecto válido"),
  transactionId: z.coerce.number().int().positive().optional().nullable(),

  // 📅 Date coercion
  dueDate: z.coerce.date(),
  paidDate: z.coerce.date().optional().nullable(),
  simpleNoteIssuedAt: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateInstallmentSchema = insertInstallmentSchema.partial();

export type Installment = typeof installments.$inferSelect;
export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;
export type UpdateInstallment = z.infer<typeof updateInstallmentSchema>;

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

export const insertProjectAttachmentSchema = createInsertSchema(projectAttachments, {
  // 🛡️ XSS Protection for text fields
  name: safeString(200),
  url: safeString(1000),
  fileType: safeOptionalString(100),

  // 🔢 Integer validation
  projectId: z.coerce.number().int().positive("Se requiere un proyecto válido"),
  fileSize: z.coerce.number().int().min(0).optional().nullable(),
}).omit({
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

export const insertProjectDeliverableSchema = createInsertSchema(projectDeliverables, {
  // 🛡️ XSS Protection for text fields
  title: safeString(200),
  description: safeOptionalString(1000),

  // 🔢 Integer validation
  order: z.coerce.number().int().min(0).default(0),
  projectId: z.coerce.number().int().positive("Se requiere un proyecto válido"),
  linkedAttachmentId: z.coerce.number().int().positive().optional().nullable(),

  // 📅 Date coercion
  dueDate: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectDeliverableSchema = insertProjectDeliverableSchema.partial();

export type ProjectDeliverable = typeof projectDeliverables.$inferSelect;
export type InsertProjectDeliverable = z.infer<typeof insertProjectDeliverableSchema>;
export type UpdateProjectDeliverable = z.infer<typeof updateProjectDeliverableSchema>;

// ===========================================
// 🛠️ SERVICE CATALOG MODULE
// ===========================================

export const serviceCatalog = pgTable("service_catalog", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  defaultPrice: numeric("default_price", { precision: 12, scale: 2 }),
  category: text("category"),  // "Marketing", "Desarrollo", "Diseño", etc.
  icon: text("icon"),  // Icon name for UI display
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServiceCatalogSchema = createInsertSchema(serviceCatalog, {
  // 🛡️ XSS Protection
  name: safeString(200),
  description: safeOptionalString(500),
  category: safeOptionalString(100),
  icon: safeOptionalString(50),

  // 🔢 Number validation
  defaultPrice: optionalPositiveNumericString(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateServiceCatalogSchema = insertServiceCatalogSchema.partial();

export type ServiceCatalog = typeof serviceCatalog.$inferSelect;
export type InsertServiceCatalog = z.infer<typeof insertServiceCatalogSchema>;
export type UpdateServiceCatalog = z.infer<typeof updateServiceCatalogSchema>;

// ===========================================
// 🔗 PROJECT-SERVICES RELATIONSHIP
// ===========================================

export const projectServices = pgTable("project_services", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").notNull().references(() => serviceCatalog.id, { onDelete: "cascade" }),
  customPrice: numeric("custom_price", { precision: 12, scale: 2 }),  // Precio específico si difiere del default
  notes: text("notes"),  // Notas específicas para este servicio en el proyecto
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectServiceSchema = createInsertSchema(projectServices, {
  // 🔗 FK coercion
  projectId: z.coerce.number().int().positive("Se requiere un proyecto válido"),
  serviceId: z.coerce.number().int().positive("Se requiere un servicio válido"),

  // 🔢 Number validation
  customPrice: optionalPositiveNumericString(),

  // 🛡️ XSS Protection
  notes: safeOptionalString(500),
}).omit({
  id: true,
  createdAt: true,
});

export type ProjectService = typeof projectServices.$inferSelect;
export type InsertProjectService = z.infer<typeof insertProjectServiceSchema>;

// ===========================================
// 🎯 LEADS MODULE (CRM Kanban)
// ===========================================

export const LEAD_ORIGINS = [
  "Referido",
  "Instagram",
  "TikTok",
  "Landing Page",
  "LinkedIn",
  "YouTube",
  "Evento",
  "Campañas",
  "Google",
  "Facebook",
  "Otro",
] as const;

export const LEAD_STATUSES = [
  "Nuevo",
  "Contactado",
  "En Negociación",
  "Propuesta Enviada",
  "Ganado",
  "Perdido",
  "Descartado",
] as const;

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),

  // Contact Information
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),

  // CRM Classification
  origin: text("origin").notNull().default("Otro"),  // From LEAD_ORIGINS
  status: text("status").notNull().default("Nuevo"),  // From LEAD_STATUSES

  // Financial Estimation
  estimatedValue: numeric("estimated_value", { precision: 12, scale: 2 }),  // Potential deal value
  probability: integer("probability").default(50),  // Conversion probability %

  // Follow-up
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  assignedToId: integer("assigned_to_id").references(() => team.id, { onDelete: "set null" }),

  // Conversion
  convertedToClientId: integer("converted_to_client_id").references(() => clientAccounts.id, { onDelete: "set null" }),
  convertedAt: timestamp("converted_at"),
  lostReason: text("lost_reason"),  // If status = "Perdido"

  notes: text("notes"),
  tags: text("tags"),  // JSON array for custom tags

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads, {
  // 🛡️ XSS Protection
  name: safeString(200),
  email: z.string().email("Email inválido").max(200).optional().nullable(),
  phone: safeOptionalString(30),
  company: safeOptionalString(200),
  position: safeOptionalString(100),
  origin: z.enum(LEAD_ORIGINS).default("Otro"),
  status: z.enum(LEAD_STATUSES).default("Nuevo"),
  lostReason: safeOptionalString(500),
  notes: safeOptionalString(2000),
  tags: safeOptionalString(500),  // JSON array

  // 🔢 Number validation
  estimatedValue: optionalPositiveNumericString(),
  probability: z.coerce.number().int().min(0).max(100).default(50),

  // 🔗 FK coercion
  assignedToId: z.coerce.number().int().positive().optional().nullable(),
  convertedToClientId: z.coerce.number().int().positive().optional().nullable(),

  // 📅 Date coercion
  lastContactDate: z.coerce.date().optional().nullable(),
  nextFollowUpDate: z.coerce.date().optional().nullable(),
  convertedAt: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateLeadSchema = insertLeadSchema.partial();

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;

// ===========================================
// 📋 POES MODULE (Standard Operating Procedures)
// ===========================================

export const POE_CATEGORIES = [
  "Operaciones",
  "Ventas",
  "Marketing",
  "Finanzas",
  "Recursos Humanos",
  "Tecnología",
  "Diseño",
  "Atención al Cliente",
  "General",
] as const;

export const poes = pgTable("poes", {
  id: serial("id").primaryKey(),

  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("General"),  // From POE_CATEGORIES

  // Document
  fileUrl: text("file_url"),  // URL to PDF or document
  fileType: text("file_type"),  // "pdf", "doc", "video", etc.
  fileSize: integer("file_size"),  // In bytes

  // Versioning
  version: text("version").notNull().default("1.0"),
  lastReviewedAt: timestamp("last_reviewed_at"),
  reviewedById: integer("reviewed_by_id").references(() => team.id, { onDelete: "set null" }),

  // Access Control
  isPublic: boolean("is_public").notNull().default(true),  // Visible to all or restricted
  allowedRoles: text("allowed_roles"),  // JSON array: ["admin", "project_manager"]

  // Status
  isActive: boolean("is_active").notNull().default(true),

  createdById: integer("created_by_id").references(() => team.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPoeSchema = createInsertSchema(poes, {
  // 🛡️ XSS Protection
  title: safeString(200),
  description: safeOptionalString(1000),
  category: z.enum(POE_CATEGORIES).default("General"),
  fileUrl: safeOptionalString(1000),
  fileType: safeOptionalString(50),
  version: safeString(20).default("1.0"),
  allowedRoles: safeOptionalString(500),  // JSON array

  // 🔢 Number validation
  fileSize: z.coerce.number().int().min(0).optional().nullable(),

  // 🔗 FK coercion
  reviewedById: z.coerce.number().int().positive().optional().nullable(),
  createdById: z.coerce.number().int().positive().optional().nullable(),

  // 📅 Date coercion
  lastReviewedAt: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePoeSchema = insertPoeSchema.partial();

export type Poe = typeof poes.$inferSelect;
export type InsertPoe = z.infer<typeof insertPoeSchema>;
export type UpdatePoe = z.infer<typeof updatePoeSchema>;

// ===========================================
// 👥 PROJECT TEAM ASSIGNMENTS (Explicit per-project)
// ===========================================

export const projectTeamAssignments = pgTable("project_team_assignments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  teamMemberId: integer("team_member_id").notNull().references(() => team.id, { onDelete: "cascade" }),

  // Role in this project
  roleInProject: text("role_in_project"),  // "Lead", "Support", "Reviewer"

  // Time tracking
  allocatedHours: integer("allocated_hours").default(0),
  loggedHours: numeric("logged_hours", { precision: 10, scale: 2 }).default("0"),

  // Service assignment (optional, if team member is assigned for a specific service)
  serviceId: integer("service_id").references(() => serviceCatalog.id, { onDelete: "set null" }),

  // Performance tracking
  revenueAttributed: numeric("revenue_attributed", { precision: 12, scale: 2 }).default("0"),

  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectTeamAssignmentSchema = createInsertSchema(projectTeamAssignments, {
  // 🛡️ XSS Protection
  roleInProject: safeOptionalString(100),

  // 🔢 Number validation
  allocatedHours: z.coerce.number().int().min(0).default(0),
  loggedHours: optionalPositiveNumericString(),
  revenueAttributed: optionalPositiveNumericString(),

  // 🔗 FK coercion
  projectId: z.coerce.number().int().positive("Se requiere un proyecto válido"),
  teamMemberId: z.coerce.number().int().positive("Se requiere un miembro del equipo válido"),
  serviceId: z.coerce.number().int().positive().optional().nullable(),
}).omit({
  id: true,
  assignedAt: true,
  updatedAt: true,
});

export const updateProjectTeamAssignmentSchema = insertProjectTeamAssignmentSchema.partial();

export type ProjectTeamAssignment = typeof projectTeamAssignments.$inferSelect;
export type InsertProjectTeamAssignment = z.infer<typeof insertProjectTeamAssignmentSchema>;
export type UpdateProjectTeamAssignment = z.infer<typeof updateProjectTeamAssignmentSchema>;


