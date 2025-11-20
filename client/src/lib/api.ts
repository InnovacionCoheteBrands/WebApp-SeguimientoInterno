import type { Mission, InsertMission, UpdateMission, SystemMetric, TelemetryData } from "@shared/schema";

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
