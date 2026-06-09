import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Target,
  Briefcase,
  Wallet
} from "lucide-react";
import {
  QuickActions,
  KpiCard,
  CrmWidget,
  ProjectsWidget,
  FinanceWidget,
  HrWidget,
  KpiDetailsDialog
} from "@/components/dashboard-widgets";
import { useState } from "react";
import {
  fetchLeads,
  fetchLeadsMetrics,
  fetchProjects,
  fetchFinancialSummary,
  fetchTeam
} from "@/lib/api";
import { formatCurrency } from "@/lib/format-currency";

const inactiveLeadStatuses = new Set(["Ganado", "Perdido", "Descartado"]);

function isActiveLead(status?: string | null) {
  return !inactiveLeadStatuses.has(status || "");
}

function isActiveProjectStatus(status?: string | null) {
  return [
    "active",
    "Active",
    "In Progress",
    "En Curso",
    "En Desarrollo",
    "En Revision",
    "En Revisión",
    "Planificacion",
    "Planificación",
    "planning"
  ].includes(status || "");
}

function isCompletedProjectStatus(status?: string | null) {
  return ["completed", "Completado", "Terminado"].includes(status || "");
}

function getProjectValue(project: { quotationAmount?: unknown; budget?: unknown }) {
  return Number(project.quotationAmount || project.budget) || 0;
}

function isActiveEmployee(employee: { employeeStatus?: string | null; status?: string | null }) {
  return employee.employeeStatus !== "Inactivo" && employee.status !== "Inactive";
}

export default function Dashboard() {
  const [activeModal, setActiveModal] = useState<"finance" | "leads" | "projects" | "hr" | null>(null);

  // --- Data Fetching ---
  const { data: leadsMetrics, isLoading: loadingLeadsMetrics } = useQuery({
    queryKey: ["leads-metrics"],
    queryFn: fetchLeadsMetrics,
  });

  const { data: leads, isLoading: loadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const { data: financialSummary, isLoading: loadingFinance } = useQuery({
    queryKey: ["financial-summary"],
    queryFn: () => fetchFinancialSummary(),
  });

  const { data: team, isLoading: loadingTeam } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeam,
  });

  // --- Derived Metrics ---
  const activeLeads = leads?.filter((lead) => isActiveLead(lead.status)) || [];
  const wonLeadsCount = leads?.filter((lead) => lead.status === "Ganado").length || 0;
  const activeLeadsCount = activeLeads.length;
  const activeLeadPipelineValue = activeLeads.reduce((acc, lead) => acc + (Number(lead.estimatedValue) || 0), 0);

  const activeProjectsCount = projects?.filter((project) => isActiveProjectStatus(project.status)).length || 0;
  const completedProjectsCount = projects?.filter((project) => isCompletedProjectStatus(project.status)).length || 0;
  const totalProjectsValue = projects?.reduce((acc, curr) => acc + getProjectValue(curr), 0) || 0;

  const activeEmployees = team?.filter((employee) => isActiveEmployee(employee)) || [];
  const inactiveEmployeesCount = (team?.length || 0) - activeEmployees.length;
  const activeEmployeesCount = activeEmployees.length;
  const monthlyPayroll = activeEmployees.reduce((acc, employee) => acc + (Number(employee.monthlySalary) || 0), 0);

  const balance = financialSummary?.netProfit || 0;
  const income = financialSummary?.totalIncome || 0;
  const expenses = financialSummary?.totalExpenses || 0;

  return (
    <div className="space-y-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard Principal</h1>
          <p className="text-muted-foreground font-mono text-sm">Resumen general de operaciones</p>
        </div>

        {/* Quick Actions Bar */}
        <QuickActions />
      </div>

      {/* Top Metrics Row (KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Balance Total"
          value={formatCurrency(balance)}
          subValue={`Ing: ${formatCurrency(income)} | Gas: ${formatCurrency(expenses)}`}
          icon={Wallet}
          trend={balance >= 0 ? "Neto positivo" : "Neto negativo"}
          trendUp={balance >= 0}
          color="green"
          onClick={() => setActiveModal("finance")}
        />
        <KpiCard
          title="Leads Activos"
          value={activeLeadsCount.toString()}
          subValue={`Pipeline: ${formatCurrency(activeLeadPipelineValue)}`}
          icon={Target}
          trend={`Ganados: ${wonLeadsCount}`}
          trendUp={true}
          color="blue"
          onClick={() => setActiveModal("leads")}
        />
        <KpiCard
          title="Proyectos Activos"
          value={activeProjectsCount.toString()}
          subValue={`Cotizacion: ${formatCurrency(totalProjectsValue)}`}
          icon={Briefcase}
          color="amber"
          trend={`Completados: ${completedProjectsCount}`}
          trendUp={true}
          onClick={() => setActiveModal("projects")}
        />
        <KpiCard
          title="Empleados Activos"
          value={activeEmployeesCount.toString()}
          subValue={`Nomina: ${formatCurrency(monthlyPayroll)}`}
          icon={Users}
          color="purple"
          trend={`Inactivos: ${inactiveEmployeesCount}`}
          trendUp={inactiveEmployeesCount === 0}
          onClick={() => setActiveModal("hr")}
        />
      </div>

      {/* Main Grid Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto">
        {/* CRM Widget */}
        <div className="min-h-[300px]">
          <CrmWidget data={{ leads, metrics: leadsMetrics }} loading={loadingLeads || loadingLeadsMetrics} />
        </div>

        {/* Projects Widget */}
        <div className="min-h-[300px]">
          <ProjectsWidget data={projects} loading={loadingProjects} />
        </div>

        {/* Finance Widget */}
        <div className="min-h-[300px]">
          <FinanceWidget data={financialSummary} loading={loadingFinance} />
        </div>

        {/* HR Widget */}
        <div className="min-h-[300px]">
          <HrWidget data={team} loading={loadingTeam} />
        </div>
      </div>

      {/* KPI details */}
      <KpiDetailsDialog
        isOpen={activeModal === "finance"}
        onClose={() => setActiveModal(null)}
        title="Balance Financiero"
        description="Listado exhaustivo del estado financiero"
        data={financialSummary}
        moduleName="finance"
      />
      <KpiDetailsDialog
        isOpen={activeModal === "leads"}
        onClose={() => setActiveModal(null)}
        title="Leads Activos"
        description="Resumen del CRM y prospectos comerciales"
        data={leads}
        moduleName="leads"
      />
      <KpiDetailsDialog
        isOpen={activeModal === "projects"}
        onClose={() => setActiveModal(null)}
        title="Proyectos"
        description="Estado de ejecucion y cotizaciones"
        data={projects}
        moduleName="projects"
      />
      <KpiDetailsDialog
        isOpen={activeModal === "hr"}
        onClose={() => setActiveModal(null)}
        title="Equipo y Recursos Humanos"
        description="Empleados registrados en el sistema"
        data={team}
        moduleName="hr"
      />
    </div>
  );
}
