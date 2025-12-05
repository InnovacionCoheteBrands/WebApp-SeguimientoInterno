import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FolderKanban, ArrowLeft, Plus, Search, Filter, Calendar,
    Clock, AlertCircle, CheckCircle2, XCircle, Pause, Play
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    fetchProjects,
    fetchClientAccounts,
    createProject,
    updateProject,
    deleteProject,
    type Project
} from "@/lib/api";
import type { InsertProject, UpdateProject } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLUMNS = [
    { id: "Planificación", label: "Planificación", icon: Calendar, color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
    { id: "En Curso", label: "En Curso", icon: Play, color: "bg-green-500/10 text-green-500 border-green-500/30" },
    { id: "En Revisión", label: "En Revisión", icon: CheckCircle2, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
    { id: "Bloqueado", label: "Bloqueado", icon: XCircle, color: "bg-red-500/10 text-red-500 border-red-500/30" },
    { id: "Completado", label: "Completado", icon: CheckCircle2, color: "bg-gray-500/10 text-gray-500 border-gray-500/30" },
];

const SERVICE_TYPES = ["SEO", "Web", "Ads", "General"];

const HEALTH_COLORS = {
    green: { bg: "bg-green-500/20", border: "border-green-500/50", text: "text-green-500" },
    yellow: { bg: "bg-yellow-500/20", border: "border-yellow-500/50", text: "text-yellow-500" },
    red: { bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-500" },
};

export default function Proyectos() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterClient, setFilterClient] = useState<string>("all");
    const [filterService, setFilterService] = useState<string>("all");

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: projects = [] } = useQuery({
        queryKey: ["projects"],
        queryFn: fetchProjects,
    });

    const { data: clients = [] } = useQuery({
        queryKey: ["client-accounts"],
        queryFn: fetchClientAccounts,
    });

    const [formData, setFormData] = useState<Partial<InsertProject>>({
        clientId: 0,
        name: "",
        serviceType: "General",
        status: "Planificación",
        health: "green",
        progress: 0,
        description: "",
    });

    const createMutation = useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Éxito", description: "Proyecto creado exitosamente" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateProject }) => updateProject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Éxito", description: "Proyecto actualizado exitosamente" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast({ title: "Éxito", description: "Proyecto eliminado exitosamente" });
        },
    });

    const resetForm = () => {
        setFormData({
            clientId: 0,
            name: "",
            serviceType: "General",
            status: "Planificación",
            health: "green",
            progress: 0,
            description: "",
        });
        setSelectedProject(null);
    };

    const handleOpenDialog = (project?: Project) => {
        if (project) {
            setSelectedProject(project);
            setFormData({
                clientId: project.clientId,
                name: project.name,
                serviceType: project.serviceType,
                status: project.status,
                health: project.health,
                description: project.description || "",
                deadline: project.deadline ? new Date(project.deadline) : undefined,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientId || !formData.name) {
            toast({ title: "Error", description: "Por favor completa todos los campos requeridos", variant: "destructive" });
            return;
        }

        if (selectedProject) {
            updateMutation.mutate({ id: selectedProject.id, data: formData as UpdateProject });
        } else {
            createMutation.mutate(formData as InsertProject);
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.client.companyName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClient = filterClient === "all" || project.client.id.toString() === filterClient;
            const matchesService = filterService === "all" || project.serviceType === filterService;
            return matchesSearch && matchesClient && matchesService;
        });
    }, [projects, searchTerm, filterClient, filterService]);

    const projectsByStatus = useMemo(() => {
        const grouped: Record<string, Project[]> = {};
        STATUS_COLUMNS.forEach(col => {
            grouped[col.id] = filteredProjects.filter(p => p.status === col.id);
        });
        return grouped;
    }, [filteredProjects]);

    const handleStatusChange = (projectId: number, newStatus: string) => {
        updateMutation.mutate({
            id: projectId,
            data: { status: newStatus }
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-3 sm:p-6 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:wauthor">
                        <Link href="/">
                            <Button variant="outline" size="icon" className="rounded-sm h-11 w-11">
                                <ArrowLeft className="size-5" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Gestión de Proyectos</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                                TABLERO KANBAN DE PROYECTOS
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Badge variant="outline" className="rounded-sm font-mono font-normal text-primary border-primary/30 bg-primary/5">
                            {filteredProjects.length} PROYECTOS
                        </Badge>
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-4 flex-1 sm:flex-initial"
                        >
                            <Plus className="size-4 mr-2" />
                            Nuevo Proyecto
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border-border bg-card/50 rounded-sm">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar proyectos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 rounded-sm"
                                />
                            </div>
                            <Select value={filterClient} onValueChange={setFilterClient}>
                                <SelectTrigger className="h-11 rounded-sm">
                                    <SelectValue placeholder="Filtrar por cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los clientes</SelectItem>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id.toString()}>
                                            {client.companyName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterService} onValueChange={setFilterService}>
                                <SelectTrigger className="h-11 rounded-sm">
                                    <SelectValue placeholder="Filtrar por servicio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los servicios</SelectItem>
                                    {SERVICE_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {STATUS_COLUMNS.map((column) => {
                        const Icon = column.icon;
                        const projectsInColumn = projectsByStatus[column.id] || [];

                        return (
                            <div key={column.id} className="flex flex-col gap-3">
                                <div className={`flex items-center gap-2 p-3 rounded-sm border ${column.color}`}>
                                    <Icon className="size-4" />
                                    <span className="font-semibold text-sm">{column.label}</span>
                                    <Badge variant="secondary" className="ml-auto rounded-sm text-xs">
                                        {projectsInColumn.length}
                                    </Badge>
                                </div>

                                <div className="space-y-3 flex-1">
                                    {projectsInColumn.map((project) => {
                                        const health = HEALTH_COLORS[project.health as keyof typeof HEALTH_COLORS];
                                        const isOverdue = project.deadline && new Date(project.deadline) < new Date();

                                        return (
                                            <Card
                                                key={project.id}
                                                className="border-border bg-card rounded-sm hover:border-primary/50 transition-all cursor-pointer group"
                                                onClick={() => handleOpenDialog(project)}
                                            >
                                                <CardHeader className="p-4 pb-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <CardTitle className="text-base font-bold truncate">
                                                                {project.name}
                                                            </CardTitle>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {project.client.companyName}
                                                            </p>
                                                        </div>
                                                        <div className={`size-3 rounded-full ${health.bg} border-2 ${health.border} flex-shrink-0`} />
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-0 space-y-3">
                                                    <Badge variant="outline" className="rounded-sm text-xs">
                                                        {project.serviceType}
                                                    </Badge>

                                                    {/* Progress Bar */}
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1 font-mono text-muted-foreground">
                                                            <span>PROGRESO</span>
                                                            <span>{project.progress}%</span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary transition-all duration-500"
                                                                style={{ width: `${project.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Deadline */}
                                                    {project.deadline && (
                                                        <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                            <Clock className="size-3" />
                                                            <span>
                                                                {isOverdue ? 'Vencido ' : ''}
                                                                {formatDistanceToNow(new Date(project.deadline), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Status Change */}
                                                    <Select
                                                        value={project.status}
                                                        onValueChange={(newStatus) => {
                                                            handleStatusChange(project.id, newStatus);
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-9 rounded-sm text-xs" onClick={(e) => e.stopPropagation()}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {STATUS_COLUMNS.map((col) => (
                                                                <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}

                                    {projectsInColumn.length === 0 && (
                                        <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-sm">
                                            No hay proyectos
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Project Form Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-sm">
                    <DialogHeader>
                        <DialogTitle>{selectedProject ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
                        <DialogDescription>
                            {selectedProject ? "Actualiza la información del proyecto" : "Crea un nuevo proyecto asignado a un cliente"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="client">Cliente *</Label>
                            <Select
                                value={formData.clientId?.toString()}
                                onValueChange={(value) => setFormData({ ...formData, clientId: parseInt(value) })}
                            >
                                <SelectTrigger id="client" className="h-11 rounded-sm">
                                    <SelectValue placeholder="Selecciona un cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id.toString()}>
                                            {client.companyName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Proyecto *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ej. Campaña Q1 2025"
                                    className="h-11 rounded-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="serviceType">Tipo de Servicio *</Label>
                                <Select
                                    value={formData.serviceType}
                                    onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                                >
                                    <SelectTrigger id="serviceType" className="h-11 rounded-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SERVICE_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Estado</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger id="status" className="h-11 rounded-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_COLUMNS.map((col) => (
                                            <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="health">Salud</Label>
                                <Select
                                    value={formData.health}
                                    onValueChange={(value) => setFormData({ ...formData, health: value })}
                                >
                                    <SelectTrigger id="health" className="h-11 rounded-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="green">🟢 Verde (Sano)</SelectItem>
                                        <SelectItem value="yellow">🟡 Amarillo (Advertencia)</SelectItem>
                                        <SelectItem value="red">🔴 Rojo (Crítico)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deadline">Fecha Límite</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value ? new Date(e.target.value) : undefined })}
                                    className="h-11 rounded-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={formData.description ?? ""}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descripción del proyecto..."
                                className="rounded-sm min-h-[100px]"
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="rounded-sm h-11"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-sm h-11"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {selectedProject ? "Actualizar" : "Crear"} Proyecto
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
}
