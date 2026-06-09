import { describe, expect, it } from "vitest";
import {
  buildProjectFinancialAnalytics,
  type ProjectFinancialAnalyticsReadModel,
} from "../services/project-financial-analytics";

const baseProject = (overrides: Partial<ProjectFinancialAnalyticsReadModel["projects"][number]> = {}) => ({
  id: 1,
  name: "Proyecto A",
  status: "En Desarrollo",
  clientId: 10,
  clientName: "Cliente A",
  quotationAmount: "1000",
  totalAmount: null,
  budget: "0",
  monthlyMaintenance: "0",
  ...overrides,
});

const build = (overrides: Partial<ProjectFinancialAnalyticsReadModel> = {}) => buildProjectFinancialAnalytics({
  projects: [baseProject()],
  installments: [],
  transactions: [],
  services: [],
  employees: [],
  ...overrides,
}, new Date("2026-06-09T12:00:00.000Z"));

describe("project financial analytics", () => {
  it("keeps a stable read-only contract", () => {
    const response = build();

    expect(response.metadata).toEqual({
      generatedAt: "2026-06-09T12:00:00.000Z",
      readOnly: true,
      currency: "MXN",
      accountingSourceOfTruth: "paid_financial_transactions",
      globalWarnings: expect.any(Array),
    });
    expect(response.summary).toEqual(expect.objectContaining({
      totalProjects: 1,
      quotationTotal: 1000,
      totalCollectedReal: 0,
      totalCollectedOperational: 0,
      pendingReal: 1000,
      pendingOperational: 1000,
    }));
    expect(response.projects[0]).toEqual(expect.objectContaining({
      id: 1,
      name: "Proyecto A",
      reconciliationStatus: "Pendiente",
      realTransactions: [],
      discrepancies: [],
      warnings: expect.any(Array),
    }));
  });

  it("reports a reconciled paid collection", () => {
    const response = build({
      installments: [{
        id: 100,
        projectId: 1,
        amount: "400",
        status: "collected",
        isPaid: true,
        transactionId: 200,
      }],
      transactions: [{
        id: 200,
        type: "Ingreso",
        amount: "400",
        status: "Pagado",
        isPaid: true,
        paidDate: "2026-06-01T00:00:00.000Z",
        projectId: 1,
        installmentId: 100,
        description: "Pago parcialidad",
      }],
    });

    expect(response.projects[0]).toEqual(expect.objectContaining({
      totalCollectedReal: 400,
      totalCollectedOperational: 400,
      pendingReal: 600,
      pendingOperational: 600,
      collectionDifference: 0,
      reconciliationStatus: "Conciliado",
      installmentsTotal: 1,
      installmentsPaid: 1,
      installmentsPending: 0,
      discrepancies: [],
    }));
  });

  it("reports paid installment without real transaction", () => {
    const response = build({
      installments: [{
        id: 100,
        projectId: 1,
        amount: "250",
        status: "collected",
        isPaid: true,
        transactionId: null,
      }],
    });

    expect(response.projects[0].reconciliationStatus).toBe("Sin transaccion");
    expect(response.projects[0].totalCollectedOperational).toBe(250);
    expect(response.projects[0].totalCollectedReal).toBe(0);
    expect(response.projects[0].discrepancies[0]).toContain("sin transaccion real");
  });

  it("reports real transaction without paid installment", () => {
    const response = build({
      transactions: [{
        id: 200,
        type: "Ingreso",
        amount: "250",
        status: "Pagado",
        isPaid: true,
        paidDate: null,
        projectId: 1,
        installmentId: null,
        description: "Pago manual",
      }],
    });

    expect(response.projects[0].reconciliationStatus).toBe("Sin parcialidad");
    expect(response.projects[0].totalCollectedReal).toBe(250);
    expect(response.projects[0].totalCollectedOperational).toBe(0);
    expect(response.projects[0].discrepancies[0]).toContain("sin parcialidad pagada");
  });

  it("reports different operational and real amounts", () => {
    const response = build({
      installments: [{
        id: 100,
        projectId: 1,
        amount: "300",
        status: "collected",
        isPaid: true,
        transactionId: 200,
      }],
      transactions: [{
        id: 200,
        type: "Ingreso",
        amount: "350",
        status: "Pagado",
        isPaid: true,
        paidDate: null,
        projectId: 1,
        installmentId: 100,
        description: "Pago parcialidad",
      }],
    });

    expect(response.projects[0].reconciliationStatus).toBe("Monto diferente");
    expect(response.projects[0].collectionDifference).toBe(50);
    expect(response.projects[0].discrepancies).toContain("El monto operativo pagado no coincide con el monto real pagado.");
  });

  it("never returns negative pending balances when real collection exceeds quote", () => {
    const response = build({
      projects: [baseProject({ quotationAmount: "100" })],
      transactions: [{
        id: 200,
        type: "Ingreso",
        amount: "150",
        status: "Pagado",
        isPaid: true,
        paidDate: null,
        projectId: 1,
        installmentId: null,
        description: "Pago excedente",
      }],
    });

    expect(response.projects[0].pendingReal).toBe(0);
    expect(response.projects[0].pendingOperational).toBe(100);
  });

  it("never returns negative operational pending balances", () => {
    const response = build({
      projects: [baseProject({ quotationAmount: "100" })],
      installments: [{
        id: 100,
        projectId: 1,
        amount: "150",
        status: "collected",
        isPaid: true,
        transactionId: null,
      }],
    });

    expect(response.projects[0].pendingOperational).toBe(0);
    expect(response.projects[0].pendingReal).toBe(100);
  });

  it("marks projects without quote as not applicable", () => {
    const response = build({ projects: [baseProject({ quotationAmount: null, totalAmount: null, budget: "0" })] });

    expect(response.projects[0].quotationEffective).toBe(0);
    expect(response.projects[0].reconciliationStatus).toBe("No aplica");
    expect(response.projects[0].warnings[0]).toContain("No hay cotizacion");
  });

  it("handles projects without installments and transactions as pending", () => {
    const response = build();

    expect(response.projects[0].installmentsTotal).toBe(0);
    expect(response.projects[0].realTransactions).toHaveLength(0);
    expect(response.projects[0].reconciliationStatus).toBe("Pendiente");
  });

  it("ignores cancelled or unpaid transactions for real collection", () => {
    const response = build({
      transactions: [
        { id: 200, type: "Ingreso", amount: "300", status: "Cancelado", isPaid: true, paidDate: null, projectId: 1, installmentId: null, description: null },
        { id: 201, type: "Ingreso", amount: "300", status: "Pendiente", isPaid: false, paidDate: null, projectId: 1, installmentId: null, description: null },
      ],
    });

    expect(response.projects[0].totalCollectedReal).toBe(0);
    expect(response.projects[0].realTransactions).toHaveLength(0);
  });

  it("uses zero monthly cost and warns when no reliable cost source exists", () => {
    const response = build({
      projects: [baseProject({ monthlyMaintenance: "500" })],
      services: [{ id: 1, projectId: 1, serviceId: 2, serviceName: "SEO", quantity: 1, customCost: null, baseCost: null }],
    });

    expect(response.projects[0].monthlyIncome).toBe(500);
    expect(response.projects[0].monthlyCost).toBe(0);
    expect(response.projects[0].monthlyProfit).toBe(500);
    expect(response.projects[0].margin).toBe(100);
    expect(response.projects[0].servicesConsidered[0].costSource).toBe("missing");
  });

  it("calculates monthly profit from service and team costs", () => {
    const response = build({
      projects: [baseProject({ monthlyMaintenance: "1000" })],
      services: [{ id: 1, projectId: 1, serviceId: 2, serviceName: "SEO", quantity: 2, customCost: "100", baseCost: "80" }],
      employees: [{ id: 1, projectId: 1, teamMemberId: 3, name: "Ana", roleInProject: "Lead", allocatedHours: 5, internalCostHour: "20" }],
    });

    expect(response.projects[0].monthlyCost).toBe(300);
    expect(response.projects[0].monthlyProfit).toBe(700);
    expect(response.projects[0].margin).toBe(70);
  });

  it("builds global summary from project details", () => {
    const response = build({
      projects: [
        baseProject({ id: 1, quotationAmount: "1000", monthlyMaintenance: "100" }),
        baseProject({ id: 2, quotationAmount: "500", monthlyMaintenance: "50" }),
      ],
      transactions: [
        { id: 200, type: "Ingreso", amount: "250", status: "Pagado", isPaid: true, paidDate: null, projectId: 1, installmentId: null, description: null },
        { id: 201, type: "Ingreso", amount: "100", status: "Pagado", isPaid: true, paidDate: null, projectId: 2, installmentId: null, description: null },
      ],
      services: [
        { id: 1, projectId: 1, serviceId: 2, serviceName: "SEO", quantity: 1, customCost: "10", baseCost: null },
        { id: 2, projectId: 2, serviceId: 3, serviceName: "Ads", quantity: 1, customCost: "20", baseCost: null },
      ],
    });

    expect(response.summary.totalProjects).toBe(2);
    expect(response.summary.quotationTotal).toBe(1500);
    expect(response.summary.totalCollectedReal).toBe(350);
    expect(response.summary.monthlyIncomeTotal).toBe(150);
    expect(response.summary.monthlyCostTotal).toBe(30);
    expect(response.summary.monthlyProfitTotal).toBe(120);
    expect(response.summary.globalMargin).toBe(80);
  });
});
