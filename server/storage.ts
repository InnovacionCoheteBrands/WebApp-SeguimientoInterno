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
  type FleetPosition,
  type InsertFleetPosition,
  type Personnel,
  type InsertPersonnel,
  type UpdatePersonnel,
  type PersonnelAssignment,
  type InsertPersonnelAssignment,
  type DataHealth,
  type InsertDataHealth,
  users,
  missions,
  systemMetrics,
  telemetryData,
  fleetPositions,
  personnel,
  personnelAssignments,
  dataHealth,
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
  cleanupOldTelemetry(keepLast: number): Promise<void>;
  cleanupOldMetrics(keepLast: number): Promise<void>;
  
  getFleetPositions(): Promise<FleetPosition[]>;
  getFleetPositionByMissionId(missionId: number): Promise<FleetPosition | undefined>;
  createFleetPosition(position: InsertFleetPosition): Promise<FleetPosition>;
  updateFleetPosition(missionId: number, position: Partial<InsertFleetPosition>): Promise<FleetPosition | undefined>;
  deleteFleetPosition(missionId: number): Promise<boolean>;
  
  getPersonnel(): Promise<Personnel[]>;
  getPersonnelById(id: number): Promise<Personnel | undefined>;
  createPersonnel(person: InsertPersonnel): Promise<Personnel>;
  updatePersonnel(id: number, person: UpdatePersonnel): Promise<Personnel | undefined>;
  deletePersonnel(id: number): Promise<boolean>;
  
  getPersonnelAssignments(): Promise<PersonnelAssignment[]>;
  getAssignmentsByMissionId(missionId: number): Promise<PersonnelAssignment[]>;
  getAssignmentsByPersonnelId(personnelId: number): Promise<PersonnelAssignment[]>;
  createPersonnelAssignment(assignment: InsertPersonnelAssignment): Promise<PersonnelAssignment>;
  deletePersonnelAssignment(id: number): Promise<boolean>;
  
  getDataHealth(): Promise<DataHealth[]>;
  createDataHealth(health: InsertDataHealth): Promise<DataHealth>;
  updateDataHealth(id: number, health: Partial<InsertDataHealth>): Promise<DataHealth | undefined>;
  deleteDataHealth(id: number): Promise<boolean>;
  cleanupOldDataHealth(keepLast: number): Promise<void>;
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

  async getFleetPositions(): Promise<FleetPosition[]> {
    return await db
      .select()
      .from(fleetPositions)
      .orderBy(desc(fleetPositions.timestamp));
  }

  async getFleetPositionByMissionId(missionId: number): Promise<FleetPosition | undefined> {
    const [position] = await db
      .select()
      .from(fleetPositions)
      .where(eq(fleetPositions.missionId, missionId))
      .orderBy(desc(fleetPositions.timestamp))
      .limit(1);
    return position;
  }

  async createFleetPosition(position: InsertFleetPosition): Promise<FleetPosition> {
    const [newPosition] = await db.insert(fleetPositions).values(position).returning();
    return newPosition;
  }

  async updateFleetPosition(missionId: number, position: Partial<InsertFleetPosition>): Promise<FleetPosition | undefined> {
    const existing = await this.getFleetPositionByMissionId(missionId);
    if (!existing) return undefined;
    
    const [updated] = await db
      .update(fleetPositions)
      .set({ ...position, timestamp: new Date() })
      .where(eq(fleetPositions.id, existing.id))
      .returning();
    return updated;
  }

  async deleteFleetPosition(missionId: number): Promise<boolean> {
    const result = await db.delete(fleetPositions).where(eq(fleetPositions.missionId, missionId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPersonnel(): Promise<Personnel[]> {
    return await db.select().from(personnel).orderBy(desc(personnel.createdAt));
  }

  async getPersonnelById(id: number): Promise<Personnel | undefined> {
    const [person] = await db.select().from(personnel).where(eq(personnel.id, id));
    return person;
  }

  async createPersonnel(person: InsertPersonnel): Promise<Personnel> {
    const [newPerson] = await db.insert(personnel).values(person).returning();
    return newPerson;
  }

  async updatePersonnel(id: number, person: UpdatePersonnel): Promise<Personnel | undefined> {
    const [updated] = await db
      .update(personnel)
      .set(person)
      .where(eq(personnel.id, id))
      .returning();
    return updated;
  }

  async deletePersonnel(id: number): Promise<boolean> {
    const result = await db.delete(personnel).where(eq(personnel.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPersonnelAssignments(): Promise<PersonnelAssignment[]> {
    return await db.select().from(personnelAssignments).orderBy(desc(personnelAssignments.assignedAt));
  }

  async getAssignmentsByMissionId(missionId: number): Promise<PersonnelAssignment[]> {
    return await db
      .select()
      .from(personnelAssignments)
      .where(eq(personnelAssignments.missionId, missionId));
  }

  async getAssignmentsByPersonnelId(personnelId: number): Promise<PersonnelAssignment[]> {
    return await db
      .select()
      .from(personnelAssignments)
      .where(eq(personnelAssignments.personnelId, personnelId));
  }

  async createPersonnelAssignment(assignment: InsertPersonnelAssignment): Promise<PersonnelAssignment> {
    const [newAssignment] = await db.insert(personnelAssignments).values(assignment).returning();
    return newAssignment;
  }

  async deletePersonnelAssignment(id: number): Promise<boolean> {
    const result = await db.delete(personnelAssignments).where(eq(personnelAssignments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getDataHealth(): Promise<DataHealth[]> {
    return await db
      .select()
      .from(dataHealth)
      .orderBy(desc(dataHealth.timestamp))
      .limit(10);
  }

  async createDataHealth(health: InsertDataHealth): Promise<DataHealth> {
    const [newHealth] = await db.insert(dataHealth).values(health).returning();
    return newHealth;
  }

  async updateDataHealth(id: number, health: Partial<InsertDataHealth>): Promise<DataHealth | undefined> {
    const [updatedHealth] = await db
      .update(dataHealth)
      .set({ ...health, timestamp: new Date() })
      .where(eq(dataHealth.id, id))
      .returning();
    return updatedHealth;
  }

  async deleteDataHealth(id: number): Promise<boolean> {
    const result = await db.delete(dataHealth).where(eq(dataHealth.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async cleanupOldDataHealth(keepLast: number): Promise<void> {
    await db.execute(sql`
      WITH keep AS (
        SELECT id FROM ${dataHealth}
        ORDER BY timestamp DESC, id DESC
        LIMIT ${keepLast}
      )
      DELETE FROM ${dataHealth}
      WHERE id NOT IN (SELECT id FROM keep)
    `);
  }
}

export const storage = new DBStorage();
