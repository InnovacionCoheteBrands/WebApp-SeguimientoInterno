import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
    ArrowLeft, Calendar, Clock, DollarSign, Users, Target, CheckCircle2,
    Circle, AlertCircle, TrendingUp, TrendingDown, Code, Search, Briefcase,
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
import { InstallmentsTable } from "@/components/projects/installments-table";
import { ProfitabilityCalculator } from "@/components/projects/profitability-calculator";

const HEALTH_STYLES = {
    green: { border: "border-l-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Saludable" },
    yellow: { border: "border-l-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Advertencia" },
    red: { border: "border-l-rose-500", bg: "bg-rose-500/10", text: "text-rose-500", label: "Crítico" },
};

const SERVICE_ICONS = {
    SEO: Search,
    Web: Code,
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
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <Link href="/proyectos">
                            <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-white/10 hover:bg-white/5 transition-all">
                                <ArrowLeft className="size-5 text-zinc-400" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-zinc-100 italic">
                                    {project.name}
                                </h1>
                                <Badge className={`rounded-full px-4 py-1 text-[10px] font-mono uppercase tracking-widest ${healthStyle.bg} ${healthStyle.text} border border-white/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]`}>
                                    {healthStyle.label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-muted-foreground font-mono uppercase tracking-[0.2em] opacity-60">
                                    {project.client.companyName}
                                </span>
                                <span className="text-white/10 shrink-0">/</span>
                                <Badge variant="outline" className="rounded-full font-mono text-[9px] uppercase tracking-widest bg-white/5 border-white/10 text-zinc-400 px-3 h-6">
                                    <ServiceIcon className="size-3 mr-1.5 opacity-50" />
                                    {project.serviceType}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="rounded-full font-mono font-normal bg-zinc-950/40 border-white/10 text-zinc-500 text-[10px] uppercase tracking-widest px-4 py-1">
                            {project.status}
                        </Badge>
                        {project.deadline && (
                            <Badge
                                variant="outline"
                                className={`rounded-full font-mono text-[10px] uppercase tracking-widest px-4 py-1 border-white/10 ${isOverdue ? "text-rose-500 bg-rose-500/10 border-rose-500/20" : "bg-zinc-950/40 text-zinc-400"}`}
                            >
                                <Calendar className="size-3 mr-2 opacity-50" />
                                {format(new Date(project.deadline), "dd MMM yyyy", { locale: es })}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Budget Card */}
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group hover:border-white/30 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                        <CardHeader className="pb-2 pt-8 px-8">
                            <CardDescription className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                                Investment Cap
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <div className="text-3xl font-display font-bold text-zinc-100 tracking-tight">
                                {formatCurrency(financial.budget)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actual Cost Card */}
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group hover:border-white/30 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-50" />
                        <CardHeader className="pb-2 pt-8 px-8">
                            <CardDescription className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                                Burned Capital
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <div className="text-3xl font-display font-bold text-zinc-100 tracking-tight">
                                {formatCurrency(financial.actualCost)}
                            </div>
                            <div className="flex gap-4 mt-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground opacity-50">
                                <span>Exp: {formatCurrency(financial.totalExpenses)}</span>
                                <span className="opacity-30">|</span>
                                <span>Labor: {formatCurrency(financial.laborCosts)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Margin Card */}
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group hover:border-white/30 transition-all duration-300">
                        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${isPositiveMargin ? "via-emerald-500/30" : "via-rose-500/30"} to-transparent opacity-50`} />
                        <CardHeader className="pb-2 pt-8 px-8">
                            <CardDescription className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground opacity-60 flex items-center gap-2">
                                Tactical Margin
                                {isPositiveMargin ? (
                                    <TrendingUp className="size-3 text-emerald-400 opacity-80" />
                                ) : (
                                    <TrendingDown className="size-3 text-rose-400 opacity-80" />
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <div className={`text-3xl font-display font-bold tracking-tight ${isPositiveMargin ? "text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]" : "text-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.1)]"}`}>
                                {formatCurrency(financial.margin)}
                            </div>
                            <div className={`text-[10px] font-mono mt-2 uppercase tracking-widest ${isPositiveMargin ? "text-emerald-500/60" : "text-rose-500/60"}`}>
                                {financial.marginPercentage.toFixed(1)}% Yield Rate
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Card */}
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group hover:border-white/30 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-50" />
                        <CardHeader className="pb-2 pt-8 px-8">
                            <CardDescription className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                                Tactical Completion
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <div className="text-3xl font-display font-bold text-zinc-100 tracking-tight">
                                {project.progress}%
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-3 ring-1 ring-inset ring-white/5">
                                <Progress value={project.progress} className="h-full bg-violet-500/80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Installments Panel for Iguala Projects */}
                    {project.dealType === "Iguala" && (
                        <div className="lg:col-span-2">
                            <InstallmentsTable projectId={projectId} />
                        </div>
                    )}

                    {/* Deliverables Panel - Takes 2 columns */}
                    <Card className="lg:col-span-2 bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 border border-white/10">
                                        <Target className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-display uppercase tracking-tight text-zinc-100">
                                            Panel de Hitos
                                        </CardTitle>
                                        <CardDescription className="font-mono text-[10px] uppercase tracking-wider opacity-60">
                                            Operational Roadmap & Deliverables
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-display font-bold text-primary italic">{deliverablesProgress}%</div>
                                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-50">
                                        {deliverables.filter(d => d.completed).length} / {deliverables.length} COMPLETED
                                    </div>
                                </div>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-6 ring-1 ring-inset ring-white/5">
                                <Progress value={deliverablesProgress} className="h-full bg-primary/80" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-4">
                            {deliverables.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-[2rem] font-mono text-xs italic opacity-40">
                                    No hay entregables definidos para este activo proyectual.
                                </div>
                            ) : (
                                deliverables.map((deliverable) => {
                                    const isBlocking = isBlockingOverdue(deliverable);
                                    const requiresFileWithoutAttachment = deliverable.requiresFile && !deliverable.linkedAttachmentId;
                                    const isUploading = uploadingDeliverableId === deliverable.id;

                                    return (
                                        <div
                                            key={deliverable.id}
                                            className={`flex items-start gap-4 p-5 rounded-[1.5rem] border transition-all duration-300 ${deliverable.completed
                                                ? "bg-zinc-900/40 border-white/5 opacity-60"
                                                : isBlocking
                                                    ? "bg-rose-500/5 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.05)]"
                                                    : "bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/[0.07]"
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
                                                            className={`mt-1 h-5 w-5 rounded-full border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all ${requiresFileWithoutAttachment ? "cursor-not-allowed opacity-30" : ""}`}
                                                        />
                                                    </span>
                                                </TooltipTrigger>
                                                {requiresFileWithoutAttachment && (
                                                    <TooltipContent side="right" className="bg-zinc-950 border-white/10 font-mono text-[9px] uppercase tracking-widest p-2">
                                                        <p>Sube un archivo para completar este hito</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>

                                            <div className="flex-1 min-w-0">
                                                <div className={`font-bold text-zinc-100 italic ${deliverable.completed ? "line-through opacity-40 font-normal" : ""}`}>
                                                    {deliverable.title}
                                                </div>
                                                {deliverable.description && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 opacity-60">
                                                        {deliverable.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-3">
                                                    {deliverable.dueDate && (
                                                        <div className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest ${isBlocking ? "text-rose-400 font-bold" : "text-muted-foreground opacity-50"
                                                            }`}>
                                                            <Clock className="size-3 opacity-50" />
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
                                                        <Badge variant="destructive" className="text-[8px] font-mono rounded-full bg-rose-500/20 text-rose-400 border-0 uppercase tracking-widest px-2 group-hover:shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                                                            <AlertTriangle className="size-2.5 mr-1" />
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
                                                                    className={`p-1 rounded-full transition-colors ${isBlocking
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
                        <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2rem] relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-50" />
                            <CardHeader className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-white/10">
                                        <Users className="size-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-display uppercase tracking-tight text-zinc-100">
                                            Panel de Equipo
                                        </CardTitle>
                                        <CardDescription className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                                            {teamAssignments.length} Operational Units
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {teamAssignments.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-xl">
                                        Sin equipo asignado
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {teamAssignments.map((assignment) => (
                                            <Tooltip key={assignment.id}>
                                                <TooltipTrigger asChild>
                                                    <div className="relative cursor-pointer group">
                                                        <Avatar className="size-12 border border-white/10 ring-2 ring-zinc-950 group-hover:ring-primary/50 transition-all duration-300">
                                                            <AvatarImage src={assignment.member.avatarUrl || undefined} />
                                                            <AvatarFallback className="bg-zinc-800 text-xs font-mono text-zinc-400">
                                                                {assignment.member.name
                                                                    .split(" ")
                                                                    .map((n) => n[0])
                                                                    .join("")
                                                                    .slice(0, 2)
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {assignment.hoursAllocated && assignment.hoursAllocated > 0 && (
                                                            <Badge className="absolute -bottom-1 -right-1 h-5 px-1.5 text-[8px] bg-primary text-primary-foreground rounded-full font-mono border border-white/20">
                                                                {assignment.hoursAllocated}H
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
                            <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2rem] relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-50" />
                                <CardHeader className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-white/10">
                                            <ServiceIcon className="size-5 text-violet-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-display uppercase tracking-tight text-zinc-100">
                                                {project.serviceType === "SEO" ? "Estrategia de Keywords" :
                                                    project.serviceType === "Web" ? "Tech Stack" : "Detalles del Servicio"}
                                            </CardTitle>
                                            <CardDescription className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                                                Technical Specifications
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {project.serviceType === "SEO" && (
                                        <>
                                            {serviceFields.keywords && (
                                                <div>
                                                    <div className="text-[9px] font-mono uppercase text-muted-foreground mb-3 tracking-widest opacity-50">Keywords Objetivo</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(serviceFields.keywords as string[]).map((keyword: string, i: number) => (
                                                            <Badge key={i} variant="secondary" className="rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono text-[10px] px-3">
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
                                                    <div className="text-[9px] font-mono uppercase text-muted-foreground mb-3 tracking-widest opacity-50">Tecnologías</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(serviceFields.technologies as string[]).map((tech: string, i: number) => (
                                                            <Badge key={i} variant="secondary" className="rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono text-[10px] px-3">
                                                                <Code className="size-3 mr-1.5 opacity-50" />
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
                            <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2rem] overflow-hidden">
                                <CardHeader className="p-6 pb-2">
                                    <CardTitle className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                                        Executive Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <p className="text-xs leading-relaxed text-zinc-400 italic">"{project.description}"</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Profitability Calculator - full width */}
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-50" />
                    <CardContent className="p-0">
                        <ProfitabilityCalculator projectId={projectId} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

