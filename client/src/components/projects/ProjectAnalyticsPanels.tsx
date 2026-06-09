import type { ComponentType, ReactNode } from "react";
import { BarChart3, Briefcase, DollarSign, Loader2, PieChart as PieChartIcon, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format-currency";
import type {
  PortfolioAnalyticsSummary,
} from "./project-analytics-helpers";

interface ProjectAnalyticsPanelsProps {
  summary: PortfolioAnalyticsSummary;
  isLoading?: boolean;
}

function EmptyAnalyticsState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-black/10 px-6 py-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function LoadingAnalyticsState() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 bg-black/10 px-6 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Actualizando analitica...</span>
    </div>
  );
}

function MonthlyMetricCard(props: {
  title: string;
  value: number;
  description: string;
  accentClassName: string;
  isLoading?: boolean;
}) {
  const { title, value, description, accentClassName, isLoading } = props;

  return (
    <Card className="bg-zinc-950/40 border-white/15 ring-1 ring-inset ring-white/10 hover:bg-zinc-900/50 hover:border-white/30 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {isLoading ? "Actualizando datos..." : description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${accentClassName}`}>{formatCurrency(value)}</div>
      </CardContent>
    </Card>
  );
}

function PanelShell(props: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { icon: Icon, title, description, children } = props;

  return (
    <Card className="bg-zinc-950/40 border-white/15 ring-1 ring-inset ring-white/10 hover:bg-zinc-900/50 hover:border-white/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg text-zinc-50">{title}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {description}
          </CardDescription>
        </div>
        <div className="rounded-xl border border-white/10 bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ProjectPaymentsStatusChart(props: {
  summary: PortfolioAnalyticsSummary;
  isLoading?: boolean;
}) {
  const { summary, isLoading } = props;

  if (isLoading) {
    return <LoadingAnalyticsState />;
  }

  if (summary.paymentByProject.length === 0) {
    return <EmptyAnalyticsState message="No hay proyectos con datos de pago para mostrar." />;
  }

  const chartHeight = Math.max(260, summary.paymentByProject.length * 52);

  return (
    <div className="max-h-[420px] overflow-y-auto pr-2">
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summary.paymentByProject} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value) => formatCurrency(Number(value))}
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="projectName"
              width={140}
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
            />
            <Bar dataKey="collected" stackId="payments" fill="#10b981" radius={[4, 4, 4, 4]} name="Cobrado" />
            <Bar dataKey="pending" stackId="payments" fill="#f59e0b" radius={[4, 4, 4, 4]} name="Pendiente" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PaymentsDistributionChart(props: {
  summary: PortfolioAnalyticsSummary;
  isLoading?: boolean;
}) {
  const { summary, isLoading } = props;

  if (isLoading) {
    return <LoadingAnalyticsState />;
  }

  const totalValue = summary.paymentDistribution.reduce((sum, entry) => sum + entry.value, 0);

  if (totalValue <= 0) {
    return <EmptyAnalyticsState message="No hay montos suficientes para graficar la distribucion de pagos." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={summary.paymentDistribution}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
            >
              {summary.paymentDistribution.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col justify-center gap-3">
        {summary.paymentDistribution.map((entry) => {
          const percentage = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;

          return (
            <div key={entry.name} className="rounded-lg border border-white/10 bg-black/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="text-sm text-zinc-100">{entry.name}</span>
                </div>
                <Badge variant="outline" className="border-white/10 bg-transparent text-zinc-200">
                  {percentage.toFixed(1)}%
                </Badge>
              </div>
              <div className="mt-2 text-xl font-semibold text-zinc-50">{formatCurrency(entry.value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfitabilitySection(props: {
  summary: PortfolioAnalyticsSummary;
  isLoading?: boolean;
}) {
  const { summary, isLoading } = props;

  if (isLoading) {
    return <LoadingAnalyticsState />;
  }

  if (summary.profitabilityByProject.length === 0) {
    return <EmptyAnalyticsState message="No hay proyectos activos con mantenimiento mensual para mostrar rentabilidad." />;
  }

  return (
    <div className="space-y-3">
      {summary.profitabilityByProject.map((project) => (
        <div
          key={project.projectId}
          className="grid gap-4 rounded-lg border border-white/10 bg-black/10 p-4 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))_auto_auto]"
        >
          <div>
            <div className="font-medium text-zinc-50">{project.projectName}</div>
            <div className="text-sm text-muted-foreground">{project.clientName}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Ingreso mensual</div>
            <div className="text-sm font-medium text-zinc-100">{formatCurrency(project.monthlyRevenue)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Costo mensual</div>
            <div className="text-sm font-medium text-zinc-100">{formatCurrency(project.monthlyCost)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Ganancia mensual</div>
            <div className={`text-sm font-medium ${project.monthlyProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(project.monthlyProfit)}
            </div>
          </div>
          <div className="flex items-center">
            <Badge
              variant="outline"
              className={project.isProfitable
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"}
            >
              {project.isProfitable ? "Rentable" : "Atencion"}
            </Badge>
          </div>
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm" disabled className="border-white/10 bg-transparent text-zinc-400">
              Ver Detalles
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmployeeDistributionSection(props: {
  summary: PortfolioAnalyticsSummary;
  isLoading?: boolean;
}) {
  const { summary, isLoading } = props;

  if (isLoading) {
    return <LoadingAnalyticsState />;
  }

  if (summary.employeeDistribution.length === 0) {
    return <EmptyAnalyticsState message="No hay empleados asignados a proyectos." />;
  }

  const chartHeight = Math.max(240, summary.employeeDistribution.length * 48);

  return (
    <div className="max-h-[420px] overflow-y-auto pr-2">
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summary.employeeDistribution} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} stroke="rgba(255,255,255,0.4)" fontSize={11} />
            <YAxis
              type="category"
              dataKey="employeeName"
              width={140}
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
            />
            <Tooltip
              formatter={(value: number) => [`${value} proyecto(s)`, "Asignados"]}
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
            />
            <Bar dataKey="projectsCount" fill="#3b82f6" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PaymentTrackingSection(props: {
  summary: PortfolioAnalyticsSummary;
  isLoading?: boolean;
}) {
  const { summary, isLoading } = props;

  if (isLoading) {
    return <LoadingAnalyticsState />;
  }

  if (summary.paymentByProject.length === 0) {
    return <EmptyAnalyticsState message="No hay proyectos con seguimiento de pagos disponible." />;
  }

  return (
    <div className="space-y-3">
      {summary.paymentByProject.map((project) => {
        const progressValue = Math.max(0, Math.min(project.percentage, 100));

        return (
          <div key={project.projectId} className="rounded-lg border border-white/10 bg-black/10 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="font-medium text-zinc-50">{project.projectName}</div>
                <div className="text-sm text-muted-foreground">{project.clientName}</div>
              </div>

              <div className="grid gap-3 text-sm lg:grid-cols-4 lg:items-center">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Cotizacion</div>
                  <div className="font-medium text-zinc-100">{formatCurrency(project.quotation)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Cobrado</div>
                  <div className="font-medium text-emerald-400">{formatCurrency(project.collected)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Pendiente</div>
                  <div className="font-medium text-amber-400">{formatCurrency(project.pending)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Porcentaje</div>
                  <div className="font-medium text-zinc-100">{project.percentage.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Progress value={progressValue} className="h-2 bg-white/5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Barra de progreso de cobro</span>
                <span>{project.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProjectAnalyticsMonthlyCards(props: {
  summary: PortfolioAnalyticsSummary;
  isLoading?: boolean;
}) {
  const { summary, isLoading } = props;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MonthlyMetricCard
        title="Total Ingresos Mensuales"
        value={summary.monthlyRevenue}
        description="Suma del mantenimiento mensual del conjunto visible."
        accentClassName="text-emerald-400"
        isLoading={isLoading}
      />
      <MonthlyMetricCard
        title="Total Costos Mensuales"
        value={summary.monthlyCost}
        description="Costos recurrentes detectados con datos confiables."
        accentClassName="text-zinc-100"
        isLoading={isLoading}
      />
      <MonthlyMetricCard
        title="Ganancia Mensual Total"
        value={summary.monthlyProfit}
        description="Ingresos mensuales menos costos mensuales."
        accentClassName={summary.monthlyProfit >= 0 ? "text-primary" : "text-rose-400"}
        isLoading={isLoading}
      />
    </div>
  );
}

export function ProjectAnalyticsPanels(props: ProjectAnalyticsPanelsProps) {
  const { summary, isLoading } = props;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <PanelShell
          icon={BarChart3}
          title="Estado de Pagos por Proyecto"
          description="Comparativo entre monto cobrado y pendiente por proyecto."
        >
          <ProjectPaymentsStatusChart summary={summary} isLoading={isLoading} />
        </PanelShell>

        <PanelShell
          icon={PieChartIcon}
          title="Distribucion de Pagos"
          description="Relacion acumulada entre cobrado y pendiente."
        >
          <PaymentsDistributionChart summary={summary} isLoading={isLoading} />
        </PanelShell>
      </div>

      <PanelShell
        icon={DollarSign}
        title="Rentabilidad Mensual por Proyecto"
        description="Ingreso, costo y ganancia mensual de los proyectos activos con mantenimiento."
      >
        <ProfitabilitySection summary={summary} isLoading={isLoading} />
      </PanelShell>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelShell
          icon={Users}
          title="Distribucion de Proyectos por Empleado"
          description="Conteo de proyectos visibles asignados por miembro del equipo."
        >
          <EmployeeDistributionSection summary={summary} isLoading={isLoading} />
        </PanelShell>

        <PanelShell
          icon={Briefcase}
          title="Seguimiento de Pagos por Proyecto"
          description="Cotizacion, cobrado, pendiente y avance de cobro por proyecto."
        >
          <PaymentTrackingSection summary={summary} isLoading={isLoading} />
        </PanelShell>
      </div>
    </div>
  );
}
