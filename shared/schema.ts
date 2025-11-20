import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  missionCode: text("mission_code").notNull().unique(),
  name: text("name").notNull(),
  status: text("status").notNull().default("Pending"),
  progress: integer("progress").notNull().default(0),
  priority: text("priority").notNull().default("Medium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMissionSchema = insertMissionSchema.partial();

export type Mission = typeof missions.$inferSelect;
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type UpdateMission = z.infer<typeof updateMissionSchema>;

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

export const fleetPositions = pgTable("fleet_positions", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  sector: text("sector").notNull(),
  coordinates: text("coordinates").notNull(),
  velocity: integer("velocity").notNull(),
  distance: integer("distance").notNull(),
  lastContact: timestamp("last_contact").defaultNow().notNull(),
  status: text("status").notNull().default("Active"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertFleetPositionSchema = createInsertSchema(fleetPositions).omit({
  id: true,
  timestamp: true,
});

export type FleetPosition = typeof fleetPositions.$inferSelect;
export type InsertFleetPosition = z.infer<typeof insertFleetPositionSchema>;

export const personnel = pgTable("personnel", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  clearance: text("clearance").notNull(),
  status: text("status").notNull().default("On Duty"),
  avatarUrl: text("avatar_url"),
  shiftStart: text("shift_start").notNull(),
  shiftEnd: text("shift_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPersonnelSchema = createInsertSchema(personnel).omit({
  id: true,
  createdAt: true,
});

export const updatePersonnelSchema = insertPersonnelSchema.partial();

export type Personnel = typeof personnel.$inferSelect;
export type InsertPersonnel = z.infer<typeof insertPersonnelSchema>;
export type UpdatePersonnel = z.infer<typeof updatePersonnelSchema>;

export const personnelAssignments = pgTable("personnel_assignments", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id, { onDelete: "cascade" }),
  missionId: integer("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const insertPersonnelAssignmentSchema = createInsertSchema(personnelAssignments).omit({
  id: true,
  assignedAt: true,
});

export type PersonnelAssignment = typeof personnelAssignments.$inferSelect;
export type InsertPersonnelAssignment = z.infer<typeof insertPersonnelAssignmentSchema>;

export const dataHealth = pgTable("data_health", {
  id: serial("id").primaryKey(),
  component: text("component").notNull(),
  status: text("status").notNull(),
  replicationLag: integer("replication_lag"),
  lastBackup: timestamp("last_backup"),
  storageUsed: integer("storage_used"),
  storageTotal: integer("storage_total"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertDataHealthSchema = createInsertSchema(dataHealth).omit({
  id: true,
  timestamp: true,
});

export type DataHealth = typeof dataHealth.$inferSelect;
export type InsertDataHealth = z.infer<typeof insertDataHealthSchema>;
