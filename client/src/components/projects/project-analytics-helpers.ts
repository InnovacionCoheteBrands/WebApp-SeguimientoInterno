import type { Project, ProjectServiceWithDetails, ServiceCatalog } from "@/lib/api";
import type {
  ProjectFinancialAnalyticsProject,
  ProjectFinancialAnalyticsResponse,
  ProjectFinancialReconciliationStatus,
} from "@/lib/project-financial-analytics";
import type { Installment } from "@shared/schema";

export type ProjectStatusBucket = "active" | "on_hold" | "completed";
export type ProjectFinancialDataSource = "backend" | "fallback";
export type ProjectFinancialSourceState = "backend" | "fallback" | "mixed";

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
  operationalCollectedAmount: number;
  operationalPendingAmount: number;
  collectionDifference: number;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
  monthlyMargin: number | null;
  collectionPercentage: number;
  statusBucket: ProjectStatusBucket | null;
  serviceIds: number[];
  serviceNames: string[];
  assignedEmployeeIds: number[];
  assignedEmployeeNames: string[];
  financialDataSource: ProjectFinancialDataSource;
  financialWarnings: string[];
  financialDiscrepancies: string[];
  reconciliationStatus: ProjectFinancialReconciliationStatus | null;
  isReadOnlyFinancial: boolean;
  accountingSourceOfTruth: string | null;
}

export interface PaymentByProjectRow {
  projectId: number;
  projectName: string;
  clientName: string;
  quotation: number;
  collected: number;
  pending: number;
  operationalCollected: number;
  operationalPending: number;
  collectionDifference: number;
  percentage: number;
  financialDataSource: ProjectFinancialDataSource;
  discrepancyCount: number;
  warningCount: number;
  reconciliationStatus: ProjectFinancialReconciliationStatus | null;
}

export interface ProfitabilityByProjectRow {
  projectId: number;
  projectName: string;
  clientName: string;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
  monthlyMargin: number | null;
  isProfitable: boolean;
  financialDataSource: ProjectFinancialDataSource;
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
  totalOperationalCollected: number;
  totalOperationalPending: number;
  totalCollectionDifference: number;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
  sourceState: ProjectFinancialSourceState;
  backendProjectsCount: number;
  fallbackProjectsCount: number;
  discrepancyProjectsCount: number;
  warningProjectsCount: number;
  globalWarnings: string[];
  accountingSourceOfTruth: string | null;
  isReadOnlyFinancial: boolean;
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

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

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

  const effectiveQuotation = roundCurrency(getEffectiveQuotation(project));
  const collectedAmount = roundCurrency(getCollectedAmount(installments));
  const pendingAmount = roundCurrency(getPendingAmount(effectiveQuotation, collectedAmount));
  const monthlyRevenue = roundCurrency(parseNumericAmount(project.monthlyMaintenance));
  const monthlyCost = roundCurrency(getProjectMonthlyCost(project, projectServices, serviceCatalogMap));
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
    operationalCollectedAmount: collectedAmount,
    operationalPendingAmount: pendingAmount,
    collectionDifference: 0,
    monthlyRevenue,
    monthlyCost,
    monthlyProfit: roundCurrency(monthlyRevenue - monthlyCost),
    monthlyMargin: monthlyRevenue > 0 ? roundCurrency(((monthlyRevenue - monthlyCost) / monthlyRevenue) * 100) : null,
    collectionPercentage: effectiveQuotation > 0 ? (collectedAmount / effectiveQuotation) * 100 : 0,
    statusBucket: mapProjectStatusToTab(project.status),
    serviceIds,
    serviceNames,
    assignedEmployeeIds,
    assignedEmployeeNames,
    financialDataSource: "fallback",
    financialWarnings: [],
    financialDiscrepancies: [],
    reconciliationStatus: null,
    isReadOnlyFinancial: false,
    accountingSourceOfTruth: null,
  };
}

export function buildProjectAnalyticsRecordFromBackend(args: {
  project: Project;
  analyticsProject: ProjectFinancialAnalyticsProject;
  metadata: ProjectFinancialAnalyticsResponse["metadata"];
}): ProjectAnalyticsRecord {
  const { project, analyticsProject, metadata } = args;

  const effectiveQuotation = roundCurrency(parseNumericAmount(analyticsProject.quotationEffective));
  const collectedAmount = roundCurrency(parseNumericAmount(analyticsProject.totalCollectedReal));
  const pendingAmount = roundCurrency(parseNumericAmount(analyticsProject.pendingReal));
  const operationalCollectedAmount = roundCurrency(parseNumericAmount(analyticsProject.totalCollectedOperational));
  const operationalPendingAmount = roundCurrency(parseNumericAmount(analyticsProject.pendingOperational));
  const monthlyRevenue = roundCurrency(parseNumericAmount(analyticsProject.monthlyIncome));
  const monthlyCost = roundCurrency(parseNumericAmount(analyticsProject.monthlyCost));
  const monthlyProfit = roundCurrency(parseNumericAmount(analyticsProject.monthlyProfit));

  return {
    ...project,
    status: project.status || analyticsProject.status,
    effectiveQuotation,
    collectedAmount,
    pendingAmount,
    operationalCollectedAmount,
    operationalPendingAmount,
    collectionDifference: roundCurrency(parseNumericAmount(analyticsProject.collectionDifference)),
    monthlyRevenue,
    monthlyCost,
    monthlyProfit,
    monthlyMargin:
      analyticsProject.margin === null || analyticsProject.margin === undefined
        ? null
        : roundCurrency(parseNumericAmount(analyticsProject.margin)),
    collectionPercentage: effectiveQuotation > 0 ? (collectedAmount / effectiveQuotation) * 100 : 0,
    statusBucket: mapProjectStatusToTab(project.status || analyticsProject.status),
    serviceIds: analyticsProject.servicesConsidered.map((service) => service.serviceId),
    serviceNames: analyticsProject.servicesConsidered.map((service) => service.name),
    assignedEmployeeIds: analyticsProject.assignedEmployees.map((employee) => employee.teamMemberId),
    assignedEmployeeNames: analyticsProject.assignedEmployees.map(
      (employee) => employee.name?.trim() || `Empleado #${employee.teamMemberId}`,
    ),
    financialDataSource: "backend",
    financialWarnings: Array.from(new Set(analyticsProject.warnings)),
    financialDiscrepancies: Array.from(new Set(analyticsProject.discrepancies)),
    reconciliationStatus: analyticsProject.reconciliationStatus,
    isReadOnlyFinancial: metadata.readOnly,
    accountingSourceOfTruth: metadata.accountingSourceOfTruth,
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
  const backendProjectsCount = records.filter((record) => record.financialDataSource === "backend").length;
  const fallbackProjectsCount = totalProjects - backendProjectsCount;
  const sourceState: ProjectFinancialSourceState =
    backendProjectsCount === 0
      ? "fallback"
      : fallbackProjectsCount === 0
        ? "backend"
        : "mixed";

  const totalQuotation = roundCurrency(records.reduce((sum, record) => sum + record.effectiveQuotation, 0));
  const totalCollected = roundCurrency(records.reduce((sum, record) => sum + record.collectedAmount, 0));
  const totalPending = roundCurrency(records.reduce((sum, record) => sum + record.pendingAmount, 0));
  const totalOperationalCollected = roundCurrency(
    records.reduce((sum, record) => sum + record.operationalCollectedAmount, 0),
  );
  const totalOperationalPending = roundCurrency(
    records.reduce((sum, record) => sum + record.operationalPendingAmount, 0),
  );
  const totalCollectionDifference = roundCurrency(
    records.reduce((sum, record) => sum + record.collectionDifference, 0),
  );
  const monthlyRevenue = roundCurrency(records.reduce((sum, record) => sum + record.monthlyRevenue, 0));
  const monthlyCost = roundCurrency(records.reduce((sum, record) => sum + record.monthlyCost, 0));
  const monthlyProfit = roundCurrency(monthlyRevenue - monthlyCost);
  const globalWarnings = Array.from(new Set(records.flatMap((record) => record.financialWarnings)));
  const discrepancyProjectsCount = records.filter(
    (record) =>
      record.financialDiscrepancies.length > 0 ||
      Math.abs(record.collectionDifference) > 0.009,
  ).length;
  const warningProjectsCount = records.filter((record) => record.financialWarnings.length > 0).length;
  const backendSource = records.find((record) => record.accountingSourceOfTruth)?.accountingSourceOfTruth ?? null;

  return {
    totalProjects,
    totalQuotation,
    totalCollected,
    totalPending,
    totalOperationalCollected,
    totalOperationalPending,
    totalCollectionDifference,
    monthlyRevenue,
    monthlyCost,
    monthlyProfit,
    sourceState,
    backendProjectsCount,
    fallbackProjectsCount,
    discrepancyProjectsCount,
    warningProjectsCount,
    globalWarnings,
    accountingSourceOfTruth: backendSource,
    isReadOnlyFinancial:
      backendProjectsCount > 0 &&
      records
        .filter((record) => record.financialDataSource === "backend")
        .every((record) => record.isReadOnlyFinancial),
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
        operationalCollected: record.operationalCollectedAmount,
        operationalPending: record.operationalPendingAmount,
        collectionDifference: record.collectionDifference,
        percentage: record.collectionPercentage,
        financialDataSource: record.financialDataSource,
        discrepancyCount: record.financialDiscrepancies.length,
        warningCount: record.financialWarnings.length,
        reconciliationStatus: record.reconciliationStatus,
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
        monthlyMargin: record.monthlyMargin,
        isProfitable: record.monthlyProfit >= 0,
        financialDataSource: record.financialDataSource,
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
