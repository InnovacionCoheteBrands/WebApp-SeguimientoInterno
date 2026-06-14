import { request } from "./api";

export type ProjectFinancialReconciliationStatus =
  | "Conciliado"
  | "Sin transaccion"
  | "Sin parcialidad"
  | "Monto diferente"
  | "Pendiente"
  | "Incompleto"
  | "No aplica";

export interface ProjectFinancialAnalyticsTransaction {
  id: number;
  amount: number;
  type: string;
  status: string | null;
  isPaid: boolean;
  paidDate: string | null;
  projectId: number | null;
  installmentId: number | null;
  description: string | null;
}

export interface ProjectFinancialAnalyticsService {
  id: number;
  serviceId: number;
  name: string;
  quantity: number;
  unitCost: number;
  lineCost: number;
  costSource: "customCost" | "baseCost" | "missing";
}

export interface ProjectFinancialAnalyticsEmployee {
  id: number;
  teamMemberId: number;
  name: string;
  roleInProject: string | null;
  allocatedHours: number;
  internalCostHour: number;
  estimatedCost: number;
}

export interface ProjectFinancialAnalyticsProject {
  id: number;
  name: string;
  client: { id: number; companyName: string } | null;
  status: string;
  quotationEffective: number;
  plannedInstallmentsTotal: number;
  totalCollectedReal: number;
  totalCollectedOperational: number;
  pendingReal: number;
  pendingOperational: number;
  collectionDifference: number;
  reconciliationStatus: ProjectFinancialReconciliationStatus;
  installmentsTotal: number;
  installmentsPaid: number;
  installmentsPending: number;
  realTransactions: ProjectFinancialAnalyticsTransaction[];
  monthlyIncome: number;
  monthlyCost: number;
  monthlyProfit: number;
  margin: number | null;
  servicesConsidered: ProjectFinancialAnalyticsService[];
  assignedEmployees: ProjectFinancialAnalyticsEmployee[];
  discrepancies: string[];
  warnings: string[];
}

export interface ProjectFinancialAnalyticsResponse {
  metadata: {
    generatedAt: string;
    readOnly: true;
    currency: "MXN";
    accountingSourceOfTruth: "paid_financial_transactions";
    globalWarnings: string[];
  };
  summary: {
    totalProjects: number;
    quotationTotal: number;
    totalCollectedReal: number;
    totalCollectedOperational: number;
    pendingReal: number;
    pendingOperational: number;
    totalCollectionDifference: number;
    reconciledProjects: number;
    projectsWithDiscrepancies: number;
    pendingProjects: number;
    monthlyIncomeTotal: number;
    monthlyCostTotal: number;
    monthlyProfitTotal: number;
    globalMargin: number | null;
    globalWarnings: string[];
  };
  projects: ProjectFinancialAnalyticsProject[];
}

export async function fetchProjectFinancialAnalytics(): Promise<ProjectFinancialAnalyticsResponse> {
  const res = await request("/api/projects/financial-analytics");

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const errorMessage =
      errorData?.message ||
      errorData?.error ||
      res.statusText ||
      "Failed to fetch project financial analytics";

    throw new Error(`${res.status}: ${String(errorMessage)}`);
  }

  return res.json();
}
