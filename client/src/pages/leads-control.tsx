/**
 * Leads Control - CRM Kanban Page
 * Part of Cohete Brands Replica
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users,
    Plus,
    Phone,
    Mail,
    Building2,
    DollarSign,
    TrendingUp,
    MoreVertical,
    UserPlus,
    Trash2,
    Edit,
    ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, GripVertical, Info } from "lucide-react";
import { LEAD_ORIGINS, LEAD_STATUSES } from "@shared/schema";
import {
    fetchLeads,
    fetchLeadsMetrics,
    createLead,
    updateLead,
    deleteLead,
    convertLeadToClient,
    type Lead,
} from "@/lib/api";
import { LeadForm } from "@/components/forms/lead-form";
// Kanban grouping modes
type GroupMode = "origin" | "status";

export default function LeadsControl() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

    // Kanban Settings (could be persisted in DB, using local state + persistence for now)
    const [groupMode, setGroupMode] = useState<GroupMode>(() => {
        return (localStorage.getItem("kanban_group_mode") as GroupMode) || "origin";
    });

    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        const saved = localStorage.getItem("kanban_active_columns");
        return saved ? JSON.parse(saved) : (groupMode === "origin" ? [...LEAD_ORIGINS] : [...LEAD_STATUSES]);
    });

    // Fetch all leads
    const { data: leads = [], isLoading } = useQuery({
        queryKey: ["leads"],
        queryFn: fetchLeads,
    });

    // Fetch metrics
    const { data: metrics } = useQuery({
        queryKey: ["leads-metrics"],
        queryFn: fetchLeadsMetrics,
    });

    // Column definitions based on mode
    const kanbanColumns = useMemo(() => {
        const fullList = groupMode === "origin" ? LEAD_ORIGINS : LEAD_STATUSES;
        // Filter based on user preferences but maintain schema order
        return fullList.filter(col => visibleColumns.includes(col));
    }, [groupMode, visibleColumns]);

    // Group leads by chosen mode
    const groupedLeads = useMemo(() => {
        const grouped: Record<string, Lead[]> = {};
        kanbanColumns.forEach((col) => {
            grouped[col] = leads.filter((lead) =>
                groupMode === "origin" ? lead.origin === col : lead.status === col
            );
        });
        return grouped;
    }, [leads, kanbanColumns, groupMode]);

    const handleSaveSettings = () => {
        localStorage.setItem("kanban_group_mode", groupMode);
        localStorage.setItem("kanban_active_columns", JSON.stringify(visibleColumns));
        setIsSettingsOpen(false);
        toast({ title: "Configuración guardada", description: "El tablero Kanban ha sido actualizado." });
    };

    // Create mutation
    const createMutation = useMutation({
        mutationFn: createLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["leads-metrics"] });
            setIsCreateDialogOpen(false);
            toast({ title: "Lead creado", description: "El lead ha sido agregado exitosamente" });
        },
        onError: () => {
            toast({ title: "Error", description: "No se pudo crear el lead", variant: "destructive" });
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateLead(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["leads-metrics"] });
            setEditingLead(null);
            toast({ title: "Lead actualizado" });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["leads-metrics"] });
            toast({ title: "Lead eliminado" });
        },
    });

    // Convert to client mutation
    const convertMutation = useMutation({
        mutationFn: convertLeadToClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["leads-metrics"] });
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            toast({ title: "Lead convertido", description: "El lead ha sido convertido a cliente exitosamente" });
        },
        onError: () => {
            toast({ title: "Error", description: "No se pudo convertir el lead", variant: "destructive" });
        },
    });

    const handleStatusChange = (leadId: number, newStatus: string) => {
        updateMutation.mutate({ id: leadId, data: { status: newStatus } });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Nuevo": return "bg-blue-500";
            case "Contactado": return "bg-yellow-500";
            case "En Negociación": return "bg-purple-500";
            case "Propuesta Enviada": return "bg-orange-500";
            case "Ganado": return "bg-green-500";
            case "Perdido": return "bg-red-500";
            case "Descartado": return "bg-gray-500";
            default: return "bg-gray-400";
        }
    };

    const getOriginColor = (origin: string) => {
        switch (origin) {
            case "Referido": return "border-green-400 bg-green-900/20";
            case "Instagram": return "border-pink-400 bg-pink-900/20";
            case "TikTok": return "border-cyan-400 bg-cyan-900/20";
            case "Landing Page": return "border-blue-400 bg-blue-900/20";
            case "LinkedIn": return "border-sky-400 bg-sky-900/20";
            case "YouTube": return "border-red-400 bg-red-900/20";
            case "Evento": return "border-yellow-400 bg-yellow-900/20";
            case "Campañas": return "border-purple-400 bg-purple-900/20";
            case "Google": return "border-amber-400 bg-amber-900/20";
            case "Facebook": return "border-indigo-400 bg-indigo-900/20";
            default: return "border-gray-400 bg-gray-900/20";
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
        <div className="space-y-6">
            {/* Header with Metrics */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Leads Control</h1>
                    <p className="text-muted-foreground">Gestión de prospectos por origen</p>
                </div>

                <div className="flex gap-2">
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-border rounded-sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Configurar Kanban
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-sm">
                            <DialogHeader>
                                <DialogTitle>Configuración de Pipeline</DialogTitle>
                                <DialogDescription>
                                    Define cómo quieres visualizar y organizar tus prospectos.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-3">
                                    <Label className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Agrupar por</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant={groupMode === 'origin' ? 'default' : 'outline'}
                                            className="rounded-sm"
                                            onClick={() => {
                                                setGroupMode('origin');
                                                setVisibleColumns([...LEAD_ORIGINS]);
                                            }}
                                        >
                                            Origen (Canal)
                                        </Button>
                                        <Button
                                            variant={groupMode === 'status' ? 'default' : 'outline'}
                                            className="rounded-sm"
                                            onClick={() => {
                                                setGroupMode('status');
                                                setVisibleColumns([...LEAD_STATUSES]);
                                            }}
                                        >
                                            Estado (Funnel)
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Columnas Visibles</Label>
                                    <p className="text-[10px] text-muted-foreground mb-2">Selecciona los estados que quieres ver en el tablero.</p>
                                    <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto p-1 border border-border rounded-sm bg-muted/20">
                                        {(groupMode === 'origin' ? LEAD_ORIGINS : LEAD_STATUSES).map((col) => (
                                            <div key={col} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-sm transition-colors">
                                                <Checkbox
                                                    id={`col-${col}`}
                                                    checked={visibleColumns.includes(col)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setVisibleColumns([...visibleColumns, col]);
                                                        } else {
                                                            if (visibleColumns.length > 1) {
                                                                setVisibleColumns(visibleColumns.filter(c => c !== col));
                                                            }
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`col-${col}`} className="text-sm cursor-pointer flex-1">{col}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSaveSettings}>Guardar Cambios</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Nuevo Lead
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-sm">
                            <DialogHeader>
                                <DialogTitle>Crear Nuevo Lead</DialogTitle>
                            </DialogHeader>
                            <LeadForm open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Edit Dialog */}
                <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Editar Lead</DialogTitle>
                        </DialogHeader>
                        {editingLead && (
                            <LeadForm
                                open={!!editingLead}
                                onOpenChange={(open) => !open && setEditingLead(null)}
                                initialData={editingLead}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{metrics?.total || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <TrendingUp className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{(metrics?.conversionRate || 0).toFixed(1)}%</p>
                                <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-yellow-500/10">
                                <DollarSign className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">${(metrics?.avgValue || 0).toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Valor Promedio</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Building2 className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{Object.keys(metrics?.byOrigin || {}).length}</p>
                                <p className="text-sm text-muted-foreground">Canales Activos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kanban Board */}
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20">
                <div className="flex gap-4 min-w-max">
                    {kanbanColumns.map((col) => (
                        <div
                            key={col}
                            className={`w-72 flex-shrink-0 rounded-lg border-2 ${groupMode === 'origin' ? getOriginColor(col) : 'border-border bg-card/40'}`}
                        >
                            {/* Column Header */}
                            <div className="p-3 border-b border-white/10 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h3 className="font-bold text-xs uppercase tracking-widest text-foreground/80">{col}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-sm bg-background/50 text-muted-foreground border-border">
                                            {groupedLeads[col]?.length || 0}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            ${(groupedLeads[col]?.reduce((acc, lead) => acc + parseFloat(lead.estimatedValue || "0"), 0) / 1000).toFixed(1)}k
                                        </span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-50 hover:opacity-100">
                                    <Plus className="size-3" />
                                </Button>
                            </div>

                            {/* Column Body */}
                            <div className="p-2 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-none">
                                {groupedLeads[col]?.map((lead) => (
                                    <Card key={lead.id} className="bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
                                        <CardContent className="p-3 space-y-2">
                                            {/* Lead Name & Actions */}
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">{lead.name}</p>
                                                    {lead.company && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" />
                                                            {lead.company}
                                                        </p>
                                                    )}
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => convertMutation.mutate(lead.id)}
                                                            disabled={lead.status === "Ganado"}
                                                        >
                                                            <UserPlus className="w-4 h-4 mr-2" />
                                                            Convertir a Cliente
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => deleteMutation.mutate(lead.id)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Contact Info */}
                                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                {lead.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {lead.email.split("@")[0]}...
                                                    </span>
                                                )}
                                                {lead.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {lead.phone}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Status & Value */}
                                            <div className="flex items-center justify-between">
                                                <Select
                                                    value={lead.status}
                                                    onValueChange={(value) => handleStatusChange(lead.id, value)}
                                                >
                                                    <SelectTrigger className="h-6 text-xs w-auto">
                                                        <Badge className={`${getStatusColor(lead.status)} text-white text-xs`}>
                                                            {lead.status}
                                                        </Badge>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {LEAD_STATUSES.map((status) => (
                                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {lead.estimatedValue && (
                                                    <span className="text-xs font-medium text-green-400">
                                                        ${Number(lead.estimatedValue).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {/* Empty State */}
                                {(!groupedLeads[col] || groupedLeads[col].length === 0) && (
                                    <div className="text-center py-12 px-4 rounded-md border border-dashed border-border bg-background/20 group">
                                        <div className="mb-2 p-2 rounded-full bg-muted/30 w-fit mx-auto opacity-50 group-hover:opacity-100 transition-opacity">
                                            <Info className="size-4 text-muted-foreground" />
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">Bandeja Vacía</p>
                                        <p className="text-[10px] text-muted-foreground/60">No hay prospectos en esta etapa.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
