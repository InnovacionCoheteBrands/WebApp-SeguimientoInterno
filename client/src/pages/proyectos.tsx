import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Calendar, Play, CheckCircle2, XCircle, ArrowLeft, Plus, Search,
    MoreVertical, Eye, Pencil, AlertCircle, Clock
} from "lucide-react";
import { Link, useLocation } from "wouter";
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
import { insertProjectSchema, type InsertProject, type UpdateProject } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    horizontalListSortingStrategy,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const STATUS_COLUMNS = [
    { id: "Planificación", label: "Planificación", icon: Calendar, color: "bg-muted/50 border-border text-muted-foreground" },
    { id: "En Curso", label: "En Curso", icon: Play, color: "bg-blue-500/10 border-blue-500/20 text-blue-600" },
    { id: "En Revisión", label: "En Revisión", icon: CheckCircle2, color: "bg-orange-500/10 border-orange-500/20 text-orange-600" },
    { id: "Bloqueado", label: "Bloqueado", icon: XCircle, color: "bg-red-500/10 border-red-500/20 text-red-600" },
    { id: "Completado", label: "Completado", icon: CheckCircle2, color: "bg-green-500/10 border-green-500/20 text-green-600" },
];

const SERVICE_TYPES = ["SEO", "Web", "Ads", "General"];

const HEALTH_COLORS = {
    green: { bg: "bg-green-500/20", border: "border-green-500/50", text: "text-green-500" },
    yellow: { bg: "bg-yellow-500/20", border: "border-yellow-500/50", text: "text-yellow-500" },
    red: { bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-500" },
};

// ----------------------------------------------------------------------
// DRAGGABLE PROJECT CARD
// ----------------------------------------------------------------------
function DraggableProjectCard({ project, onClick, onEdit }: { project: Project; onClick: () => void; onEdit: (e: any) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: project.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isOverdue = project.deadline && new Date(project.deadline) < new Date();

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/50 backdrop-blur-md hover:-translate-y-1 cursor-grab active:cursor-grabbing border-border/50 bg-card/40 hover:bg-card/60 ${isDragging ? 'ring-2 ring-primary shadow-2xl rotate-2 scale-105 z-50 bg-card/90' : ''}`}
                onClick={onClick}
            >
                <CardHeader className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-bold truncate flex items-center gap-2">
                                {project.name}
                                {isOverdue && <AlertCircle className="size-3 text-red-500" />}
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground truncate uppercase font-mono tracking-wider mt-1">
                                {project.client.companyName}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 p-0 rounded-sm text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={onEdit}
                                title="Editar proyecto"
                            >
                                <Pencil className="size-3.5" />
                            </Button>
                            <Badge variant="outline" className="rounded-sm text-[10px] px-1.5 h-5 font-normal border-border bg-secondary/20">
                                {project.serviceType}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                        <div className="flex justify-between text-[10px] mb-1.5 font-mono text-muted-foreground">
                            <span>PROGRESO</span>
                            <span className={project.progress === 100 ? "text-green-500" : ""}>{project.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${project.progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        {project.deadline ? (
                            <div className={`flex items-center gap-1.5 text-[10px] font-mono ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                                <Clock className="size-3" />
                                <span>
                                    {isOverdue ? 'VENCIDO ' : ''}
                                    {formatDistanceToNow(new Date(project.deadline), { addSuffix: true })}
                                </span>
                            </div>
                        ) : <div />}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ----------------------------------------------------------------------
// DROPPABLE COLUMN
// ----------------------------------------------------------------------
function DroppableColumn({ column, projects, onEdit, navigate }: { column: any; projects: Project[]; onEdit: (p: Project) => void; navigate: any }) {
    const { setNodeRef } = useSortable({ id: column.id });

    return (
        <div ref={setNodeRef} className="flex flex-col gap-3 h-full">
            <div className={`flex items-center gap-2 p-3 rounded-md border backdrop-blur-sm shadow-sm ${column.color}`}>
                <column.icon className="size-4 opacity-70" />
                <span className="font-bold text-xs uppercase tracking-wider">{column.label}</span>
                <Badge variant="outline" className="ml-auto rounded-sm text-xs border-white/20 bg-black/5 text-foreground/80">
                    {projects.length}
                </Badge>
            </div>

            <div className="space-y-3 flex-1 min-h-[150px] p-1 rounded-xl transition-colors bg-muted/5/0">
                <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {projects.map((project) => (
                        <DraggableProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => navigate(`/proyectos/${project.id}`)}
                            onEdit={(e) => {
                                e.stopPropagation();
                                onEdit(project);
                            }}
                        />
                    ))}
                </SortableContext>
                {projects.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border/50 rounded-sm">
                        Arrastra aquí
                    </div>
                )}
            </div>
        </div>
    );
}


export default function Proyectos() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterClient, setFilterClient] = useState<string>("all");
    const [filterService, setFilterService] = useState<string>("all");
    const [activeId, setActiveId] = useState<number | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, navigate] = useLocation();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require movement of 8px to start drag (prevents accidental clicks)
            },
        })
    );

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
        onError: (error) => {
            toast({
                title: "Error al crear proyecto",
                description: error.message,
                variant: "destructive"
            });
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
                health: project.health as "green" | "yellow" | "red",
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
        const dataToValidate = {
            ...formData,
            clientId: Number(formData.clientId) || 0,
            progress: Number(formData.progress) || 0,
            deadline: formData.deadline instanceof Date ? formData.deadline :
                (formData.deadline ? new Date(formData.deadline) : undefined),
        };

        const result = insertProjectSchema.safeParse(dataToValidate);

        if (!result.success) {
            const firstError = result.error.errors[0];
            toast({
                title: "Error de Validación",
                description: firstError.message || "Por favor verifique los datos ingresados.",
                variant: "destructive",
            });
            return;
        }

        if (selectedProject) {
            updateMutation.mutate({ id: selectedProject.id, data: result.data as UpdateProject });
        } else {
            createMutation.mutate(result.data);
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

    const activeProject = useMemo(() =>
        projects.find((p) => p.id === activeId),
        [activeId, projects]
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as number);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Check if dropped on a column (droppable)
            const isColumn = STATUS_COLUMNS.some(col => col.id === over.id);

            // If dropped on a column, update status
            if (isColumn) {
                const newStatus = over.id as string;
                updateMutation.mutate({
                    id: active.id as number,
                    data: { status: newStatus }
                });
            }
            // If dropped on another card (sortable), determine status of that card
            else {
                const overProject = projects.find(p => p.id === over.id);
                if (overProject && overProject.status !== activeProject?.status) {
                    updateMutation.mutate({
                        id: active.id as number,
                        data: { status: overProject.status }
                    });
                }
            }
        }
        setActiveId(null);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-3 sm:p-6 font-sans">
            <div className="max-w-[1700px] mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
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
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
                        {STATUS_COLUMNS.map((column) => (
                            <DroppableColumn
                                key={column.id}
                                column={column}
                                projects={filteredProjects.filter(p => p.status === column.id)}
                                onEdit={handleOpenDialog}
                                navigate={navigate}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeProject ? (
                            <div style={{ transform: 'rotate(2deg) scale(1.05)' }}>
                                <Card className="w-[300px] shadow-2xl border-primary ring-2 ring-primary bg-card opacity-90 cursor-grabbing">
                                    <CardHeader className="p-4 pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-sm font-bold truncate">
                                                    {activeProject.name}
                                                </CardTitle>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    {activeProject.client.companyName}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="text-[10px] font-mono text-muted-foreground">
                                            ARRASTRANDO...
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Project Form Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-6xl rounded-sm">
                    <DialogHeader className="px-10 pt-10 pb-6">
                        <DialogTitle>{selectedProject ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
                        <DialogDescription>
                            {selectedProject ? "Actualiza la información del proyecto" : "Crea un nuevo proyecto asignado a un cliente"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 px-10 py-2">
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
                                    onValueChange={(value) => setFormData({ ...formData, health: value as "green" | "yellow" | "red" })}
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

                        <DialogFooter className="px-10 py-6">
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
        </div>
    );
}
