import { z } from "zod";

export const summaryModuleSchema = z.enum(["finance", "leads", "projects", "hr"]);
export type SummaryModule = z.infer<typeof summaryModuleSchema>;

const MAX_RAW_PAYLOAD_BYTES = 500_000;
const MAX_SAMPLE_ITEMS = 5;

export class SummaryValidationError extends Error {
    status: number;
    code: string;
    retryable: boolean;

    constructor(message: string, status = 400, code = "SUMMARY_VALIDATION_ERROR", retryable = false) {
        super(message);
        this.name = "SummaryValidationError";
        this.status = status;
        this.code = code;
        this.retryable = retryable;
    }
}

function safeJsonLength(data: unknown): number {
    return Buffer.byteLength(JSON.stringify(data ?? null), "utf8");
}

function numericValue(value: unknown): number {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
        const cleaned = value.replace(/[^\d.-]/g, "");
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function pickDefined<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== "")) as T;
}

function countBy<T>(items: T[], selector: (item: T) => unknown) {
    return items.reduce<Record<string, number>>((acc, item) => {
        const key = String(selector(item) || "Sin clasificar");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
}

function topEntries(record: Record<string, number>, maxItems = MAX_SAMPLE_ITEMS) {
    return Object.entries(record)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxItems)
        .map(([label, value]) => ({ label, value }));
}

function hasUsableData(data: unknown): boolean {
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === "object") return Object.keys(data as Record<string, unknown>).length > 0;
    return true;
}

function buildFinancePayload(data: Record<string, any>) {
    const monthlyData = Array.isArray(data.monthlyData) ? data.monthlyData : [];
    const incomeByCategory = data.incomeByCategory && typeof data.incomeByCategory === "object" ? data.incomeByCategory : {};
    const expensesByCategory = data.expensesByCategory && typeof data.expensesByCategory === "object" ? data.expensesByCategory : {};
    const lossMonths = monthlyData.filter((item: any) => numericValue(item.income) < numericValue(item.expenses)).length;

    return {
        overview: {
            totalIncome: numericValue(data.totalIncome),
            totalExpenses: numericValue(data.totalExpenses),
            netProfit: numericValue(data.netProfit),
            cashFlow: numericValue(data.cashFlow),
        },
        monthlyTrend: monthlyData.slice(-6).map((item: any) => ({
            month: item.month,
            income: numericValue(item.income),
            expenses: numericValue(item.expenses),
            net: numericValue(item.income) - numericValue(item.expenses),
        })),
        topIncomeCategories: topEntries(Object.fromEntries(Object.entries(incomeByCategory).map(([key, value]) => [key, numericValue(value)]))),
        topExpenseCategories: topEntries(Object.fromEntries(Object.entries(expensesByCategory).map(([key, value]) => [key, numericValue(value)]))),
        alerts: {
            lossMonths,
            hasNegativeNetProfit: numericValue(data.netProfit) < 0,
        },
    };
}

function buildLeadsPayload(data: any[]) {
    const totalEstimatedValue = data.reduce((sum, item) => sum + numericValue(item.estimatedValue), 0);
    const weightedPipelineValue = data.reduce((sum, item) => sum + numericValue(item.estimatedValue) * (numericValue(item.probability) / 100), 0);
    const overdueFollowUps = data.filter((item) => {
        if (!item.nextFollowUpDate) return false;
        const nextFollowUpDate = new Date(item.nextFollowUpDate);
        return !Number.isNaN(nextFollowUpDate.getTime()) && nextFollowUpDate.getTime() < Date.now();
    }).length;

    return {
        overview: {
            totalLeads: data.length,
            totalEstimatedValue,
            weightedPipelineValue,
            averageProbability: data.length > 0 ? Math.round(data.reduce((sum, item) => sum + numericValue(item.probability), 0) / data.length) : 0,
            overdueFollowUps,
        },
        statusBreakdown: topEntries(countBy(data, (item) => item.status)),
        originBreakdown: topEntries(countBy(data, (item) => item.origin)),
        priorityBreakdown: topEntries(countBy(data, (item) => item.priority)),
        sampleLeads: [...data]
            .sort((a, b) => numericValue(b.estimatedValue) - numericValue(a.estimatedValue))
            .slice(0, MAX_SAMPLE_ITEMS)
            .map((item) => pickDefined({
                name: item.name,
                company: item.company,
                status: item.status,
                origin: item.origin,
                priority: item.priority,
                estimatedValue: numericValue(item.estimatedValue),
                probability: numericValue(item.probability),
                nextFollowUpDate: item.nextFollowUpDate,
            })),
    };
}

function buildProjectsPayload(data: any[]) {
    const activeStatuses = new Set(["Planificacion", "En Desarrollo", "Pausa", "Planning", "In Progress", "Active"]);
    const delayedProjects = data.filter((item) => {
        if (!item.deadline) return false;
        const deadline = new Date(item.deadline);
        if (Number.isNaN(deadline.getTime())) return false;
        return deadline.getTime() < Date.now() && activeStatuses.has(String(item.status));
    }).length;

    return {
        overview: {
            totalProjects: data.length,
            totalBudget: data.reduce((sum, item) => sum + numericValue(item.budget || item.totalAmount || item.quotationAmount), 0),
            averageProgress: data.length > 0 ? Math.round(data.reduce((sum, item) => sum + numericValue(item.progress), 0) / data.length) : 0,
            delayedProjects,
        },
        statusBreakdown: topEntries(countBy(data, (item) => item.status)),
        healthBreakdown: topEntries(countBy(data, (item) => item.health)),
        serviceBreakdown: topEntries(countBy(data, (item) => item.serviceType)),
        sampleProjects: [...data]
            .sort((a, b) => numericValue(b.budget || b.totalAmount || b.quotationAmount) - numericValue(a.budget || a.totalAmount || a.quotationAmount))
            .slice(0, MAX_SAMPLE_ITEMS)
            .map((item) => pickDefined({
                name: item.name,
                client: item.client?.name,
                status: item.status,
                health: item.health,
                progress: numericValue(item.progress),
                budget: numericValue(item.budget || item.totalAmount || item.quotationAmount),
                deadline: item.deadline,
            })),
    };
}

function buildHrPayload(data: any[]) {
    return {
        overview: {
            totalEmployees: data.length,
            totalMonthlyPayroll: data.reduce((sum, item) => sum + numericValue(item.monthlySalary), 0),
            averageBillableRate: data.length > 0 ? Math.round(data.reduce((sum, item) => sum + numericValue(item.billableRate), 0) / data.length) : 0,
            totalWeeklyCapacity: data.reduce((sum, item) => sum + numericValue(item.weeklyCapacity), 0),
        },
        employeeStatusBreakdown: topEntries(countBy(data, (item) => item.employeeStatus)),
        availabilityBreakdown: topEntries(countBy(data, (item) => item.status)),
        payrollBreakdown: topEntries(countBy(data, (item) => item.payrollType)),
        roleBreakdown: topEntries(countBy(data, (item) => item.role || item.roleData?.roleName)),
        sampleEmployees: data.slice(0, MAX_SAMPLE_ITEMS).map((item) => pickDefined({
            name: item.name || [item.firstName, item.lastName].filter(Boolean).join(" "),
            role: item.role || item.roleData?.roleName,
            seniority: item.seniority || item.roleData?.roleLevel,
            employeeStatus: item.employeeStatus,
            availability: item.status,
            monthlySalary: numericValue(item.monthlySalary),
            billableRate: numericValue(item.billableRate),
        })),
    };
}

function buildGenericPayload(data: unknown) {
    if (Array.isArray(data)) {
        return { overview: { totalRecords: data.length }, sampleRecords: data.slice(0, MAX_SAMPLE_ITEMS) };
    }
    if (typeof data === "object" && data !== null) {
        return { overview: { keys: Object.keys(data as Record<string, unknown>) }, sample: data };
    }
    return { value: data };
}

export function prepareSummaryPayload(module: SummaryModule, data: unknown) {
    if (!hasUsableData(data)) {
        throw new SummaryValidationError("No hay informacion suficiente para generar un resumen.", 400, "SUMMARY_EMPTY_DATA");
    }

    const rawPayloadBytes = safeJsonLength(data);
    if (rawPayloadBytes > MAX_RAW_PAYLOAD_BYTES) {
        throw new SummaryValidationError(
            "Los datos del modulo son demasiado grandes para resumirse en una sola solicitud.",
            400,
            "SUMMARY_PAYLOAD_TOO_LARGE"
        );
    }

    let preparedData: Record<string, unknown>;
    switch (module) {
        case "finance":
            if (typeof data !== "object" || Array.isArray(data) || data === null) {
                throw new SummaryValidationError("El modulo financiero requiere un objeto resumen valido.", 400, "SUMMARY_INVALID_DATA");
            }
            preparedData = buildFinancePayload(data as Record<string, any>);
            break;
        case "leads":
            if (!Array.isArray(data)) {
                throw new SummaryValidationError("El modulo de leads requiere una lista valida de prospectos.", 400, "SUMMARY_INVALID_DATA");
            }
            preparedData = buildLeadsPayload(data);
            break;
        case "projects":
            if (!Array.isArray(data)) {
                throw new SummaryValidationError("El modulo de proyectos requiere una lista valida de proyectos.", 400, "SUMMARY_INVALID_DATA");
            }
            preparedData = buildProjectsPayload(data);
            break;
        case "hr":
            if (!Array.isArray(data)) {
                throw new SummaryValidationError("El modulo de recursos humanos requiere una lista valida de empleados.", 400, "SUMMARY_INVALID_DATA");
            }
            preparedData = buildHrPayload(data);
            break;
        default:
            preparedData = buildGenericPayload(data) as Record<string, unknown>;
            break;
    }

    return {
        rawPayloadBytes,
        preparedPayloadBytes: safeJsonLength(preparedData),
        preparedData,
    };
}
