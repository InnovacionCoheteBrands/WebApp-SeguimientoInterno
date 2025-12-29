import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
    ArrowLeft, Calendar, Clock, DollarSign, Users, Target, CheckCircle2,
    Circle, AlertCircle, TrendingUp, TrendingDown, Code, Search, Megaphone, Briefcase,
    Paperclip, FileCheck, Upload, AlertTriangle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { fetchProjectDetails, updateProjectDeliverable, uploadAndLinkToDeliverable, type ProjectDetails } from "@/lib/api";
import type { ProjectDeliverable } from "@shared/schema";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const HEALTH_STYLES = {
    green: { border: "border-l-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Saludable" },
    yellow: { border: "border-l-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Advertencia" },
    red: { border: "border-l-rose-500", bg: "bg-rose-500/10", text: "text-rose-500", label: "Crítico" },
};

const SERVICE_ICONS = {
    SEO: Search,
    Web: Code,
    Ads: Megaphone,
    General: Briefcase,
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export default function ProjectDetail() {
    const params = useParams<{ id: string }>();
    const projectId = parseInt(params.id || "0");
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [uploadingDeliverableId, setUploadingDeliverableId] = useState<number | null>(null);
    const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

    const { data: details, isLoading, error } = useQuery({
        queryKey: ["project-details", projectId],
        queryFn: () => fetchProjectDetails(projectId),
        enabled: projectId > 0,
    });

    const toggleDeliverableMutation = useMutation({
        mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
            updateProjectDeliverable(id, { completed }),
        onSuccess: () => {
            // Invalidar detalles del proyecto para actualizar KPIs y progreso local
            queryClient.invalidateQueries({ queryKey: ["project-details", projectId] });
            // CRÍTICO: Invalidar la lista de proyectos para que el tablero Kanban
            // refleje el progreso actualizado al volver a la vista principal
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "No se pudo actualizar el entregable",
                variant: "destructive",
            });
        },
    });

    const uploadAndLinkMutation = useMutation({
        mutationFn: async ({ deliverableId, file }: { deliverableId: number; file: File }) => {
            // For now, we'll use a data URL - in production this would upload to a storage service
            const dataUrl = await fileToDataUrl(file);
            return uploadAndLinkToDeliverable(deliverableId, projectId, {
                name: file.name,
                url: dataUrl,
                fileType: file.type,
                fileSize: file.size
            });
        },
        onSuccess: () => {
            toast({
                title: "Archivo subido",
                description: "El archivo ha sido vinculado al entregable y marcado como completado",
            });
            queryClient.invalidateQueries({ queryKey: ["project-details", projectId] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setUploadingDeliverableId(null);
        },
        onError: (error: Error) => {
            toast({
                title: "Error al subir archivo",
                description: error.message || "No se pudo subir el archivo",
                variant: "destructive",
            });
            setUploadingDeliverableId(null);
        },
    });

    // Helper to convert file to data URL
    const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Handle file selection
    const handleFileSelect = (deliverableId: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadingDeliverableId(deliverableId);
            uploadAndLinkMutation.mutate({ deliverableId, file });
        }
    };

    // Trigger file input
    const triggerFileUpload = (deliverableId: number) => {
        const input = fileInputRefs.current.get(deliverableId);
        if (input) {
            input.click();
        }
    };

    // Check if deliverable is overdue and blocking
    const isBlockingOverdue = (deliverable: ProjectDeliverable): boolean => {
        if (!deliverable.requiresFile || deliverable.linkedAttachmentId || !deliverable.dueDate) {
            return false;
        }
        return isPast(new Date(deliverable.dueDate));
    };

    // Calculate deliverables progress
    const deliverablesProgress = useMemo(() => {
        if (!details?.deliverables?.length) return 0;
        const completed = details.deliverables.filter(d => d.completed).length;
        return Math.round((completed / details.deliverables.length) * 100);
    }, [details?.deliverables]);

    // Parse service-specific fields
    const serviceFields = useMemo(() => {
        if (!details?.project?.serviceSpecificFields) return null;
        try {
            return JSON.parse(details.project.serviceSpecificFields);
        } catch {
            return null;
        }
    }, [details?.project?.serviceSpecificFields]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                        Cargando proyecto...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !details) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertCircle className="size-12 text-destructive mx-auto" />
                    <p className="text-muted-foreground">No se pudo cargar el proyecto</p>
                    <Link href="/proyectos">
                        <Button variant="outline" className="rounded-sm">
                            <ArrowLeft className="size-4 mr-2" />
                            Volver a Proyectos
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const { project, deliverables, teamAssignments, financial } = details;
    const healthStyle = HEALTH_STYLES[project.health as keyof typeof HEALTH_STYLES] || HEALTH_STYLES.green;
    const ServiceIcon = SERVICE_ICONS[project.serviceType as keyof typeof SERVICE_ICONS] || Briefcase;
    const isOverdue = project.deadline && new Date(project.deadline) < new Date();
    const isPositiveMargin = financial.margin >= 0;

    return (
        <div className="min-h-screen bg-background text-foreground p-3 sm:p-6 font-sans">
            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/proyectos">
                            <Button variant="outline" size="icon" className="rounded-sm h-11 w-11">
                                <ArrowLeft className="size-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                                    {project.name}
                                </h1>
                                <Badge className={`rounded-sm ${healthStyle.bg} ${healthStyle.text} border-0`}>
                                    {healthStyle.label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                                    {project.client.companyName}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <Badge variant="outline" className="rounded-sm font-mono text-xs">
                                    <ServiceIcon className="size-3 mr-1" />
                                    {project.serviceType}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-sm font-mono font-normal">
                            {project.status}
                        </Badge>
                        {project.deadline && (
                            <Badge
                                variant="outline"
                                className={`rounded-sm font-mono ${isOverdue ? "text-rose-500 border-rose-500/50" : ""}`}
                            >
                                <Calendar className="size-3 mr-1" />
                                {format(new Date(project.deadline), "dd MMM yyyy", { locale: es })}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Budget Card */}
                    <Card className="rounded-sm border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                                Presupuesto
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-display font-bold">
                                {formatCurrency(financial.budget)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actual Cost Card */}
                    <Card className="rounded-sm border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                                Costo Real
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-display font-bold">
                                {formatCurrency(financial.actualCost)}
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                <span>Gastos: {formatCurrency(financial.totalExpenses)}</span>
                                <span>Mano de obra: {formatCurrency(financial.laborCosts)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Margin Card */}
                    <Card className={`rounded-sm border-l-4 ${isPositiveMargin ? "border-l-emerald-500" : "border-l-rose-500"}`}>
                        <CardHeader className="pb-2">
                            <CardDescription className="font-mono text-[10px] uppercase tracking-wider flex items-center gap-2">
                                Margen Bruto
                                {isPositiveMargin ? (
                                    <TrendingUp className="size-3 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="size-3 text-rose-500" />
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-display font-bold ${isPositiveMargin ? "text-emerald-500" : "text-rose-500"}`}>
                                {formatCurrency(financial.margin)}
                            </div>
                            <div className={`text-sm ${isPositiveMargin ? "text-emerald-500/80" : "text-rose-500/80"}`}>
                                {financial.marginPercentage.toFixed(1)}% del presupuesto
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Card */}
                    <Card className="rounded-sm border-l-4 border-l-violet-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                                Progreso General
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-display font-bold">
                                {project.progress}%
                            </div>
                            <Progress value={project.progress} className="h-2 mt-2" />
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Deliverables Panel - Takes 2 columns */}
                    <Card className="lg:col-span-2 rounded-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50" />
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-sm bg-primary/10 border border-primary/20">
                                        <Target className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-display uppercase tracking-tight">
                                            Panel de Hitos
                                        </CardTitle>
                                        <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                                            Entregables del proyecto
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-display font-bold">{deliverablesProgress}%</div>
                                    <div className="text-xs text-muted-foreground">
                                        {deliverables.filter(d => d.completed).length} / {deliverables.length} completados
                                    </div>
                                </div>
                            </div>
                            <Progress value={deliverablesProgress} className="h-2 mt-4" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {deliverables.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-sm">
                                    No hay entregables definidos
                                </div>
                            ) : (
                                deliverables.map((deliverable) => {
                                    const isBlocking = isBlockingOverdue(deliverable);
                                    const requiresFileWithoutAttachment = deliverable.requiresFile && !deliverable.linkedAttachmentId;
                                    const isUploading = uploadingDeliverableId === deliverable.id;
                                    
                                    return (
                                        <div
                                            key={deliverable.id}
                                            className={`flex items-start gap-3 p-3 rounded-sm border transition-all ${
                                                deliverable.completed
                                                    ? "bg-muted/30 border-muted"
                                                    : isBlocking
                                                    ? "bg-rose-500/5 border-rose-500/50 animate-pulse-border"
                                                    : "bg-card border-border hover:border-primary/50"
                                            }`}
                                        >
                                            {/* Checkbox - disabled if requires file and no attachment */}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span>
                                                        <Checkbox
                                                            checked={deliverable.completed}
                                                            disabled={requiresFileWithoutAttachment || isUploading}
                                                            onCheckedChange={(checked) => {
                                                                if (!requiresFileWithoutAttachment) {
                                                                    toggleDeliverableMutation.mutate({
                                                                        id: deliverable.id,
                                                                        completed: checked as boolean,
                                                                    });
                                                                }
                                                            }}
                                                            className={`mt-0.5 ${requiresFileWithoutAttachment ? "cursor-not-allowed opacity-50" : ""}`}
                                                        />
                                                    </span>
                                                </TooltipTrigger>
                                                {requiresFileWithoutAttachment && (
                                                    <TooltipContent side="right">
                                                        <p>Sube un archivo para completar este hito</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-medium ${deliverable.completed ? "line-through text-muted-foreground" : ""}`}>
                                                    {deliverable.title}
                                                </div>
                                                {deliverable.description && (
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                        {deliverable.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    {deliverable.dueDate && (
                                                        <div className={`flex items-center gap-1 text-xs ${
                                                            isBlocking ? "text-rose-500 font-medium" : "text-muted-foreground"
                                                        }`}>
                                                            <Clock className="size-3" />
                                                            <span>
                                                                {formatDistanceToNow(new Date(deliverable.dueDate), {
                                                                    addSuffix: true,
                                                                    locale: es,
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Blocking warning badge */}
                                                    {isBlocking && (
                                                        <Badge variant="destructive" className="text-[10px] rounded-sm">
                                                            <AlertTriangle className="size-3 mr-1" />
                                                            Evidencia Requerida
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* File indicator / upload button */}
                                            {deliverable.requiresFile && (
                                                <div className="shrink-0">
                                                    {/* Hidden file input */}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        ref={(el) => {
                                                            if (el) fileInputRefs.current.set(deliverable.id, el);
                                                        }}
                                                        onChange={(e) => handleFileSelect(deliverable.id, e)}
                                                    />
                                                    
                                                    {isUploading ? (
                                                        <Loader2 className="size-5 text-primary animate-spin" />
                                                    ) : deliverable.linkedAttachmentId ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <FileCheck className="size-5 text-emerald-500 cursor-pointer" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Evidencia adjuntada</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    onClick={() => triggerFileUpload(deliverable.id)}
                                                                    className={`p-1 rounded-sm transition-colors ${
                                                                        isBlocking 
                                                                            ? "text-rose-500 hover:bg-rose-500/10" 
                                                                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                                    }`}
                                                                >
                                                                    <Paperclip className="size-5" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{isBlocking 
                                                                    ? "Evidencia Requerida para Salud del Proyecto" 
                                                                    : "Subir evidencia"
                                                                }</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Status icon */}
                                            {deliverable.completed ? (
                                                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                                            ) : (
                                                <Circle className="size-5 text-muted-foreground/30 shrink-0" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Column - Team & Service Info */}
                    <div className="space-y-6">
                        {/* Team Panel */}
                        <Card className="rounded-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-50" />
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-sm bg-blue-500/10 border border-blue-500/20">
                                        <Users className="size-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-display uppercase tracking-tight">
                                            Panel de Equipo
                                        </CardTitle>
                                        <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                                            {teamAssignments.length} miembros asignados
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {teamAssignments.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-sm">
                                        Sin equipo asignado
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {teamAssignments.map((assignment) => (
                                            <Tooltip key={assignment.id}>
                                                <TooltipTrigger asChild>
                                                    <div className="relative cursor-pointer group">
                                                        <Avatar className="size-12 border-2 border-background ring-2 ring-border group-hover:ring-primary transition-all">
                                                            <AvatarImage src={assignment.member.avatarUrl || undefined} />
                                                            <AvatarFallback className="bg-muted text-sm font-mono">
                                                                {assignment.member.name
                                                                    .split(" ")
                                                                    .map((n) => n[0])
                                                                    .join("")
                                                                    .slice(0, 2)
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {assignment.hoursAllocated && assignment.hoursAllocated > 0 && (
                                                            <Badge className="absolute -bottom-1 -right-1 h-5 px-1.5 text-[10px] bg-primary text-primary-foreground rounded-full">
                                                                {assignment.hoursAllocated}h
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="font-sans">
                                                    <div className="text-sm font-medium">{assignment.member.name}</div>
                                                    <div className="text-xs text-muted-foreground">{assignment.member.role}</div>
                                                    {assignment.hoursAllocated && assignment.hoursAllocated > 0 && (
                                                        <div className="text-xs mt-1 text-primary">
                                                            {assignment.hoursAllocated} horas asignadas
                                                        </div>
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Service Specific Card */}
                        {serviceFields && (
                            <Card className="rounded-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500/0 via-violet-500 to-violet-500/0 opacity-50" />
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-sm bg-violet-500/10 border border-violet-500/20">
                                            <ServiceIcon className="size-5 text-violet-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-display uppercase tracking-tight">
                                                {project.serviceType === "SEO" ? "Estrategia de Keywords" :
                                                    project.serviceType === "Web" ? "Tech Stack" :
                                                        project.serviceType === "Ads" ? "Configuración de Ads" :
                                                            "Detalles del Servicio"}
                                            </CardTitle>
                                            <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                                                Campos específicos
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {project.serviceType === "SEO" && (
                                        <>
                                            {serviceFields.keywords && (
                                                <div>
                                                    <div className="text-xs font-mono uppercase text-muted-foreground mb-2">Keywords Objetivo</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(serviceFields.keywords as string[]).map((keyword: string, i: number) => (
                                                            <Badge key={i} variant="secondary" className="rounded-sm">
                                                                {keyword}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {serviceFields.targetPositions && (
                                                <div className="mt-4">
                                                    <div className="text-xs font-mono uppercase text-muted-foreground mb-1">Posiciones Objetivo</div>
                                                    <div className="text-lg font-display font-bold">{serviceFields.targetPositions}</div>
                                                </div>
                                            )}
                                            {serviceFields.currentPositions && (
                                                <div>
                                                    <div className="text-xs font-mono uppercase text-muted-foreground mb-1">Posiciones Actuales</div>
                                                    <div className="text-lg font-display">{serviceFields.currentPositions}</div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {project.serviceType === "Web" && (
                                        <>
                                            {serviceFields.technologies && (
                                                <div>
                                                    <div className="text-xs font-mono uppercase text-muted-foreground mb-2">Tecnologías</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(serviceFields.technologies as string[]).map((tech: string, i: number) => (
                                                            <Badge key={i} variant="secondary" className="rounded-sm">
                                                                <Code className="size-3 mr-1" />
                                                                {tech}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {serviceFields.hosting && (
                                                <div className="mt-4">
                                                    <div className="text-xs font-mono uppercase text-muted-foreground mb-1">Hosting</div>
                                                    <div className="text-sm font-medium">{serviceFields.hosting}</div>
                                                </div>
                                            )}
                                            {serviceFields.domain && (
                                                <div>
                                                    <div className="text-xs font-mono uppercase text-muted-foreground mb-1">Dominio</div>
                                                    <div className="text-sm font-medium text-primary">{serviceFields.domain}</div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {project.serviceType === "Ads" && (
                                        <>
                                            {serviceFields.platforms && (
                                                <div>
                                                    <div className="text-xs font-mono uppercase text-muted-foreground mb-2">Plataformas</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(serviceFields.platforms as string[]).map((platform: string, i: number) => (
                                                            <Badge key={i} variant="secondary" className="rounded-sm">
                                                                {platform}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {serviceFields.monthlyBudget && (
                                                <div className="mt-4">
                                                    <div className="text-xs font-mono uppercase text-muted-foreground mb-1">Presupuesto Mensual Pauta</div>
                                                    <div className="text-lg font-display font-bold">{formatCurrency(serviceFields.monthlyBudget)}</div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {/* Fallback for General or custom fields */}
                                    {project.serviceType === "General" && (
                                        <div className="space-y-2">
                                            {Object.entries(serviceFields).map(([key, value]) => (
                                                <div key={key}>
                                                    <div className="text-xs font-mono uppercase text-muted-foreground">{key}</div>
                                                    <div className="text-sm">{String(value)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Description */}
                        {project.description && (
                            <Card className="rounded-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-display uppercase tracking-tight text-muted-foreground">
                                        Descripción
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-relaxed">{project.description}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
