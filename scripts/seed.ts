import 'dotenv/config';
import { storage } from "./storage";

async function seed() {
  console.log("[seed] Starting database seed...");

  try {
    const campaigns = await storage.getCampaigns();

    if (campaigns.length < 3) {
      console.log("[seed] Creating sample campaigns...");
      await storage.createCampaign({
        campaignCode: "CB-META-001",
        name: "Lanzamiento de Producto Q1",
        clientName: "TechStartup Inc",
        channel: "Meta",
        status: "Active",
        priority: "High",
        progress: 67,
        budget: 25000,
        spend: 16750,
        targetAudience: "Tech professionals 25-45"
      });

      await storage.createCampaign({
        campaignCode: "CB-GOOGLE-002",
        name: "Black Friday 2024",
        clientName: "Fashion Retail Co",
        channel: "Google Ads",
        status: "In Progress",
        priority: "Critical",
        progress: 85,
        budget: 50000,
        spend: 42500,
        targetAudience: "Fashion enthusiasts 18-35"
      });

      await storage.createCampaign({
        campaignCode: "CB-LINKEDIN-003",
        name: "Lead Generation LinkedIn",
        clientName: "B2B SaaS Platform",
        channel: "LinkedIn",
        status: "Active",
        priority: "High",
        progress: 45,
        budget: 15000,
        spend: 6750,
        targetAudience: "B2B decision makers"
      });

      await storage.createCampaign({
        campaignCode: "CB-EMAIL-004",
        name: "Newsletter Engagement Q1",
        clientName: "HealthTech Solutions",
        channel: "Email",
        status: "Planning",
        priority: "Medium",
        progress: 12,
        budget: 8000,
        spend: 960,
        targetAudience: "Healthcare professionals"
      });

      await storage.createCampaign({
        campaignCode: "CB-TIKTOK-005",
        name: "Brand Awareness Gen Z",
        clientName: "Eco Beauty Brand",
        channel: "TikTok",
        status: "Active",
        priority: "Medium",
        progress: 33,
        budget: 12000,
        spend: 3960,
        targetAudience: "Gen Z eco-conscious consumers"
      });
    }

    const updatedCampaigns = await storage.getCampaigns();

    for (const campaign of updatedCampaigns) {
      const existingAccount = await storage.getClientAccountByCampaignId(campaign.id);

      if (!existingAccount) {
        const industries = ["Tech", "Retail", "Finance", "Health", "Education"];
        const industry = industries[Math.floor(Math.random() * industries.length)];
        const monthlyBudget = Math.floor(Math.random() * 40000) + 10000;
        const currentSpend = Math.floor(monthlyBudget * (Math.random() * 0.5 + 0.3));
        const healthScore = Math.floor(Math.random() * 20) + 75;

        const milestones = [
          "Q2 Campaign Launch",
          "Contract Renewal",
          "Mid-Year Review",
          "Budget Planning Meeting",
          "Performance Review"
        ];
        const nextMilestone = milestones[Math.floor(Math.random() * milestones.length)];

        await storage.createClientAccount({
          campaignId: campaign.id,
          companyName: campaign.clientName,
          industry,
          monthlyBudget,
          currentSpend,
          healthScore,
          nextMilestone,
          lastContact: new Date(),
          status: campaign.status === "Active" || campaign.status === "In Progress" ? "Active" : campaign.status === "Paused" ? "Paused" : "Planning"
        });
        console.log(`[seed] Created client account for campaign ${campaign.campaignCode}`);
      }
    }

    const teamData = [
      { name: "Ana García", role: "Creative Director", department: "Director", status: "Disponible", workHoursStart: "09:00", workHoursEnd: "18:00" },
      { name: "Carlos Ruiz", role: "Copywriter", department: "Senior", status: "Ocupado", workHoursStart: "08:00", workHoursEnd: "17:00" },
      { name: "María López", role: "Designer", department: "Mid-Level", status: "Disponible", workHoursStart: "09:00", workHoursEnd: "18:00" },
      { name: "Javier Martínez", role: "Social Media Manager", department: "Senior", status: "Ocupado", workHoursStart: "10:00", workHoursEnd: "19:00" },
      { name: "Laura Fernández", role: "SEO Specialist", department: "Mid-Level", status: "Disponible", workHoursStart: "08:00", workHoursEnd: "17:00" },
      { name: "Diego Sánchez", role: "Account Manager", department: "Lead", status: "Vacaciones", workHoursStart: "09:00", workHoursEnd: "18:00" },
    ];

    const existingTeam = await storage.getTeam();

    if (existingTeam.length === 0) {
      console.log("[seed] Creating team records...");
      for (const member of teamData) {
        await storage.createTeam(member);
      }
    }

    const allTeam = await storage.getTeam();
    const assignments = await storage.getTeamAssignments();

    if (assignments.length === 0 && allTeam.length > 0 && updatedCampaigns.length > 0) {
      console.log("[seed] Creating team assignments...");
      for (let i = 0; i < Math.min(allTeam.length, updatedCampaigns.length); i++) {
        await storage.createTeamAssignment({
          teamId: allTeam[i].id,
          campaignId: updatedCampaigns[i].id
        });
      }
    }

    const resourcesData = [
      { name: "Hero Banner Design", type: "Design", format: "PSD", fileSize: "125", status: "Aprobado", campaignId: updatedCampaigns[0]?.id || null, lastModified: new Date().toISOString() },
      { name: "Email Copy Template", type: "Copy", format: "DOC", fileSize: "2", status: "En Revisión", campaignId: updatedCampaigns[1]?.id || null, lastModified: new Date().toISOString() },
      { name: "Product Video 30s", type: "Video", format: "MP4", fileSize: "450", status: "En Uso", campaignId: updatedCampaigns[0]?.id || null, lastModified: new Date().toISOString() },
      { name: "Landing Page Assets", type: "Asset", format: "PNG", fileSize: "85", status: "Disponible", campaignId: null, lastModified: new Date().toISOString() },
      { name: "Brand Guidelines 2024", type: "Document", format: "PDF", fileSize: "15", status: "Disponible", campaignId: null, lastModified: new Date().toISOString() },
      { name: "Social Media Graphics Pack", type: "Creative", format: "AI", fileSize: "220", status: "Aprobado", campaignId: updatedCampaigns[2]?.id || null, lastModified: new Date().toISOString() },
    ];

    const existingResources = await storage.getResources();

    if (existingResources.length === 0) {
      console.log("[seed] Creating resources...");
      for (const resource of resourcesData) {
        await storage.createResource(resource);
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
