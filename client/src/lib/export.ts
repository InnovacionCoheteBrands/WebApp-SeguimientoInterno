import type { Mission } from "@shared/schema";

export function exportToCSV(missions: Mission[], filename: string = "missions.csv") {
  const headers = ["Mission Code", "Name", "Status", "Priority", "Progress"];
  const rows = missions.map(m => [
    m.missionCode,
    m.name,
    m.status,
    m.priority,
    m.progress.toString()
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv");
}

export function exportToJSON(missions: Mission[], filename: string = "missions.json") {
  const jsonContent = JSON.stringify(missions, null, 2);
  downloadFile(jsonContent, filename, "application/json");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
