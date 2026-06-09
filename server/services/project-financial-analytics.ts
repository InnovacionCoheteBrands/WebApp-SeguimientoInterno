export type ProjectFinancialReconciliationStatus =
  | "Conciliado"
  | "Sin transaccion"
  | "Sin parcialidad"
  | "Monto diferente"
  | "Pendiente"
  | "Incompleto"
  | "No aplica";

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

export interface ProjectFinancialAnalyticsReadModel {
  projects: ProjectFinancialProjectSource[];
  installments: ProjectFinancialInstallmentSource[];
  transactions: ProjectFinancialTransactionSource[];
  services: ProjectFinancialServiceSource[];
  employees: ProjectFinancialEmployeeSource[];
}

export interface ProjectFinancialProjectSource {
  id: number;
  name: string;
  status: string | null;
  clientId: number | null;
  clientName: string | null;
  quotationAmount: unknown;
  totalAmount: unknown;
  budget: unknown;
  monthlyMaintenance: unknown;
}

export interface ProjectFinancialInstallmentSource {
  id: number;
  projectId: number;
  amount: unknown;
  status: string | null;
  isPaid: boolean | null;
  paidDate?: Date | string | null;
  transactionId: number | null;
}

export interface ProjectFinancialTransactionSource {
  id: number;
  type: string | null;
  amount: unknown;
  status: string | null;
  isPaid: boolean | null;
  paidDate?: Date | string | null;
  projectId: number | null;
  installmentId: number | null;
  description: string | null;
}

export interface ProjectFinancialServiceSource {
  id: number;
  projectId: number;
  serviceId: number;
  serviceName: string | null;
  quantity: unknown;
  customCost: unknown;
  baseCost: unknown;
}

export interface ProjectFinancialEmployeeSource {
  id: number;
  projectId: number;
  teamMemberId: number;
  name: string | null;
  roleInProject: string | null;
  allocatedHours: unknown;
  internalCostHour: unknown;
}

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const toMoney = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const toNonNegativeInteger = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
};

const dateToIso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const isCancelledStatus = (status: string | null | undefined): boolean => {
  const normalized = (status ?? "").toLowerCase();
  return normalized === "cancelled" || normalized === "cancelado" || normalized === "cancelada";
};

const isPaidInstallment = (installment: ProjectFinancialInstallmentSource): boolean =>
  installment.isPaid === true || installment.status === "collected";

const isPaidIncomeTransaction = (transaction: ProjectFinancialTransactionSource): boolean =>
  transaction.type === "Ingreso" && transaction.isPaid === true && !isCancelledStatus(transaction.status);

const pickQuotation = (project: ProjectFinancialProjectSource): number => {
  const quotation = toMoney(project.quotationAmount);
  if (quotation > 0) return quotation;
  const total = toMoney(project.totalAmount);
  if (total > 0) return total;
  return toMoney(project.budget);
};

const deriveReconciliationStatus = (
  quotationEffective: number,
  operationalPaidTotal: number,
  realPaidTotal: number,
  paidInstallmentCount: number,
  paidRealTransactionCount: number,
  amountMismatch: boolean,
): ProjectFinancialReconciliationStatus => {
  if (quotationEffective <= 0) return "No aplica";
  if (paidInstallmentCount === 0 && paidRealTransactionCount === 0) return "Pendiente";
  if (paidInstallmentCount > 0 && paidRealTransactionCount === 0) return "Sin transaccion";
  if (paidRealTransactionCount > 0 && paidInstallmentCount === 0) return "Sin parcialidad";
  if (amountMismatch || roundMoney(operationalPaidTotal) !== roundMoney(realPaidTotal)) return "Monto diferente";
  return "Conciliado";
};

export const buildProjectFinancialAnalytics = (
  readModel: ProjectFinancialAnalyticsReadModel,
  generatedAt = new Date(),
): ProjectFinancialAnalyticsResponse => {
  const installmentsByProject = new Map<number, ProjectFinancialInstallmentSource[]>();
  const installmentProjectById = new Map<number, number>();
  for (const installment of readModel.installments) {
    const items = installmentsByProject.get(installment.projectId) ?? [];
    items.push(installment);
    installmentsByProject.set(installment.projectId, items);
    installmentProjectById.set(installment.id, installment.projectId);
  }

  const transactionsByProject = new Map<number, ProjectFinancialTransactionSource[]>();
  for (const transaction of readModel.transactions) {
    const projectId = transaction.projectId ?? (transaction.installmentId ? installmentProjectById.get(transaction.installmentId) : undefined);
    if (!projectId) continue;
    const items = transactionsByProject.get(projectId) ?? [];
    items.push(transaction);
    transactionsByProject.set(projectId, items);
  }

  const servicesByProject = new Map<number, ProjectFinancialServiceSource[]>();
  for (const service of readModel.services) {
    const items = servicesByProject.get(service.projectId) ?? [];
    items.push(service);
    servicesByProject.set(service.projectId, items);
  }

  const employeesByProject = new Map<number, ProjectFinancialEmployeeSource[]>();
  for (const employee of readModel.employees) {
    const items = employeesByProject.get(employee.projectId) ?? [];
    items.push(employee);
    employeesByProject.set(employee.projectId, items);
  }

  const projectDetails = readModel.projects.map((project): ProjectFinancialAnalyticsProject => {
    const projectWarnings: string[] = [];
    const discrepancies: string[] = [];
    const projectInstallments = installmentsByProject.get(project.id) ?? [];
    const activeInstallments = projectInstallments.filter((installment) => !isCancelledStatus(installment.status));
    const paidInstallments = activeInstallments.filter(isPaidInstallment);
    const projectTransactions = transactionsByProject.get(project.id) ?? [];
    const paidIncomeTransactions = projectTransactions.filter(isPaidIncomeTransaction);

    const quotationEffective = roundMoney(pickQuotation(project));
    if (quotationEffective <= 0) {
      projectWarnings.push("No hay cotizacion, total o presupuesto confiable para evaluar el proyecto.");
    }
    if (activeInstallments.length === 0) {
      projectWarnings.push("El proyecto no tiene parcialidades activas registradas.");
    }

    const plannedInstallmentsTotal = roundMoney(activeInstallments.reduce((sum, item) => sum + toMoney(item.amount), 0));
    const totalCollectedOperational = roundMoney(paidInstallments.reduce((sum, item) => sum + toMoney(item.amount), 0));
    const totalCollectedReal = roundMoney(paidIncomeTransactions.reduce((sum, item) => sum + toMoney(item.amount), 0));
    const paidInstallmentIds = new Set(paidInstallments.map((item) => item.id));

    for (const installment of paidInstallments) {
      const hasPaidTransaction = paidIncomeTransactions.some((transaction) =>
        transaction.installmentId === installment.id || transaction.id === installment.transactionId,
      );
      if (!hasPaidTransaction) {
        discrepancies.push(`Parcialidad ${installment.id} pagada sin transaccion real pagada vinculada.`);
      }
    }

    for (const transaction of paidIncomeTransactions) {
      if (!transaction.installmentId || !paidInstallmentIds.has(transaction.installmentId)) {
        discrepancies.push(`Transaccion ${transaction.id} pagada sin parcialidad pagada vinculada.`);
      }
    }

    const amountMismatch = roundMoney(totalCollectedOperational) !== roundMoney(totalCollectedReal);
    if (amountMismatch && paidInstallments.length > 0 && paidIncomeTransactions.length > 0) {
      discrepancies.push("El monto operativo pagado no coincide con el monto real pagado.");
    }

    const projectServices = servicesByProject.get(project.id) ?? [];
    const servicesConsidered = projectServices.map((service): ProjectFinancialAnalyticsService => {
      const quantity = toNonNegativeInteger(service.quantity, 1) || 1;
      const customCost = toMoney(service.customCost);
      const baseCost = toMoney(service.baseCost);
      const unitCost = customCost > 0 ? customCost : baseCost;
      const costSource = customCost > 0 ? "customCost" : baseCost > 0 ? "baseCost" : "missing";
      if (costSource === "missing") {
        projectWarnings.push(`Servicio ${service.serviceName ?? service.serviceId} sin costo confiable; se usa 0.`);
      }
      return {
        id: service.id,
        serviceId: service.serviceId,
        name: service.serviceName ?? `Servicio ${service.serviceId}`,
        quantity,
        unitCost: roundMoney(unitCost),
        lineCost: roundMoney(quantity * unitCost),
        costSource,
      };
    });

    if (servicesConsidered.length === 0) {
      projectWarnings.push("El proyecto no tiene servicios vinculados para estimar costos.");
    }

    const assignedEmployees = (employeesByProject.get(project.id) ?? []).map((employee): ProjectFinancialAnalyticsEmployee => {
      const allocatedHours = toNonNegativeInteger(employee.allocatedHours);
      const internalCostHour = toMoney(employee.internalCostHour);
      return {
        id: employee.id,
        teamMemberId: employee.teamMemberId,
        name: employee.name ?? `Equipo ${employee.teamMemberId}`,
        roleInProject: employee.roleInProject,
        allocatedHours,
        internalCostHour: roundMoney(internalCostHour),
        estimatedCost: roundMoney(allocatedHours * internalCostHour),
      };
    });

    if (assignedEmployees.length === 0) {
      projectWarnings.push("El proyecto no tiene empleados asignados.");
    }

    const serviceMonthlyCost = servicesConsidered.reduce((sum, item) => sum + item.lineCost, 0);
    const employeeMonthlyCost = assignedEmployees.reduce((sum, item) => sum + item.estimatedCost, 0);
    const monthlyIncome = roundMoney(toMoney(project.monthlyMaintenance));
    const monthlyCost = roundMoney(serviceMonthlyCost + employeeMonthlyCost);
    if (monthlyIncome > 0 && monthlyCost === 0) {
      projectWarnings.push("Hay mantenimiento mensual, pero no hay fuente confiable de costo mensual; se reporta 0.");
    }

    const monthlyProfit = roundMoney(monthlyIncome - monthlyCost);
    const margin = monthlyIncome > 0 ? roundMoney((monthlyProfit / monthlyIncome) * 100) : null;
    const reconciliationStatus = deriveReconciliationStatus(
      quotationEffective,
      totalCollectedOperational,
      totalCollectedReal,
      paidInstallments.length,
      paidIncomeTransactions.length,
      amountMismatch,
    );

    return {
      id: project.id,
      name: project.name,
      client: project.clientId && project.clientName ? { id: project.clientId, companyName: project.clientName } : null,
      status: project.status ?? "Sin estado",
      quotationEffective,
      plannedInstallmentsTotal,
      totalCollectedReal,
      totalCollectedOperational,
      pendingReal: roundMoney(Math.max(quotationEffective - totalCollectedReal, 0)),
      pendingOperational: roundMoney(Math.max(quotationEffective - totalCollectedOperational, 0)),
      collectionDifference: roundMoney(totalCollectedReal - totalCollectedOperational),
      reconciliationStatus,
      installmentsTotal: activeInstallments.length,
      installmentsPaid: paidInstallments.length,
      installmentsPending: activeInstallments.filter((item) => !isPaidInstallment(item)).length,
      realTransactions: paidIncomeTransactions.map((transaction) => ({
        id: transaction.id,
        amount: roundMoney(toMoney(transaction.amount)),
        type: transaction.type ?? "Sin tipo",
        status: transaction.status,
        isPaid: transaction.isPaid === true,
        paidDate: dateToIso(transaction.paidDate),
        projectId: transaction.projectId,
        installmentId: transaction.installmentId,
        description: transaction.description,
      })),
      monthlyIncome,
      monthlyCost,
      monthlyProfit,
      margin,
      servicesConsidered,
      assignedEmployees,
      discrepancies,
      warnings: projectWarnings,
    };
  });

  const globalWarnings = Array.from(new Set(projectDetails.flatMap((project) => project.warnings)));
  const monthlyIncomeTotal = roundMoney(projectDetails.reduce((sum, project) => sum + project.monthlyIncome, 0));
  const monthlyCostTotal = roundMoney(projectDetails.reduce((sum, project) => sum + project.monthlyCost, 0));
  const monthlyProfitTotal = roundMoney(monthlyIncomeTotal - monthlyCostTotal);

  return {
    metadata: {
      generatedAt: generatedAt.toISOString(),
      readOnly: true,
      currency: "MXN",
      accountingSourceOfTruth: "paid_financial_transactions",
      globalWarnings,
    },
    summary: {
      totalProjects: projectDetails.length,
      quotationTotal: roundMoney(projectDetails.reduce((sum, project) => sum + project.quotationEffective, 0)),
      totalCollectedReal: roundMoney(projectDetails.reduce((sum, project) => sum + project.totalCollectedReal, 0)),
      totalCollectedOperational: roundMoney(projectDetails.reduce((sum, project) => sum + project.totalCollectedOperational, 0)),
      pendingReal: roundMoney(projectDetails.reduce((sum, project) => sum + project.pendingReal, 0)),
      pendingOperational: roundMoney(projectDetails.reduce((sum, project) => sum + project.pendingOperational, 0)),
      totalCollectionDifference: roundMoney(projectDetails.reduce((sum, project) => sum + project.collectionDifference, 0)),
      reconciledProjects: projectDetails.filter((project) => project.reconciliationStatus === "Conciliado").length,
      projectsWithDiscrepancies: projectDetails.filter((project) => project.discrepancies.length > 0).length,
      pendingProjects: projectDetails.filter((project) => project.reconciliationStatus === "Pendiente").length,
      monthlyIncomeTotal,
      monthlyCostTotal,
      monthlyProfitTotal,
      globalMargin: monthlyIncomeTotal > 0 ? roundMoney((monthlyProfitTotal / monthlyIncomeTotal) * 100) : null,
      globalWarnings,
    },
    projects: projectDetails,
  };
};
