/**
 * Proyectos - Grid/List Project View
 */

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  FolderKanban,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "@/components/forms/project-form";
import {
  ProjectAnalyticsMonthlyCards,
  ProjectAnalyticsPanels,
} from "@/components/projects/ProjectAnalyticsPanels";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters, type ProjectFiltersState } from "@/components/projects/ProjectFilters";
import {
  buildProjectAnalyticsRecord,
  buildProjectAnalyticsRecordFromBackend,
  computePortfolioAnalytics,
  mapProjectStatusToTab,
  normalizeComparableText,
} from "@/components/projects/project-analytics-helpers";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { StatusTabs, type ProjectStatusTab } from "@/components/projects/StatusTabs";
import { ViewToggle } from "@/components/projects/ViewToggle";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  fetchClientAccounts,
  fetchInstallmentsByProject,
  fetchProjects,
  fetchProjectServices,
  fetchProjectTeam,
  fetchServiceCatalog,
  fetchTeam,
  type Project,
  updateProject,
} from "@/lib/api";
import { fetchProjectFinancialAnalytics } from "@/lib/project-financial-analytics";

const FINANCIAL_QUERY_STALE_TIME = 60_000;

export default function Proyectos() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<ProjectStatusTab>("active");
  const [filters, setFilters] = useState<ProjectFiltersState>({
    search: "",
    type: "all",
    status: "all",
    employee: "all",
    client: "all",
    service: "all",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["client-accounts"],
    queryFn: fetchClientAccounts,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeam,
  });

  const { data: serviceCatalog = [], isPending: isServiceCatalogLoading } = useQuery({
    queryKey: ["service-catalog"],
    queryFn: fetchServiceCatalog,
  });

  const isFinancialAnalyticsEnabled = !isAuthLoading && user?.role === "admin";
  const financialAnalyticsQuery = useQuery({
    queryKey: ["projects", "financial-analytics"],
    queryFn: fetchProjectFinancialAnalytics,
    enabled: isFinancialAnalyticsEnabled,
    staleTime: FINANCIAL_QUERY_STALE_TIME,
  });

  const financialAnalyticsByProject = useMemo(
    () => new Map((financialAnalyticsQuery.data?.projects ?? []).map((project) => [project.id, project])),
    [financialAnalyticsQuery.data],
  );

  const shouldDeferFallbackQueries =
    isFinancialAnalyticsEnabled &&
    financialAnalyticsQuery.isPending &&
    !financialAnalyticsQuery.data &&
    !financialAnalyticsQuery.error;

  const fallbackProjects = useMemo(() => {
    if (shouldDeferFallbackQueries) {
      return [] as Project[];
    }

    return projects.filter((project) => !financialAnalyticsByProject.has(project.id));
  }, [financialAnalyticsByProject, projects, shouldDeferFallbackQueries]);

  const projectServicesQueries = useQueries({
    queries: fallbackProjects.map((project) => ({
      queryKey: ["project-services", project.id],
      queryFn: () => fetchProjectServices(project.id),
      staleTime: FINANCIAL_QUERY_STALE_TIME,
    })),
  });

  const projectTeamQueries = useQueries({
    queries: fallbackProjects.map((project) => ({
      queryKey: ["project-team", project.id],
      queryFn: () => fetchProjectTeam(project.id),
      staleTime: FINANCIAL_QUERY_STALE_TIME,
    })),
  });

  const projectInstallmentQueries = useQueries({
    queries: fallbackProjects.map((project) => ({
      queryKey: ["installments", project.id],
      queryFn: () => fetchInstallmentsByProject(project.id),
      staleTime: FINANCIAL_QUERY_STALE_TIME,
    })),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status?: string } }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "financial-analytics"] });
      toast({ title: "Estado actualizado" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el proyecto",
        variant: "destructive",
      });
    },
  });

  const statusCounts = useMemo(() => {
    const counts = { active: 0, on_hold: 0, completed: 0 };

    for (const project of projects) {
      const statusBucket = mapProjectStatusToTab(project.status);
      if (statusBucket) {
        counts[statusBucket] += 1;
      }
    }

    return counts;
  }, [projects]);

  const serviceCatalogMap = useMemo(
    () => new Map(serviceCatalog.map((service) => [service.id, service])),
    [serviceCatalog],
  );

  const teamDirectory = useMemo(
    () => employees.map((employee) => ({ id: employee.id, name: employee.name })),
    [employees],
  );

  const fallbackProjectServicesMap = useMemo(
    () => new Map(fallbackProjects.map((project, index) => [project.id, projectServicesQueries[index]?.data ?? []])),
    [fallbackProjects, projectServicesQueries],
  );

  const fallbackProjectTeamMap = useMemo(
    () => new Map(fallbackProjects.map((project, index) => [project.id, projectTeamQueries[index]?.data ?? []])),
    [fallbackProjects, projectTeamQueries],
  );

  const fallbackInstallmentsMap = useMemo(
    () => new Map(fallbackProjects.map((project, index) => [project.id, projectInstallmentQueries[index]?.data ?? []])),
    [fallbackProjects, projectInstallmentQueries],
  );

  const enrichedProjects = useMemo(() => {
    return projects.map((project) => {
      const backendAnalytics = financialAnalyticsByProject.get(project.id);

      if (backendAnalytics && financialAnalyticsQuery.data?.metadata) {
        return buildProjectAnalyticsRecordFromBackend({
          project,
          analyticsProject: backendAnalytics,
          metadata: financialAnalyticsQuery.data.metadata,
        });
      }

      return buildProjectAnalyticsRecord({
        project,
        projectServices: fallbackProjectServicesMap.get(project.id) ?? [],
        installments: fallbackInstallmentsMap.get(project.id) ?? [],
        teamAssignments: fallbackProjectTeamMap.get(project.id) ?? [],
        serviceCatalogMap,
        teamDirectory,
      });
    });
  }, [
    fallbackInstallmentsMap,
    fallbackProjectServicesMap,
    fallbackProjectTeamMap,
    financialAnalyticsByProject,
    financialAnalyticsQuery.data,
    projects,
    serviceCatalogMap,
    teamDirectory,
  ]);

  const availableStatuses = useMemo(() => {
    return Array.from(
      new Set(
        projects
          .map((project) => project.status)
          .filter((status): status is string => Boolean(status?.trim())),
      ),
    ).sort((left, right) => left.localeCompare(right, "es"));
  }, [projects]);

  const availableServices = useMemo(() => {
    const visibleServiceIds = new Set<number>();

    for (const project of enrichedProjects) {
      project.serviceIds.forEach((serviceId) => visibleServiceIds.add(serviceId));
    }

    return serviceCatalog
      .filter((service) => visibleServiceIds.has(service.id))
      .map((service) => ({ id: service.id, name: service.name }))
      .sort((left, right) => left.name.localeCompare(right.name, "es"));
  }, [enrichedProjects, serviceCatalog]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = normalizeComparableText(filters.search);

    return enrichedProjects.filter((project) => {
      if (mapProjectStatusToTab(project.status) !== activeTab) {
        return false;
      }

      if (normalizedSearch) {
        const matchesName = normalizeComparableText(project.name).includes(normalizedSearch);
        const matchesClient = normalizeComparableText(project.client?.companyName).includes(normalizedSearch);
        const matchesDescription = normalizeComparableText(project.description).includes(normalizedSearch);

        if (!matchesName && !matchesClient && !matchesDescription) {
          return false;
        }
      }

      if (filters.type !== "all" && project.serviceType !== filters.type) {
        return false;
      }

      if (filters.status !== "all" && project.status !== filters.status) {
        return false;
      }

      if (filters.employee !== "all" && !project.assignedEmployeeIds.includes(Number(filters.employee))) {
        return false;
      }

      if (filters.service !== "all" && !project.serviceIds.includes(Number(filters.service))) {
        return false;
      }

      if (filters.client !== "all" && project.clientId?.toString() !== filters.client) {
        return false;
      }

      return true;
    });
  }, [activeTab, enrichedProjects, filters]);

  const analyticsSummary = useMemo(
    () => computePortfolioAnalytics(filteredProjects),
    [filteredProjects],
  );

  const isFallbackAnalyticsLoading =
    !shouldDeferFallbackQueries &&
    (isServiceCatalogLoading ||
      projectServicesQueries.some((query) => query.isPending) ||
      projectTeamQueries.some((query) => query.isPending) ||
      projectInstallmentQueries.some((query) => query.isPending));

  const isAnalyticsLoading =
    (isFinancialAnalyticsEnabled && financialAnalyticsQuery.isPending) || isFallbackAnalyticsLoading;

  const financialErrorMessage =
    financialAnalyticsQuery.error instanceof Error ? financialAnalyticsQuery.error.message : null;

  const financialAlert = useMemo(() => {
    const discrepancySuffix =
      analyticsSummary.discrepancyProjectsCount > 0
        ? ` Hay ${analyticsSummary.discrepancyProjectsCount} proyecto(s) visible(s) con discrepancias.`
        : "";
    const warningSuffix =
      analyticsSummary.warningProjectsCount > 0
        ? ` Hay ${analyticsSummary.warningProjectsCount} proyecto(s) visible(s) con advertencias financieras.`
        : "";

    if (financialAnalyticsQuery.isError) {
      const isPermissionError = financialErrorMessage?.startsWith("403:");

      return {
        title: isPermissionError
          ? "Analitica financiera avanzada restringida"
          : "Analitica financiera avanzada no disponible",
        description: isPermissionError
          ? `La sesion actual no pudo leer la fuente contable protegida. La pantalla usa fallback operativo sin relajar permisos.${discrepancySuffix}${warningSuffix}`
          : `La lectura read-only del backend fallo temporalmente. La pantalla sigue operando con fallback seguro basado en datos operativos.${discrepancySuffix}${warningSuffix}`,
        icon: AlertTriangle,
        className: "border-amber-500/30 bg-amber-500/5 text-amber-50",
      };
    }

    if (!isFinancialAnalyticsEnabled && !isAuthLoading) {
      return {
        title: "Analitica financiera en modo degradado",
        description:
          `La sesion actual no es admin, asi que la pantalla usa fallback operativo y no consulta la lectura protegida del backend.${discrepancySuffix}${warningSuffix}`,
        icon: AlertTriangle,
        className: "border-amber-500/30 bg-amber-500/5 text-amber-50",
      };
    }

    if (analyticsSummary.sourceState === "mixed") {
      return {
        title: "Analitica financiera mixta",
        description:
          `La pantalla prioriza backend read-only y usa fallback operativo en ${analyticsSummary.fallbackProjectsCount} proyecto(s) visible(s) donde falto cobertura del consolidado.${discrepancySuffix}${warningSuffix}`,
        icon: AlertTriangle,
        className: "border-white/10 bg-zinc-950/40 text-zinc-100",
      };
    }

    if (analyticsSummary.sourceState === "fallback" && analyticsSummary.totalProjects > 0) {
      return {
        title: "Analitica financiera con fallback operativo",
        description:
          `La vista visible no recibio cobertura backend para estos proyectos y usa metricas operativas seguras como respaldo.${discrepancySuffix}${warningSuffix}`,
        icon: AlertTriangle,
        className: "border-amber-500/30 bg-amber-500/5 text-amber-50",
      };
    }

    if (
      analyticsSummary.sourceState === "backend" &&
      (analyticsSummary.discrepancyProjectsCount > 0 || analyticsSummary.warningProjectsCount > 0)
    ) {
      return {
        title: "Analitica financiera backend activa",
        description:
          `Los montos visibles priorizan la fuente read-only del backend (${analyticsSummary.accountingSourceOfTruth ?? "fuente contable protegida"}).${discrepancySuffix}${warningSuffix}`,
        icon: ShieldCheck,
        className: "border-white/10 bg-zinc-950/40 text-zinc-100",
      };
    }

    if (isFinancialAnalyticsEnabled && analyticsSummary.sourceState === "backend") {
      return {
        title: "Fuente contable backend activa",
        description:
          `Los montos visibles priorizan cobro real, pendiente real y cotizacion efectiva desde la lectura read-only del backend (${analyticsSummary.accountingSourceOfTruth ?? "fuente contable protegida"}).`,
        icon: ShieldCheck,
        className: "border-white/10 bg-zinc-950/40 text-zinc-100",
      };
    }

    return null;
  }, [
    analyticsSummary.accountingSourceOfTruth,
    analyticsSummary.discrepancyProjectsCount,
    analyticsSummary.fallbackProjectsCount,
    analyticsSummary.sourceState,
    analyticsSummary.totalProjects,
    analyticsSummary.warningProjectsCount,
    financialAnalyticsQuery.isError,
    financialErrorMessage,
    isAuthLoading,
    isFinancialAnalyticsEnabled,
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const collectedMetricLabel = isAnalyticsLoading
    ? "Total Cobrado (actualizando)"
    : analyticsSummary.sourceState === "backend"
      ? "Total Cobrado Real"
      : analyticsSummary.sourceState === "mixed"
        ? "Total Cobrado (mixto)"
        : "Total Cobrado (fallback)";

  const pendingMetricLabel = analyticsSummary.sourceState === "backend"
    ? "Pendiente Real por Cobrar"
    : analyticsSummary.sourceState === "mixed"
      ? "Pendiente por Cobrar (mixto)"
      : "Pendiente por Cobrar (fallback)";

  const quotationMetricLabel = analyticsSummary.sourceState === "backend"
    ? "Cotizacion Total Efectiva"
    : "Cotizacion Total";

  const handleStatusChange = (id: number, status: string) => {
    updateMutation.mutate({ id, data: { status } });
  };

  const handleEdit = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = (_id: number) => {
    void _id;
    toast({ title: "Funcion no implementada", description: "Eliminar proyecto" });
  };

  const handleNewProject = () => {
    setSelectedProject(null);
    setIsDialogOpen(true);
  };

  const FinancialAlertIcon = financialAlert?.icon;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 text-foreground sm:p-6">
      <div className="mx-auto max-w-[1700px] space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="h-11 w-11">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Gestion de Proyectos</h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Administra todos los proyectos de la empresa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
            <Button onClick={handleNewProject} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="bg-zinc-950/40 border-white/15 ring-1 ring-inset ring-white/10 transition-all duration-500 hover:bg-zinc-900/50 hover:border-white/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-white/5 bg-primary/10 p-2">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-50">{analyticsSummary.totalProjects}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Proyectos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 border-white/15 ring-1 ring-inset ring-white/10 transition-all duration-300 hover:bg-zinc-900/50 hover:border-white/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-white/5 bg-zinc-500/10 p-2">
                  <DollarSign className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-50">
                    {formatCurrency(analyticsSummary.totalQuotation)}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{quotationMetricLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 border-white/15 ring-1 ring-inset ring-white/10 transition-all duration-300 hover:bg-zinc-900/50 hover:border-white/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-white/5 bg-primary/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(analyticsSummary.totalCollected)}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {collectedMetricLabel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 border-white/15 ring-1 ring-inset ring-white/10 transition-all duration-300 hover:bg-zinc-900/50 hover:border-white/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-white/5 bg-zinc-500/10 p-2">
                  <Clock className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {formatCurrency(analyticsSummary.totalPending)}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{pendingMetricLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {financialAlert ? (
          <Alert className={financialAlert.className}>
            {FinancialAlertIcon ? <FinancialAlertIcon className="h-4 w-4" /> : null}
            <AlertTitle>{financialAlert.title}</AlertTitle>
            <AlertDescription>{financialAlert.description}</AlertDescription>
          </Alert>
        ) : null}

        <ProjectAnalyticsMonthlyCards summary={analyticsSummary} isLoading={isAnalyticsLoading} />

        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          clients={clients}
          employees={employees.map((employee) => ({ id: employee.id, name: employee.name }))}
          services={availableServices}
          statuses={availableStatuses}
        />

        <StatusTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={statusCounts}
        />

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.length === 0 ? (
              <div className="col-span-full rounded-lg border border-border/50 bg-card/30 py-12 text-center text-muted-foreground">
                No hay proyectos que mostrar
              </div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        ) : (
          <ProjectsTable
            projects={filteredProjects}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}

        <ProjectAnalyticsPanels
          summary={analyticsSummary}
          isLoading={isAnalyticsLoading}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader className="px-10 pb-6 pt-10">
              <DialogTitle>{selectedProject ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
              <DialogDescription>
                {selectedProject
                  ? "Actualiza la informacion del proyecto"
                  : "Crea un nuevo proyecto asignado a un cliente"}
              </DialogDescription>
            </DialogHeader>
            <div className="px-10 pb-10">
              <ProjectForm
                key={isDialogOpen ? (selectedProject ? `edit-${selectedProject.id}` : "new") : "closed"}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={selectedProject}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
