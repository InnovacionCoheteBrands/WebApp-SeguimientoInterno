/**
 * Control Proyectos - Project Progress Tracking
 * Part of Cohete Brands Replica
 * Shows projects with progress bars and allows progress updates
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FolderKanban,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Building2,
    MoreVertical,
    Edit,
    ExternalLink,
    Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchProjects, updateProject, type Project } from "@/lib/api";
import { Link } from "wouter";

export default function ControlProyectos() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [progressValue, setProgressValue] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Fetch projects
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: fetchProjects,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateProject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setSelectedProject(null);
            toast({ title: "Progreso actualizado" });
        },
        onError: () => {
            toast({ title: "Error", description: "No se pudo actualizar el progreso", variant: "destructive" });
        },
    });

    // Filter projects
    const filteredProjects = projects.filter((p) => {
        if (statusFilter === "all") return true;
        return p.status === statusFilter;
    });

    // Statistics
    const stats = {
        total: projects.length,
        active: projects.filter((p) => p.status === "active").length,
        completed: projects.filter((p) => p.status === "completed").length,
        avgProgress: projects.length > 0
            ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
            : 0,
    };

    const openUpdateModal = (project: Project) => {
        setSelectedProject(project);
        setProgressValue(project.progress || 0);
    };

    const handleProgressUpdate = () => {
        if (!selectedProject) return;

        const newStatus = progressValue === 100 ? "completed" :
            progressValue > 0 ? "active" : "planning";

        updateMutation.mutate({
            id: selectedProject.id,
            data: {
                progress: progressValue,
                status: newStatus,
            },
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-blue-500";
            case "completed": return "bg-green-500";
            case "on_hold": return "bg-yellow-500";
            case "cancelled": return "bg-red-500";
            default: return "bg-gray-500";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "active": return "Activo";
            case "completed": return "Completado";
            case "on_hold": return "En Pausa";
            case "planning": return "Planeación";
            case "cancelled": return "Cancelado";
            default: return status;
        }
    };

    const getHealthIcon = (health: string) => {
        switch (health) {
            case "good": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case "at_risk": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            case "critical": return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-muted-foreground" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Control de Proyectos</h1>
                    <p className="text-muted-foreground">Seguimiento de avance y estado de proyectos</p>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="planning">Planeación</SelectItem>
                        <SelectItem value="active">Activos</SelectItem>
                        <SelectItem value="completed">Completados</SelectItem>
                        <SelectItem value="on_hold">En Pausa</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <FolderKanban className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-xs text-muted-foreground">Activos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.completed}</p>
                                <p className="text-xs text-muted-foreground">Completados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10">
                                <Percent className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.avgProgress}%</p>
                                <p className="text-xs text-muted-foreground">Avance Promedio</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Projects List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Proyectos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredProjects.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No hay proyectos</p>
                        ) : (
                            filteredProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getHealthIcon(project.health || "unknown")}
                                                <Link href={`/proyectos/${project.id}`}>
                                                    <span className="font-medium hover:text-primary cursor-pointer">
                                                        {project.name}
                                                    </span>
                                                </Link>
                                                <Badge className={`${getStatusColor(project.status)} text-white text-xs`}>
                                                    {getStatusLabel(project.status)}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {project.client?.companyName || "Sin cliente"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {project.deadline
                                                        ? new Date(project.deadline).toLocaleDateString("es-MX")
                                                        : "Sin fecha límite"
                                                    }
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="flex items-center gap-3">
                                                <Progress value={project.progress || 0} className="flex-1 h-2" />
                                                <span className="text-sm font-medium w-12 text-right">
                                                    {project.progress || 0}%
                                                </span>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openUpdateModal(project)}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Actualizar Progreso
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/proyectos/${project.id}`}>
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Ver Detalle
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Update Progress Dialog */}
            <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Actualizar Progreso</DialogTitle>
                    </DialogHeader>
                    {selectedProject && (
                        <div className="space-y-6">
                            <div>
                                <p className="font-medium">{selectedProject.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedProject.client?.companyName}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Porcentaje de Avance</Label>
                                    <span className="text-2xl font-bold text-primary">{progressValue}%</span>
                                </div>
                                <Slider
                                    value={[progressValue]}
                                    onValueChange={(v) => setProgressValue(v[0])}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0%</span>
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground mb-1">Estado Resultante</p>
                                <Badge className={`${getStatusColor(
                                    progressValue === 100 ? "completed" :
                                        progressValue > 0 ? "active" : "planning"
                                )} text-white`}>
                                    {getStatusLabel(
                                        progressValue === 100 ? "completed" :
                                            progressValue > 0 ? "active" : "planning"
                                    )}
                                </Badge>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setSelectedProject(null)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleProgressUpdate}
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
