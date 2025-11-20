import { storage } from "./storage";

export async function calculateSystemMetrics() {
  const missions = await storage.getMissions();
  
  const totalMissions = missions.length;
  const activeMissions = missions.filter(m => m.status === "Active").length;
  const completedMissions = missions.filter(m => m.status === "Completed").length;
  const pendingMissions = missions.filter(m => m.status === "Pending").length;
  
  const avgProgress = missions.length > 0
    ? Math.round(missions.reduce((sum, m) => sum + m.progress, 0) / missions.length)
    : 0;

  const highPriorityMissions = missions.filter(m => m.priority === "High" && m.status !== "Completed").length;

  const fleetStatus = `${activeMissions}/${totalMissions}`;
  const fleetTrend = `+${activeMissions}`;
  
  const activePersonnel = 1200 + Math.floor(Math.random() * 200);
  const personnelTrend = Math.floor(Math.random() * 20) - 5;
  
  const systemLoad = 30 + avgProgress * 0.5 + Math.floor(Math.random() * 15);
  const loadTrend = Math.floor(Math.random() * 10) - 5;
  
  const threatLevel = highPriorityMissions > 3 ? "MEDIUM" : highPriorityMissions > 0 ? "LOW" : "MINIMAL";
  const incidents = highPriorityMissions > 5 ? Math.floor(Math.random() * 3) : 0;

  return {
    fleetStatus: {
      value: fleetStatus,
      label: "Operational",
      trend: fleetTrend,
      trendLabel: "active missions",
      icon: "Rocket"
    },
    activePersonnel: {
      value: activePersonnel.toString(),
      label: "On Duty",
      trend: `${personnelTrend > 0 ? '+' : ''}${personnelTrend}%`,
      trendLabel: "vs last shift",
      icon: "Users"
    },
    systemLoad: {
      value: `${Math.min(systemLoad, 100)}%`,
      label: "Capacity Used",
      trend: `${loadTrend > 0 ? '+' : ''}${loadTrend}%`,
      trendLabel: loadTrend < 0 ? "optimized" : "increased",
      success: loadTrend < 0,
      icon: "Cpu"
    },
    threatLevel: {
      value: threatLevel,
      label: "Secure",
      trend: incidents.toString(),
      trendLabel: "incidents",
      icon: "ShieldAlert"
    }
  };
}

export async function initializeSystemMetrics() {
  const metrics = await calculateSystemMetrics();
  
  await storage.createSystemMetric({
    metricType: "fleet_status",
    value: metrics.fleetStatus.value,
    label: metrics.fleetStatus.label,
    trend: metrics.fleetStatus.trend,
    trendLabel: metrics.fleetStatus.trendLabel
  });

  await storage.createSystemMetric({
    metricType: "active_personnel",
    value: metrics.activePersonnel.value,
    label: metrics.activePersonnel.label,
    trend: metrics.activePersonnel.trend,
    trendLabel: metrics.activePersonnel.trendLabel
  });

  await storage.createSystemMetric({
    metricType: "system_load",
    value: metrics.systemLoad.value,
    label: metrics.systemLoad.label,
    trend: metrics.systemLoad.trend,
    trendLabel: metrics.systemLoad.trendLabel
  });

  await storage.createSystemMetric({
    metricType: "threat_level",
    value: metrics.threatLevel.value,
    label: metrics.threatLevel.label,
    trend: metrics.threatLevel.trend,
    trendLabel: metrics.threatLevel.trendLabel
  });

  return metrics;
}
