/**
 * Proyectos - Grid/List Project View
 */

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, DollarSign, FolderKanban, Plus } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    fetchClientAccounts,
    fetchInstallmentsByProject,
    fetchProjectServices,
    fetchProjectTeam,
    fetchProjects,
    fetchServiceCatalog,
    fetchTeam,
    updateProject,
    type Project,
} from "@/lib/api";
import {
    buildProjectAnalyticsRecord,
    computePortfolioAnalytics,
    mapProjectStatusToTab,
    normalizeComparableText,
} from "@/components/projects/project-analytics-helpers";
import {
    ProjectAnalyticsMonthlyCards,
    ProjectAnalyticsPanels,
} from "@/components/projects/ProjectAnalyticsPanels";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters, type ProjectFiltersState } from "@/components/projects/ProjectFilters";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { StatusTabs, type ProjectStatusTab } from "@/components/projects/StatusTabs";
import { ViewToggle } from "@/components/projects/ViewToggle";
import { ProjectForm } from "@/components/forms/project-form";

export default function Proyectos() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

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

    const projectServicesQueries = useQueries({
        queries: projects.map((project) => ({
            queryKey: ["project-services", project.id],
            queryFn: () => fetchProjectServices(project.id),
            staleTime: 60_000,
        })),
    });

    const projectTeamQueries = useQueries({
        queries: projects.map((project) => ({
            queryKey: ["project-team", project.id],
            queryFn: () => fetchProjectTeam(project.id),
            staleTime: 60_000,
        })),
    });

    const projectInstallmentQueries = useQueries({
        queries: projects.map((project) => ({
            queryKey: ["installments", project.id],
            queryFn: () => fetchInstallmentsByProject(project.id),
            staleTime: 60_000,
        })),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { status?: string } }) => updateProject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
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

    const enrichedProjects = useMemo(() => {
        return projects.map((project, index) =>
            buildProjectAnalyticsRecord({
                project,
                projectServices: projectServicesQueries[index]?.data ?? [],
                installments: projectInstallmentQueries[index]?.data ?? [],
                teamAssignments: projectTeamQueries[index]?.data ?? [],
                serviceCatalogMap,
                teamDirectory,
            }),
        );
    }, [
        projects,
        projectServicesQueries,
        projectInstallmentQueries,
        projectTeamQueries,
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

    const isAnalyticsLoading =
        isServiceCatalogLoading ||
        projectServicesQueries.some((query) => query.isPending) ||
        projectTeamQueries.some((query) => query.isPending) ||
        projectInstallmentQueries.some((query) => query.isPending);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 0,
        }).format(amount);
    };

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
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Cotizacion Total</p>
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
                                        {isAnalyticsLoading ? "Total Cobrado (actualizando)" : "Total Cobrado"}
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
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Pendiente por Cobrar</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

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
