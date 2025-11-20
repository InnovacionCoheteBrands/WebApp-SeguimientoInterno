import type { 
  Mission, 
  InsertMission, 
  UpdateMission, 
  SystemMetric, 
  TelemetryData,
  FleetPosition,
  InsertFleetPosition,
  Personnel,
  InsertPersonnel,
  UpdatePersonnel,
  PersonnelAssignment,
  InsertPersonnelAssignment,
  DataHealth,
  InsertDataHealth
} from "@shared/schema";

export async function fetchMissions(): Promise<Mission[]> {
  const res = await fetch("/api/missions");
  if (!res.ok) throw new Error("Failed to fetch missions");
  return res.json();
}

export async function fetchMissionById(id: number): Promise<Mission> {
  const res = await fetch(`/api/missions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch mission");
  return res.json();
}

export async function createMission(mission: InsertMission): Promise<Mission> {
  const res = await fetch("/api/missions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mission),
  });
  if (!res.ok) throw new Error("Failed to create mission");
  return res.json();
}

export async function updateMission(id: number, mission: UpdateMission): Promise<Mission> {
  const res = await fetch(`/api/missions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mission),
  });
  if (!res.ok) throw new Error("Failed to update mission");
  return res.json();
}

export async function deleteMission(id: number): Promise<void> {
  const res = await fetch(`/api/missions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete mission");
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

export async function fetchFleetPositions(): Promise<FleetPosition[]> {
  const res = await fetch("/api/fleet");
  if (!res.ok) throw new Error("Failed to fetch fleet positions");
  return res.json();
}

export async function createFleetPosition(position: InsertFleetPosition): Promise<FleetPosition> {
  const res = await fetch("/api/fleet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(position),
  });
  if (!res.ok) throw new Error("Failed to create fleet position");
  return res.json();
}

export async function updateFleetPosition(missionId: number, position: Partial<InsertFleetPosition>): Promise<FleetPosition> {
  const res = await fetch(`/api/fleet/${missionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(position),
  });
  if (!res.ok) throw new Error("Failed to update fleet position");
  return res.json();
}

export async function deleteFleetPosition(missionId: number): Promise<void> {
  const res = await fetch(`/api/fleet/${missionId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete fleet position");
}

export async function fetchPersonnel(): Promise<Personnel[]> {
  const res = await fetch("/api/personnel");
  if (!res.ok) throw new Error("Failed to fetch personnel");
  return res.json();
}

export async function createPersonnel(person: InsertPersonnel): Promise<Personnel> {
  const res = await fetch("/api/personnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(person),
  });
  if (!res.ok) throw new Error("Failed to create personnel");
  return res.json();
}

export async function updatePersonnel(id: number, person: UpdatePersonnel): Promise<Personnel> {
  const res = await fetch(`/api/personnel/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(person),
  });
  if (!res.ok) throw new Error("Failed to update personnel");
  return res.json();
}

export async function deletePersonnel(id: number): Promise<void> {
  const res = await fetch(`/api/personnel/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete personnel");
}

export async function fetchPersonnelAssignments(): Promise<PersonnelAssignment[]> {
  const res = await fetch("/api/personnel/assignments");
  if (!res.ok) throw new Error("Failed to fetch assignments");
  return res.json();
}

export async function createPersonnelAssignment(assignment: InsertPersonnelAssignment): Promise<PersonnelAssignment> {
  const res = await fetch("/api/personnel/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assignment),
  });
  if (!res.ok) throw new Error("Failed to create assignment");
  return res.json();
}

export async function deletePersonnelAssignment(id: number): Promise<void> {
  const res = await fetch(`/api/personnel/assignments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete assignment");
}

export async function fetchDataHealth(): Promise<DataHealth[]> {
  const res = await fetch("/api/data-health");
  if (!res.ok) throw new Error("Failed to fetch data health");
  return res.json();
}

export async function createDataHealth(health: InsertDataHealth): Promise<DataHealth> {
  const res = await fetch("/api/data-health", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(health),
  });
  if (!res.ok) throw new Error("Failed to create data health entry");
  return res.json();
}

export async function updateDataHealth(id: number, health: Partial<InsertDataHealth>): Promise<DataHealth> {
  const res = await fetch(`/api/data-health/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(health),
  });
  if (!res.ok) throw new Error("Failed to update data health entry");
  return res.json();
}

export async function deleteDataHealth(id: number): Promise<void> {
  const res = await fetch(`/api/data-health/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete data health entry");
}

export interface Analytics {
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  averageProgress: number;
  priorityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recentActivity: TelemetryData[];
}

export async function fetchAnalytics(): Promise<Analytics> {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

// AI Agent Types and Functions

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
