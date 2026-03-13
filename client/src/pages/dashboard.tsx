import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Target,
  Briefcase,
  Wallet,
  TrendingUp,
  TrendingDown
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
import { useSystemSettings } from "@/hooks/use-system-settings";
import { formatCurrency } from "@/lib/format-currency";

export default function Dashboard() {
  const { data: settings } = useSystemSettings();
  const [activeModal, setActiveModal] = useState<"finance" | "leads" | "projects" | "hr" | null>(null);

  // --- Data Fetching ---
  const { data: leadsMetrics, isLoading: loadingLeads } = useQuery({
    queryKey: ["leads-metrics"],
    queryFn: fetchLeadsMetrics,
  });

  const { data: leads } = useQuery({
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
  const activeLeadsCount = leadsMetrics?.total || 0;
  // If we had a specific "active" field in metrics we'd use it, otherwise total is a decent proxy for now

  const activeProjectsCount = projects?.filter(p => p.status === "Active" || p.status === "In Progress").length || 0;
  const totalProjectsValue = projects?.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0) || 0;

  const activeEmployeesCount = team?.length || 0;

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
          trend={balance >= 0 ? "+ Rentable" : "- Déficit"}
          trendUp={balance >= 0}
          color="green"
          onClick={() => setActiveModal("finance")}
        />
        <KpiCard
          title="Leads Activos"
          value={activeLeadsCount.toString()}
          subValue={`Valor Est: ${formatCurrency(leadsMetrics?.avgValue ? leadsMetrics.avgValue * activeLeadsCount : 0)}`}
          icon={Target}
          trend="+ Nuevo Hoy"
          trendUp={true}
          color="blue"
          onClick={() => setActiveModal("leads")}
        />
        <KpiCard
          title="Proyectos Activos"
          value={activeProjectsCount.toString()}
          subValue={`Cotización: ${formatCurrency(totalProjectsValue)}`}
          icon={Briefcase}
          color="amber"
          trend="En tiempo"
          trendUp={true}
          onClick={() => setActiveModal("projects")}
        />
        <KpiCard
          title="Empleados"
          value={activeEmployeesCount.toString()}
          subValue="Nómina calc. pendiente"
          icon={Users}
          color="purple"
          trend="Estable"
          trendUp={true}
          onClick={() => setActiveModal("hr")}
        />
      </div>

      {/* Main Grid Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto">
        {/* CRM Widget */}
        <div className="min-h-[300px]">
          <CrmWidget data={{ leads, metrics: leadsMetrics }} loading={loadingLeads} />
        </div>

        {/* Projects Widget */}
        <div className="min-h-[300px]">
          <ProjectsWidget data={projects?.filter(p => p.status === "Active" || p.status === "In Progress")} loading={loadingProjects} />
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

      {/* --- Modales de KPI --- */}
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
        title="Proyectos Activos"
        description="Estado de ejecución y cotizaciones"
        data={projects?.filter(p => p.status === "Active" || p.status === "In Progress")}
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
