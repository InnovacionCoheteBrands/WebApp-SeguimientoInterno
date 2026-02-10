/**
 * Proyectos - Grid/List Project View
 * Matches cohetebrands.web.app/proyectos design
 * Features: Grid/List toggle, Status tabs, Multi-filters, Premium cards
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FolderKanban,
    Clock,
    CheckCircle2,
    DollarSign,
    Plus,
    ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    fetchProjects,
    fetchClientAccounts,
    updateProject,
    fetchTeam,
    type Project,
} from "@/lib/api";

// Import new components
import { ViewToggle } from "@/components/projects/ViewToggle";
import { StatusTabs, type ProjectStatusTab } from "@/components/projects/StatusTabs";
import { ProjectFilters, type ProjectFiltersState } from "@/components/projects/ProjectFilters";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { ProjectForm } from "@/components/forms/project-form";

export default function Proyectos() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // View state
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [activeTab, setActiveTab] = useState<ProjectStatusTab>("active");
    const [filters, setFilters] = useState<ProjectFiltersState>({
        search: "",
        type: "all",
        status: "all",
        employee: "all",
        client: "all",
    });

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Fetch data
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

    // Update mutation for status change
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { status?: string } }) =>
            updateProject(id, data),
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

    // Map internal statuses to display statuses
    const mapStatusToTab = (status: string): ProjectStatusTab | null => {
        const mapping: Record<string, ProjectStatusTab> = {
            "En Curso": "active",
            "active": "active",
            "En Revisión": "active",
            "Planificación": "active",
            "planning": "active",
            "Bloqueado": "on_hold",
            "on_hold": "on_hold",
            "Completado": "completed",
            "completed": "completed",
        };
        return mapping[status] || null;
    };

    // Status counts for tabs
    const statusCounts = useMemo(() => {
        const counts = { active: 0, on_hold: 0, completed: 0 };
        projects.forEach((p) => {
            const tab = mapStatusToTab(p.status);
            if (tab) counts[tab]++;
        });
        return counts;
    }, [projects]);

    // Parse budget as number for calculations
    const parseBudget = (budget: string | number | null | undefined): number => {
        if (!budget) return 0;
        const num = typeof budget === "string" ? parseFloat(budget) : budget;
        return isNaN(num) ? 0 : num;
    };

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            // Tab filter
            const projectTab = mapStatusToTab(project.status);
            if (projectTab !== activeTab) return false;

            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesName = project.name.toLowerCase().includes(searchLower);
                const matchesClient = project.client?.companyName?.toLowerCase().includes(searchLower);
                const matchesDesc = project.description?.toLowerCase().includes(searchLower);
                if (!matchesName && !matchesClient && !matchesDesc) return false;
            }

            // Type filter
            if (filters.type !== "all" && project.serviceType !== filters.type) return false;

            // Client filter
            if (filters.client !== "all" && project.clientId?.toString() !== filters.client) return false;

            return true;
        });
    }, [projects, activeTab, filters]);

    // Statistics
    const stats = useMemo(() => ({
        total: projects.length,
        totalBudget: projects.reduce((sum, p) => sum + parseBudget(p.quotationAmount || p.budget), 0),
        collected: projects
            .filter((p) => mapStatusToTab(p.status) === "completed")
            .reduce((sum, p) => sum + parseBudget(p.quotationAmount || p.budget), 0),
        pending: projects
            .filter((p) => mapStatusToTab(p.status) !== "completed")
            .reduce((sum, p) => sum + parseBudget(p.quotationAmount || p.budget), 0),
    }), [projects]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Handlers
    const handleStatusChange = (id: number, status: string) => {
        updateMutation.mutate({ id, data: { status } });
    };

    const handleEdit = useCallback((project: Project) => {
        setSelectedProject(project);
        setIsDialogOpen(true);
    }, []);

    const handleDelete = (id: number) => {
        toast({ title: "Función no implementada", description: "Eliminar proyecto" });
    };

    const handleNewProject = () => {
        setSelectedProject(null);
        setIsDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-3 sm:p-6">
            <div className="max-w-[1700px] mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link href="/">
                            <Button variant="outline" size="icon" className=" h-11 w-11">
                                <ArrowLeft className="size-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Proyectos</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                Administra todos los proyectos de la empresa
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ViewToggle view={viewMode} onViewChange={setViewMode} />
                        <Button onClick={handleNewProject} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nuevo Proyecto
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <FolderKanban className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-xs text-muted-foreground">Total Proyectos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <DollarSign className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</p>
                                    <p className="text-xs text-muted-foreground">Cotización Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{formatCurrency(stats.collected)}</p>
                                    <p className="text-xs text-muted-foreground">Total Cobrado</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-500/10">
                                    <Clock className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.pending)}</p>
                                    <p className="text-xs text-muted-foreground">Pendiente por Cobrar</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <ProjectFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    clients={clients}
                    employees={employees}
                />

                {/* Status Tabs */}
                <StatusTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    counts={statusCounts}
                />

                {/* Projects View */}
                {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProjects.length === 0 ? (
                            <div className="col-span-full text-center text-muted-foreground py-12 bg-card/30 rounded-lg border border-border/50">
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

                {/* Project Form Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader className="px-10 pt-10 pb-6">
                            <DialogTitle>{selectedProject ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
                            <DialogDescription>
                                {selectedProject ? "Actualiza la información del proyecto" : "Crea un nuevo proyecto asignado a un cliente"}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="px-10 pb-10">
                            <ProjectForm
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
