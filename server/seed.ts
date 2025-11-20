import { storage } from "./storage";

async function seed() {
  console.log("[seed] Starting database seed...");

  try {
    const missions = await storage.getMissions();
    
    if (missions.length < 3) {
      console.log("[seed] Creating sample missions...");
      await storage.createMission({
        missionCode: "LO-A001",
        name: "Lunar Outpost Alpha",
        status: "Active",
        priority: "High",
        progress: 67
      });
      
      await storage.createMission({
        missionCode: "MC-B002",
        name: "Mars Colony Beta",
        status: "Active",
        priority: "Critical",
        progress: 45
      });
      
      await storage.createMission({
        missionCode: "ES-003",
        name: "Europa Survey",
        status: "Pending",
        priority: "Medium",
        progress: 12
      });
    }

    const updatedMissions = await storage.getMissions();
    
    for (const mission of updatedMissions) {
      const existingPosition = await storage.getFleetPositionByMissionId(mission.id);
      
      if (!existingPosition) {
        const sectors = ["Alpha Quadrant", "Beta Sector", "Gamma Zone", "Delta Region", "Epsilon Territory"];
        const sector = sectors[Math.floor(Math.random() * sectors.length)];
        const x = Math.floor(Math.random() * 100000);
        const y = Math.floor(Math.random() * 100000);
        const z = Math.floor(Math.random() * 50000);
        
        await storage.createFleetPosition({
          missionId: mission.id,
          sector,
          coordinates: `${x}, ${y}, ${z}`,
          velocity: Math.floor(Math.random() * 5000) + 1000,
          distance: Math.floor(Math.random() * 500000) + 100000,
          lastContact: new Date(),
          status: mission.status === "Active" ? "Active" : "Standby"
        });
        console.log(`[seed] Created fleet position for mission ${mission.id}`);
      }
    }

    const personnelData = [
      { name: "Cmdr. Sarah Chen", role: "Flight Director", clearance: "Level 5", status: "On Duty", shiftStart: "08:00", shiftEnd: "16:00" },
      { name: "Dr. Marcus Webb", role: "Mission Scientist", clearance: "Level 4", status: "On Duty", shiftStart: "08:00", shiftEnd: "16:00" },
      { name: "Lt. Aisha Patel", role: "Systems Engineer", clearance: "Level 4", status: "On Duty", shiftStart: "08:00", shiftEnd: "16:00" },
      { name: "Capt. James Morrison", role: "Navigation Specialist", clearance: "Level 4", status: "Off Duty", shiftStart: "16:00", shiftEnd: "00:00" },
      { name: "Dr. Elena Rodriguez", role: "Medical Officer", clearance: "Level 3", status: "On Duty", shiftStart: "00:00", shiftEnd: "08:00" },
      { name: "Tech. David Kim", role: "Communications", clearance: "Level 3", status: "On Duty", shiftStart: "08:00", shiftEnd: "16:00" },
    ];

    const existingPersonnel = await storage.getPersonnel();
    
    if (existingPersonnel.length === 0) {
      console.log("[seed] Creating personnel records...");
      for (const person of personnelData) {
        await storage.createPersonnel(person);
      }
    }

    const allPersonnel = await storage.getPersonnel();
    const assignments = await storage.getPersonnelAssignments();
    
    if (assignments.length === 0 && allPersonnel.length > 0 && updatedMissions.length > 0) {
      console.log("[seed] Creating personnel assignments...");
      for (let i = 0; i < Math.min(allPersonnel.length, updatedMissions.length); i++) {
        await storage.createPersonnelAssignment({
          personnelId: allPersonnel[i].id,
          missionId: updatedMissions[i].id
        });
      }
    }

    const healthComponents = [
      { component: "Primary Database", status: "Operational", replicationLag: 5, storageUsed: 245, storageTotal: 1000 },
      { component: "Backup System", status: "Operational", replicationLag: 12, storageUsed: 245, storageTotal: 1000 },
      { component: "Telemetry Cache", status: "Operational", replicationLag: null, storageUsed: 89, storageTotal: 500 },
      { component: "Analytics Engine", status: "Warning", replicationLag: null, storageUsed: 420, storageTotal: 500 },
    ];

    const existingHealth = await storage.getDataHealth();
    
    if (existingHealth.length === 0) {
      console.log("[seed] Creating data health records...");
      for (const health of healthComponents) {
        await storage.createDataHealth({
          ...health,
          lastBackup: new Date(Date.now() - Math.random() * 3600000)
        });
      }
    }

    console.log("[seed] Database seeded successfully!");
  } catch (error) {
    console.error("[seed] Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
