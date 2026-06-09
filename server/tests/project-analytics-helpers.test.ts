import type { Installment } from "@shared/schema";
import type { Project, ProjectServiceWithDetails, ServiceCatalog } from "@/lib/api";
import {
  buildProjectAnalyticsRecord,
  computePortfolioAnalytics,
  getCollectedAmount,
  getPendingAmount,
  getProjectMonthlyCost,
  mapProjectStatusToTab,
} from "@/components/projects/project-analytics-helpers";

describe("project analytics helpers", () => {
  const catalogService = {
    id: 7,
    name: "SEO Mensual",
    baseCost: "1500",
    defaultPrice: "3000",
  } as ServiceCatalog;

  const project = {
    id: 99,
    clientId: 4,
    name: "Proyecto Demo",
    status: "Planificacion",
    quotationAmount: "12000",
    budget: "9000",
    monthlyMaintenance: "5000",
    dealType: "Iguala",
    assignedSellerId: 3,
    client: { companyName: "Cliente Demo" },
  } as Project;

  const projectService = {
    id: 1,
    projectId: 99,
    serviceId: 7,
    quantity: 2,
    customCost: null,
    customPrice: null,
    sellPrice: null,
    service: { id: 7, name: "SEO Mensual" },
  } as ProjectServiceWithDetails;

  const installments = [
    { amount: "3000", status: "collected", isPaid: false },
    { amount: "2000", status: "pending", isPaid: false },
    { amount: "1500", status: "pending", isPaid: true },
  ] as Installment[];

  it("maps project statuses into the expected tabs", () => {
    expect(mapProjectStatusToTab("En Desarrollo")).toBe("active");
    expect(mapProjectStatusToTab("Planificacion")).toBe("active");
    expect(mapProjectStatusToTab("Bloqueado")).toBe("on_hold");
    expect(mapProjectStatusToTab("Terminado")).toBe("completed");
  });

  it("calculates collected and pending amounts from real installment states", () => {
    const collected = getCollectedAmount(installments);

    expect(collected).toBe(4500);
    expect(getPendingAmount(12000, collected)).toBe(7500);
    expect(getPendingAmount(12000, 15000)).toBe(0);
  });

  it("returns zero percentage and zero monthly cost when there is no reliable source", () => {
    const noRevenueProject = { ...project, monthlyMaintenance: null, dealType: "Proyecto" } as Project;
    const analyticsRecord = buildProjectAnalyticsRecord({
      project: { ...project, quotationAmount: null, budget: "0" } as Project,
      projectServices: [],
      installments: [],
      teamAssignments: [],
      serviceCatalogMap: new Map(),
      teamDirectory: [],
    });

    expect(getProjectMonthlyCost(noRevenueProject, [projectService], new Map([[7, catalogService]]))).toBe(0);
    expect(analyticsRecord.collectionPercentage).toBe(0);
  });

  it("uses service catalog costs for recurring monthly profitability", () => {
    const analyticsRecord = buildProjectAnalyticsRecord({
      project,
      projectServices: [projectService],
      installments,
      teamAssignments: [],
      serviceCatalogMap: new Map([[7, catalogService]]),
      teamDirectory: [{ id: 3, name: "Vendedor Demo" }],
    });

    expect(analyticsRecord.monthlyCost).toBe(3000);
    expect(analyticsRecord.monthlyProfit).toBe(2000);
    expect(analyticsRecord.assignedEmployeeNames).toEqual(["Vendedor Demo"]);

    const summary = computePortfolioAnalytics([analyticsRecord]);
    expect(summary.totalCollected).toBe(4500);
    expect(summary.monthlyProfit).toBe(2000);
  });
});
