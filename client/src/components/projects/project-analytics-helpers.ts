import type { Project, ProjectServiceWithDetails, ServiceCatalog } from "@/lib/api";
import type { Installment } from "@shared/schema";

export type ProjectStatusBucket = "active" | "on_hold" | "completed";

export interface ProjectTeamAssignmentLike {
  teamMemberId?: number | null;
  member?: {
    id: number;
    name?: string | null;
  } | null;
}

export interface TeamDirectoryEntry {
  id: number;
  name: string;
}

export interface ProjectAnalyticsRecord extends Project {
  effectiveQuotation: number;
  collectedAmount: number;
  pendingAmount: number;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
  collectionPercentage: number;
  statusBucket: ProjectStatusBucket | null;
  serviceIds: number[];
  serviceNames: string[];
  assignedEmployeeIds: number[];
  assignedEmployeeNames: string[];
}

export interface PaymentByProjectRow {
  projectId: number;
  projectName: string;
  clientName: string;
  quotation: number;
  collected: number;
  pending: number;
  percentage: number;
}

export interface ProfitabilityByProjectRow {
  projectId: number;
  projectName: string;
  clientName: string;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
  isProfitable: boolean;
}

export interface EmployeeDistributionRow {
  employeeId: number;
  employeeName: string;
  projectsCount: number;
}

export interface PaymentDistributionRow {
  name: "Cobrado" | "Pendiente";
  value: number;
  fill: string;
}

export interface PortfolioAnalyticsSummary {
  totalProjects: number;
  totalQuotation: number;
  totalCollected: number;
  totalPending: number;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
  paymentByProject: PaymentByProjectRow[];
  profitabilityByProject: ProfitabilityByProjectRow[];
  employeeDistribution: EmployeeDistributionRow[];
  paymentDistribution: PaymentDistributionRow[];
}

const ACTIVE_STATUSES = new Set([
  "active",
  "activo",
  "en curso",
  "en desarrollo",
  "en revision",
  "revision",
  "planificacion",
  "planeacion",
  "planning",
]);

const ON_HOLD_STATUSES = new Set([
  "on_hold",
  "on hold",
  "onhold",
  "pausa",
  "bloqueado",
  "blocked",
]);

const COMPLETED_STATUSES = new Set([
  "completed",
  "completado",
  "terminado",
  "finalizado",
  "cerrado",
  "done",
]);

export function normalizeComparableText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function parseNumericAmount(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/[^0-9.-]/g, "").trim();
    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function mapProjectStatusToTab(status: string | null | undefined): ProjectStatusBucket | null {
  const normalizedStatus = normalizeComparableText(status);

  if (!normalizedStatus) {
    return null;
  }

  if (ACTIVE_STATUSES.has(normalizedStatus)) {
    return "active";
  }

  if (ON_HOLD_STATUSES.has(normalizedStatus)) {
    return "on_hold";
  }

  if (COMPLETED_STATUSES.has(normalizedStatus)) {
    return "completed";
  }

  return null;
}

export function getEffectiveQuotation(project: Pick<Project, "quotationAmount" | "budget">): number {
  const quotationAmount = parseNumericAmount(project.quotationAmount);
  if (quotationAmount > 0) {
    return quotationAmount;
  }

  return parseNumericAmount(project.budget);
}

export function isCollectedInstallment(installment: Pick<Installment, "status" | "isPaid">): boolean {
  return installment.isPaid === true || normalizeComparableText(installment.status) === "collected";
}

export function getCollectedAmount(installments: Array<Pick<Installment, "amount" | "status" | "isPaid">>): number {
  return installments.reduce((total, installment) => {
    if (!isCollectedInstallment(installment as Pick<Installment, "status" | "isPaid">)) {
      return total;
    }

    return total + parseNumericAmount((installment as Pick<Installment, "amount">).amount);
  }, 0);
}

export function getPendingAmount(quotation: number, collectedAmount: number): number {
  return Math.max(quotation - collectedAmount, 0);
}

function getServiceUnitCost(
  projectService: ProjectServiceWithDetails,
  serviceCatalogMap: Map<number, ServiceCatalog>,
): number {
  const catalogService = serviceCatalogMap.get(projectService.serviceId);
  return parseNumericAmount(
    projectService.customCost ??
      catalogService?.baseCost ??
      projectService.service?.baseCost ??
      0,
  );
}

export function getProjectMonthlyCost(
  project: Pick<Project, "dealType" | "monthlyMaintenance">,
  projectServices: ProjectServiceWithDetails[],
  serviceCatalogMap: Map<number, ServiceCatalog>,
): number {
  const hasMonthlyRevenue = parseNumericAmount(project.monthlyMaintenance) > 0;
  const isRecurringProject = normalizeComparableText(project.dealType) === "iguala";

  if (!hasMonthlyRevenue || !isRecurringProject || projectServices.length === 0) {
    return 0;
  }

  return projectServices.reduce((total, projectService) => {
    const unitCost = getServiceUnitCost(projectService, serviceCatalogMap);
    const quantity = projectService.quantity ?? 1;
    return total + unitCost * quantity;
  }, 0);
}

function getUniqueServiceSnapshot(
  projectServices: ProjectServiceWithDetails[],
  serviceCatalogMap: Map<number, ServiceCatalog>,
): { serviceIds: number[]; serviceNames: string[] } {
  const serviceMap = new Map<number, string>();

  for (const projectService of projectServices) {
    const serviceName =
      projectService.service?.name?.trim() ||
      serviceCatalogMap.get(projectService.serviceId)?.name?.trim();

    if (!serviceName) {
      continue;
    }

    serviceMap.set(projectService.serviceId, serviceName);
  }

  return {
    serviceIds: Array.from(serviceMap.keys()),
    serviceNames: Array.from(serviceMap.values()),
  };
}

function getUniqueEmployeeSnapshot(
  project: Pick<Project, "assignedSellerId">,
  teamAssignments: ProjectTeamAssignmentLike[],
  teamDirectory: TeamDirectoryEntry[],
): { assignedEmployeeIds: number[]; assignedEmployeeNames: string[] } {
  const employeeMap = new Map<number, string>();

  for (const assignment of teamAssignments) {
    const employeeId = assignment.member?.id ?? assignment.teamMemberId ?? null;
    if (!employeeId) {
      continue;
    }

    employeeMap.set(employeeId, assignment.member?.name?.trim() || `Empleado #${employeeId}`);
  }

  if (employeeMap.size === 0 && project.assignedSellerId) {
    const assignedSeller = teamDirectory.find((employee) => employee.id === project.assignedSellerId);
    employeeMap.set(
      project.assignedSellerId,
      assignedSeller?.name?.trim() || `Empleado #${project.assignedSellerId}`,
    );
  }

  return {
    assignedEmployeeIds: Array.from(employeeMap.keys()),
    assignedEmployeeNames: Array.from(employeeMap.values()),
  };
}

export function buildProjectAnalyticsRecord(args: {
  project: Project;
  projectServices: ProjectServiceWithDetails[];
  installments: Installment[];
  teamAssignments: ProjectTeamAssignmentLike[];
  serviceCatalogMap: Map<number, ServiceCatalog>;
  teamDirectory?: TeamDirectoryEntry[];
}): ProjectAnalyticsRecord {
  const {
    project,
    projectServices,
    installments,
    teamAssignments,
    serviceCatalogMap,
    teamDirectory = [],
  } = args;

  const effectiveQuotation = getEffectiveQuotation(project);
  const collectedAmount = getCollectedAmount(installments);
  const pendingAmount = getPendingAmount(effectiveQuotation, collectedAmount);
  const monthlyRevenue = parseNumericAmount(project.monthlyMaintenance);
  const monthlyCost = getProjectMonthlyCost(project, projectServices, serviceCatalogMap);
  const { serviceIds, serviceNames } = getUniqueServiceSnapshot(projectServices, serviceCatalogMap);
  const { assignedEmployeeIds, assignedEmployeeNames } = getUniqueEmployeeSnapshot(
    project,
    teamAssignments,
    teamDirectory,
  );

  return {
    ...project,
    effectiveQuotation,
    collectedAmount,
    pendingAmount,
    monthlyRevenue,
    monthlyCost,
    monthlyProfit: monthlyRevenue - monthlyCost,
    collectionPercentage: effectiveQuotation > 0 ? (collectedAmount / effectiveQuotation) * 100 : 0,
    statusBucket: mapProjectStatusToTab(project.status),
    serviceIds,
    serviceNames,
    assignedEmployeeIds,
    assignedEmployeeNames,
  };
}

export function computePortfolioAnalytics(
  records: ProjectAnalyticsRecord[],
): PortfolioAnalyticsSummary {
  const employeeDistributionMap = new Map<number, EmployeeDistributionRow>();

  for (const record of records) {
    record.assignedEmployeeIds.forEach((employeeId, index) => {
      const current = employeeDistributionMap.get(employeeId);
      const employeeName = record.assignedEmployeeNames[index] || `Empleado #${employeeId}`;

      if (current) {
        current.projectsCount += 1;
        return;
      }

      employeeDistributionMap.set(employeeId, {
        employeeId,
        employeeName,
        projectsCount: 1,
      });
    });
  }

  const totalProjects = records.length;
  const totalQuotation = records.reduce((sum, record) => sum + record.effectiveQuotation, 0);
  const totalCollected = records.reduce((sum, record) => sum + record.collectedAmount, 0);
  const totalPending = records.reduce((sum, record) => sum + record.pendingAmount, 0);
  const monthlyRevenue = records.reduce((sum, record) => sum + record.monthlyRevenue, 0);
  const monthlyCost = records.reduce((sum, record) => sum + record.monthlyCost, 0);
  const monthlyProfit = monthlyRevenue - monthlyCost;

  return {
    totalProjects,
    totalQuotation,
    totalCollected,
    totalPending,
    monthlyRevenue,
    monthlyCost,
    monthlyProfit,
    paymentByProject: records
      .filter(
        (record) =>
          record.effectiveQuotation > 0 ||
          record.collectedAmount > 0 ||
          record.pendingAmount > 0,
      )
      .map((record) => ({
        projectId: record.id,
        projectName: record.name,
        clientName: record.client?.companyName || "Sin cliente",
        quotation: record.effectiveQuotation,
        collected: record.collectedAmount,
        pending: record.pendingAmount,
        percentage: record.collectionPercentage,
      }))
      .sort((left, right) => right.quotation - left.quotation),
    profitabilityByProject: records
      .filter((record) => record.statusBucket === "active" && record.monthlyRevenue > 0)
      .map((record) => ({
        projectId: record.id,
        projectName: record.name,
        clientName: record.client?.companyName || "Sin cliente",
        monthlyRevenue: record.monthlyRevenue,
        monthlyCost: record.monthlyCost,
        monthlyProfit: record.monthlyProfit,
        isProfitable: record.monthlyProfit >= 0,
      }))
      .sort((left, right) => right.monthlyProfit - left.monthlyProfit),
    employeeDistribution: Array.from(employeeDistributionMap.values()).sort(
      (left, right) => right.projectsCount - left.projectsCount || left.employeeName.localeCompare(right.employeeName),
    ),
    paymentDistribution: [
      { name: "Cobrado", value: totalCollected, fill: "#10b981" },
      { name: "Pendiente", value: totalPending, fill: "#f59e0b" },
    ],
  };
}
