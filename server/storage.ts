import { 
  type User, 
  type InsertUser,
  type Mission,
  type InsertMission,
  type UpdateMission,
  type SystemMetric,
  type InsertSystemMetric,
  type TelemetryData,
  type InsertTelemetryData,
  users,
  missions,
  systemMetrics,
  telemetryData,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getMissions(): Promise<Mission[]>;
  getMissionById(id: number): Promise<Mission | undefined>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: number, mission: UpdateMission): Promise<Mission | undefined>;
  deleteMission(id: number): Promise<boolean>;
  
  getSystemMetrics(): Promise<SystemMetric[]>;
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;
  
  getTelemetryData(limit?: number): Promise<TelemetryData[]>;
  createTelemetryData(data: InsertTelemetryData): Promise<TelemetryData>;
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

  async getMissions(): Promise<Mission[]> {
    return await db.select().from(missions).orderBy(desc(missions.createdAt));
  }

  async getMissionById(id: number): Promise<Mission | undefined> {
    const [mission] = await db.select().from(missions).where(eq(missions.id, id));
    return mission;
  }

  async createMission(mission: InsertMission): Promise<Mission> {
    const [newMission] = await db.insert(missions).values(mission).returning();
    return newMission;
  }

  async updateMission(id: number, mission: UpdateMission): Promise<Mission | undefined> {
    const [updatedMission] = await db
      .update(missions)
      .set({ ...mission, updatedAt: new Date() })
      .where(eq(missions.id, id))
      .returning();
    return updatedMission;
  }

  async deleteMission(id: number): Promise<boolean> {
    const result = await db.delete(missions).where(eq(missions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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
}

export const storage = new DBStorage();
