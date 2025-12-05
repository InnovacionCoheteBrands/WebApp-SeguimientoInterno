import type { Campaign } from "@shared/schema";

export function exportToCSV(campaigns: Campaign[], filename: string = "campaigns.csv") {
  const headers = ["Campaign Code", "Name", "Client", "Channel", "Status", "Priority", "Progress"];
  const rows = campaigns.map(c => [
    c.campaignCode,
    c.name,
    c.clientName,
    c.channel,
    c.status,
    c.priority,
    c.progress.toString()
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv");
}

export function exportToJSON(campaigns: Campaign[], filename: string = "campaigns.json") {
  const jsonContent = JSON.stringify(campaigns, null, 2);
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
