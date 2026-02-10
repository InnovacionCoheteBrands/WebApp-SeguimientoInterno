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
import { Settings, GripVertical, Info, MessageCircle, BarChart3 } from "lucide-react";
import { LEAD_ORIGINS, LEAD_STATUSES, LEAD_PRIORITIES } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    const [showActiveOnly, setShowActiveOnly] = useState(true); // New state for filtering active leads
    const [searchTerm, setSearchTerm] = useState(""); // New state for search

    // Kanban Settings (could be persisted in DB, using local state + persistence for now)
    const [groupMode, setGroupMode] = useState<GroupMode>(() => {
        return (localStorage.getItem("kanban_group_mode") as GroupMode) || "status"; // Default to 'status'
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

    // Filter leads based on search term and active status
    const filteredLeads = useMemo(() => {
        return leads?.filter((lead) => {
            const matchesSearch =
                lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.company?.toLowerCase().includes(searchTerm.toLowerCase());

            const isClosed = lead.status === "Ganado" || lead.status === "Perdido" || lead.status === "Descartado";
            const matchesActive = showActiveOnly ? !isClosed : true;

            return matchesSearch && matchesActive;
        });
    }, [leads, searchTerm, showActiveOnly]);

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
            grouped[col] = filteredLeads.filter((lead) => // Use filteredLeads here
                groupMode === "origin" ? lead.origin === col : lead.status === col
            );
        });
        return grouped;
    }, [filteredLeads, kanbanColumns, groupMode]); // Dependency on filteredLeads

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
            case "Referido": return "from-green-500/50 to-emerald-500/10";
            case "Instagram": return "from-pink-500/50 to-rose-500/10";
            case "TikTok": return "from-cyan-500/50 to-blue-500/10";
            case "Landing Page": return "from-blue-500/50 to-indigo-500/10";
            case "LinkedIn": return "from-sky-500/50 to-blue-500/10";
            case "YouTube": return "from-red-500/50 to-orange-500/10";
            case "Evento": return "from-yellow-500/50 to-amber-500/10";
            case "Campañas": return "from-purple-500/50 to-violet-500/10";
            case "Google": return "from-amber-500/50 to-yellow-500/10";
            case "Facebook": return "from-indigo-500/50 to-blue-500/10";
            default: return "from-gray-500/50 to-slate-500/10";
        }
    };

    const getOriginSolidColor = (origin: string) => {
        switch (origin) {
            case "Referido": return "bg-green-500";
            case "Instagram": return "bg-pink-500";
            case "TikTok": return "bg-cyan-500";
            case "Landing Page": return "bg-blue-500";
            case "LinkedIn": return "bg-sky-500";
            case "YouTube": return "bg-red-500";
            case "Evento": return "bg-yellow-500";
            case "Campañas": return "bg-purple-500";
            case "Google": return "bg-amber-500";
            case "Facebook": return "bg-indigo-500";
            default: return "bg-gray-500";
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
                    <h1 className="text-3xl font-bold">CRM</h1>
                    <p className="text-muted-foreground">Centro de comando de prospectos y ventas</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={showActiveOnly ? "secondary" : "ghost"}
                        className="rounded-sm"
                        onClick={() => setShowActiveOnly(!showActiveOnly)}
                    >
                        {showActiveOnly ? "Activos" : "Todos"}
                    </Button>
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-border rounded-sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Vista
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
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="group-mode" className="text-right">
                                        Agrupar por
                                    </Label>
                                    <Select value={groupMode} onValueChange={(v: 'status' | 'origin') => {
                                        setGroupMode(v);
                                        setVisibleColumns(v === 'origin' ? [...LEAD_ORIGINS] : [...LEAD_STATUSES]);
                                    }}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="status">Estado (Funnel)</SelectItem>
                                            <SelectItem value="origin">Origen (Canal)</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                            className="w-80 flex-shrink-0 flex flex-col"
                        >
                            {/* Premium Minimal Column Header */}
                            <div className="relative p-4 rounded-t-xl bg-[#09090b] border border-white/5 border-b-0 group-header">
                                {/* The 'Flare' - Top Gradient Line */}
                                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${groupMode === 'origin' ? getOriginColor(col) : getStatusColor(col).replace('bg-', 'from-').replace('500', '500/80') + ' to-transparent'}`} />

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2">
                                        {/* Status Dot */}
                                        <div className={`size-2 rounded-full ${groupMode === 'origin' ? getOriginSolidColor(col) : getStatusColor(col)} shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
                                        <h3 className="font-display font-medium text-sm text-foreground/90 tracking-wide">{col}</h3>
                                        <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1.5 rounded-full bg-white/5 border-white/10 text-muted-foreground">
                                            {groupedLeads[col]?.length || 0}
                                        </Badge>
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                                        ${(groupedLeads[col]?.reduce((acc, lead) => acc + parseFloat(lead.estimatedValue || "0"), 0) / 1000).toFixed(1)}k
                                    </span>
                                </div>
                            </div>

                            {/* Column Body - Transparent/Subtle */}
                            <div className="flex-1 p-2 space-y-3 bg-[#09090b]/50 border border-white/5 border-t-0 rounded-b-xl max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-none">
                                {groupedLeads[col]?.map((lead) => (
                                    <div key={lead.id} className="group/card relative">
                                        {/* Card Flare Effect (Hover) */}
                                        <div className={`absolute -inset-[1px] rounded-[1.5rem] bg-gradient-to-b ${groupMode === 'origin' ? getOriginColor(col) : 'from-white/10 to-transparent'} opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-sm`} />

                                        <Card className="relative bg-zinc-900/90 hover:bg-zinc-800 transition-colors border-white/10 shadow-md group-hover/card:translate-x-1 duration-300 overflow-hidden rounded-[1.5rem]">
                                            {/* Neon Side Stripe */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-transparent ${lead.priority === 'Alta' ? 'via-red-500' :
                                                lead.priority === 'Media' ? 'via-amber-500' :
                                                    'via-blue-500'
                                                } to-transparent opacity-70 group-hover/card:opacity-100 transition-opacity`} />

                                            <CardContent className="p-4 pl-5 space-y-3">
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

                                                {/* Contact Info - Compact */}
                                                <div className="flex flex-col gap-1.5">
                                                    {lead.email && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 group-hover/card:text-muted-foreground transition-colors truncate">
                                                            <Mail className="size-3 flex-shrink-0" />
                                                            <span className="truncate">{lead.email}</span>
                                                        </div>
                                                    )}
                                                    {lead.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 group-hover/card:text-muted-foreground transition-colors">
                                                            <Phone className="size-3 flex-shrink-0" />
                                                            <span>{lead.phone}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Status & Value */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
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
                                                        {lead.priority && (
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] h-4 px-1 ${lead.priority === 'Alta' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                                                    lead.priority === 'Media' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' :
                                                                        'border-gray-400 text-gray-400 bg-gray-400/10'
                                                                    }`}
                                                            >
                                                                {lead.priority}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {lead.estimatedValue && (
                                                        <span className="text-xs font-medium text-green-400">
                                                            ${Number(lead.estimatedValue).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Quick Actions */}
                                                <div className="flex items-center gap-1 pt-1 border-t border-border/50">
                                                    {lead.phone && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-green-500 hover:bg-green-500/10"
                                                            onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`, '_blank')}
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    {lead.email && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-blue-500 hover:bg-blue-500/10"
                                                            onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                                                        >
                                                            <Mail className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
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
        </div >
    );
}
