/**
 * Control Proyectos - Tabular Progress Tracking View
 * Matches cohetebrands.web.app/control-proyectos design
 * Features: Progress bars, tracking table, status badges
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Target,
    FolderKanban,
    Play,
    CheckCircle2,
    TrendingUp,
    Search,
    Edit,
    Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchProjects, updateProject, type Project } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ControlProyectos() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // State
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [progressValue, setProgressValue] = useState(0);

    // Fetch data
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: fetchProjects,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { progress?: number; status?: string } }) =>
            updateProject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setSelectedProject(null);
            toast({ title: "Progreso actualizado" });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "No se pudo actualizar el progreso",
                variant: "destructive",
            });
        },
    });

    // Helper functions
    const parseBudget = (budget: string | number | null | undefined): number => {
        if (!budget) return 0;
        const num = typeof budget === "string" ? parseFloat(budget) : budget;
        return isNaN(num) ? 0 : num;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Map status to display
    const isActiveStatus = (status: string) =>
        ["active", "En Curso", "En Desarrollo", "En Revisión"].includes(status);
    const isCompletedStatus = (status: string) =>
        ["completed", "Completado", "Terminado"].includes(status);

    // Statistics
    const stats = useMemo(() => {
        const activeCount = projects.filter(p => isActiveStatus(p.status)).length;
        const completedCount = projects.filter(p => isCompletedStatus(p.status)).length;
        const avgProgress = projects.length > 0
            ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
            : 0;

        return {
            total: projects.length,
            active: activeCount,
            completed: completedCount,
            avgProgress,
        };
    }, [projects]);

    // Filter projects
    const filteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        const search = searchTerm.toLowerCase();
        return projects.filter((p) =>
            p.name.toLowerCase().includes(search) ||
            p.client?.companyName?.toLowerCase().includes(search)
        );
    }, [projects, searchTerm]);

    // Handlers
    const handleEditProgress = (project: Project) => {
        setSelectedProject(project);
        setProgressValue(project.progress || 0);
    };

    const handleSaveProgress = () => {
        if (!selectedProject) return;
        const newStatus = progressValue === 100 ? "completed" :
            progressValue > 0 ? "active" : "planning";
        updateMutation.mutate({
            id: selectedProject.id,
            data: { progress: progressValue, status: newStatus },
        });
    };

    const getProgressLabel = (progress: number) => {
        if (progress === 0) return "Sin progreso";
        if (progress < 25) return "Iniciando";
        if (progress < 50) return "En proceso";
        if (progress < 75) return "Avanzado";
        if (progress < 100) return "Casi listo";
        return "Completado";
    };

    const getProgressColor = (progress: number) => {
        if (progress === 0) return "bg-muted";
        if (progress < 50) return "bg-blue-500";
        if (progress < 100) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getStatusBadge = (status: string) => {
        if (isCompletedStatus(status)) {
            return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Terminado</Badge>;
        }
        if (status === "on_hold" || status === "Bloqueado") {
            return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">Pausado</Badge>;
        }
        if (status === "planning" || status === "Planificación") {
            return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">Planificación</Badge>;
        }
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">En Desarrollo</Badge>;
    };

    const getTypeBadge = (project: Project) => {
        const level = (project as any).level || "Plata";
        const colors: Record<string, string> = {
            Bronce: "bg-orange-500/10 text-orange-500 border-orange-500/30",
            Plata: "bg-gray-500/10 text-gray-400 border-gray-500/30",
            Oro: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
            Diamante: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        };
        return <Badge className={colors[level] || colors.Plata}>{level}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 border border-white/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                    <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-display font-bold tracking-tight text-zinc-100">Control de Proyectos</h1>
                    <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.2em] opacity-60 mt-1">
                        Operational Intelligence & Progress Monitoring
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-2xl relative overflow-hidden group hover:border-white/30 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-full bg-primary/10 border border-white/5">
                                <FolderKanban className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-mono font-bold text-zinc-100">{stats.total}</p>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Total Proyectos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-2xl relative overflow-hidden group hover:border-white/30 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-50" />
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-full bg-blue-500/10 border border-white/5">
                                <Play className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-mono font-bold text-zinc-100">{stats.active}</p>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Activos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-2xl relative overflow-hidden group hover:border-white/30 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-50" />
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-full bg-emerald-500/10 border border-white/5">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-mono font-bold text-zinc-100">{stats.completed}</p>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Completados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-2xl relative overflow-hidden group hover:border-white/30 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-full bg-primary/10 border border-white/5">
                                <TrendingUp className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-mono font-bold text-primary">{stats.avgProgress}%</p>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Avg Momentum</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input
                    placeholder="Buscar proyecto por nombre o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-zinc-950/40 backdrop-blur-md border-white/15 focus:border-white/30 rounded-full transition-all font-mono text-xs"
                />
            </div>

            {/* Projects Table */}
            <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-display uppercase tracking-tight text-zinc-100">Directorio de Ejecución</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table className="min-w-[900px]">
                        <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-white/10">
                                <TableHead className="font-mono text-[10px] uppercase text-muted-foreground pl-8">Proyecto</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase text-muted-foreground">Cliente</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase text-muted-foreground">Estado</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase text-muted-foreground">Tier</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase text-muted-foreground">Progreso</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase text-muted-foreground text-right">Cotización</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase text-muted-foreground text-right">Retainer</TableHead>
                                <TableHead className="font-mono text-[10px] uppercase text-muted-foreground text-right pr-8">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-16 font-mono text-xs italic opacity-40">
                                        No se detectaron activos en la búsqueda actual.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProjects.map((project) => (
                                    <TableRow key={project.id} className="group border-white/5 hover:bg-white/5 transition-colors">
                                        {/* Project Name */}
                                        <TableCell className="pl-8">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-zinc-800 border border-white/5 group-hover:border-primary/30 transition-colors">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary transition-colors" />
                                                </div>
                                                <span className="font-bold text-zinc-100 text-sm tracking-tight">{project.name}</span>
                                            </div>
                                        </TableCell>

                                        {/* Client */}
                                        <TableCell className="text-muted-foreground">
                                            {project.client?.companyName || "—"}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>{getStatusBadge(project.status)}</TableCell>

                                        {/* Type/Level */}
                                        <TableCell>{getTypeBadge(project)}</TableCell>

                                        {/* Progress */}
                                        {/* Progress */}
                                        <TableCell>
                                            <div className="space-y-2 min-w-[140px]">
                                                <div className="flex items-center justify-between text-[10px] font-mono">
                                                    <span className="text-zinc-100 font-bold">{project.progress || 0}%</span>
                                                    <span className="text-muted-foreground opacity-60 uppercase">{getProgressLabel(project.progress || 0)}</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden ring-1 ring-inset ring-white/5">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all duration-1000 rounded-full",
                                                            getProgressColor(project.progress || 0).replace('bg-', 'bg-opacity-80 bg-')
                                                        )}
                                                        style={{ width: `${project.progress || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Quotation */}
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(parseBudget((project as any).quotationAmount || project.budget))}
                                        </TableCell>

                                        {/* Maintenance */}
                                        <TableCell className="text-right text-muted-foreground">
                                            {(project as any).monthlyMaintenance
                                                ? `${formatCurrency(parseBudget((project as any).monthlyMaintenance))}/mes`
                                                : "—"}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEditProgress(project)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
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
                                    <span className="text-2xl font-bold text-primary">
                                        {progressValue}%
                                    </span>
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
                                <p className="text-xs text-muted-foreground mb-1">
                                    Estado Resultante
                                </p>
                                <Badge
                                    className={cn(
                                        progressValue === 100
                                            ? "bg-green-500 text-white"
                                            : progressValue > 0
                                                ? "bg-blue-500 text-white"
                                                : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {progressValue === 100
                                        ? "Completado"
                                        : progressValue > 0
                                            ? "En Curso"
                                            : "Planificación"}
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
                                    onClick={handleSaveProgress}
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
