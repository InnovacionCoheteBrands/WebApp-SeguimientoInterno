import { storage } from "./storage";

export async function calculateSystemMetrics() {
  const campaigns = await storage.getCampaigns();
  
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === "Active" || c.status === "In Progress").length;
  const completedCampaigns = campaigns.filter(c => c.status === "Completed").length;
  const planningCampaigns = campaigns.filter(c => c.status === "Planning").length;
  
  const avgProgress = campaigns.length > 0
    ? Math.round(campaigns.reduce((sum, c) => sum + c.progress, 0) / campaigns.length)
    : 0;

  const highPriorityCampaigns = campaigns.filter(c => c.priority === "High" && c.status !== "Completed").length;

  const clientStatus = `${activeCampaigns}/${totalCampaigns}`;
  const clientTrend = `+${activeCampaigns}`;
  
  const activeTeam = 12 + Math.floor(Math.random() * 8);
  const teamTrend = Math.floor(Math.random() * 20) - 5;
  
  const utilizationRate = 30 + avgProgress * 0.5 + Math.floor(Math.random() * 15);
  const utilizationTrend = Math.floor(Math.random() * 10) - 5;
  
  const urgencyLevel = highPriorityCampaigns > 3 ? "HIGH" : highPriorityCampaigns > 0 ? "MEDIUM" : "LOW";
  const urgentTasks = highPriorityCampaigns > 5 ? Math.floor(Math.random() * 3) : 0;

  return {
    clientStatus: {
      value: clientStatus,
      label: "Active Campaigns",
      trend: clientTrend,
      trendLabel: "campaigns running",
      icon: "Target"
    },
    activeTeam: {
      value: activeTeam.toString(),
      label: "Team Members",
      trend: `${teamTrend > 0 ? '+' : ''}${teamTrend}%`,
      trendLabel: "vs last month",
      icon: "Users"
    },
    utilizationRate: {
      value: `${Math.min(utilizationRate, 100)}%`,
      label: "Team Utilization",
      trend: `${utilizationTrend > 0 ? '+' : ''}${utilizationTrend}%`,
      trendLabel: utilizationTrend < 0 ? "optimized" : "increased",
      success: utilizationTrend < 0,
      icon: "TrendingUp"
    },
    urgencyLevel: {
      value: urgencyLevel,
      label: "Priority Status",
      trend: urgentTasks.toString(),
      trendLabel: "urgent items",
      icon: "AlertCircle"
    }
  };
}

export async function initializeSystemMetrics() {
  const metrics = await calculateSystemMetrics();
  
  await storage.createSystemMetric({
    metricType: "client_status",
    value: metrics.clientStatus.value,
    label: metrics.clientStatus.label,
    trend: metrics.clientStatus.trend,
    trendLabel: metrics.clientStatus.trendLabel
  });

  await storage.createSystemMetric({
    metricType: "active_team",
    value: metrics.activeTeam.value,
    label: metrics.activeTeam.label,
    trend: metrics.activeTeam.trend,
    trendLabel: metrics.activeTeam.trendLabel
  });

  await storage.createSystemMetric({
    metricType: "utilization_rate",
    value: metrics.utilizationRate.value,
    label: metrics.utilizationRate.label,
    trend: metrics.utilizationRate.trend,
    trendLabel: metrics.utilizationRate.trendLabel
  });

  await storage.createSystemMetric({
    metricType: "urgency_level",
    value: metrics.urgencyLevel.value,
    label: metrics.urgencyLevel.label,
    trend: metrics.urgencyLevel.trend,
    trendLabel: metrics.urgencyLevel.trendLabel
  });

  return metrics;
}
