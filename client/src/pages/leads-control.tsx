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
        <div className="space-y-10">
            {/* Intel Header & Control Center */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 pb-4 border-b border-white/5">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 border border-white/10 text-primary">
                            <TrendingUp className="size-5" />
                        </div>
                        <h1 className="text-4xl font-display italic tracking-tight text-white">Lead Intelligence</h1>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] pl-12 opacity-60">Strategic Prospect Monitoring Node</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-xl px-6 h-9 font-mono text-[9px] uppercase tracking-widest transition-all ${showActiveOnly ? 'bg-primary text-black font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'text-zinc-500 hover:text-white'}`}
                            onClick={() => setShowActiveOnly(true)}
                        >
                            Active Leads
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-xl px-6 h-9 font-mono text-[9px] uppercase tracking-widest transition-all ${!showActiveOnly ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-white'}`}
                            onClick={() => setShowActiveOnly(false)}
                        >
                            History Archive
                        </Button>
                    </div>

                    <div className="h-10 w-[1px] bg-white/10 mx-2" />

                    <div className="flex items-center gap-2">
                        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-11 w-11 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 p-0">
                                    <Settings className="w-4 h-4 text-zinc-400" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-[#030303]/95 backdrop-blur-2xl border-white/10 rounded-[2.5rem]">
                                <DialogHeader className="space-y-4">
                                    <DialogTitle className="text-xl font-display italic text-white">Grid Configuration Protocol</DialogTitle>
                                    <DialogDescription className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                                        Define Prospect Visualization Matrix
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-8 py-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Grouping Architecture</Label>
                                        <Select value={groupMode} onValueChange={(v: 'status' | 'origin') => {
                                            setGroupMode(v);
                                            setVisibleColumns(v === 'origin' ? [...LEAD_ORIGINS] : [...LEAD_STATUSES]);
                                        }}>
                                            <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl font-mono text-[10px] uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-white/10 rounded-2xl">
                                                <SelectItem value="status" className="font-mono text-[10px] uppercase">Pipeline Stage (Funnel)</SelectItem>
                                                <SelectItem value="origin" className="font-mono text-[10px] uppercase">Lead Source (Origin)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Matrix Active Zones</Label>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-4 bg-white/5 border border-white/5 rounded-3xl">
                                            {(groupMode === 'origin' ? LEAD_ORIGINS : LEAD_STATUSES).map((col) => (
                                                <div key={col} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all group">
                                                    <Checkbox
                                                        id={`col-${col}`}
                                                        checked={visibleColumns.includes(col)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setVisibleColumns([...visibleColumns, col]);
                                                            else if (visibleColumns.length > 1) setVisibleColumns(visibleColumns.filter(c => c !== col));
                                                        }}
                                                        className="size-4 border-white/20 data-[state=checked]:bg-primary"
                                                    />
                                                    <Label htmlFor={`col-${col}`} className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 group-hover:text-white cursor-pointer flex-1">
                                                        {col}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="border-t border-white/10 pt-6">
                                    <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Cancel</Button>
                                    <Button onClick={handleSaveSettings} className="bg-primary text-black font-mono text-[10px] font-bold uppercase tracking-widest rounded-full px-8">Save Matrix</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-11 rounded-2xl bg-primary text-black font-mono text-[10px] font-bold uppercase tracking-[0.15em] px-8 hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Initiate Lead
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-[#030303]/95 backdrop-blur-2xl border-white/10 rounded-[2.5rem]">
                                <DialogHeader className="space-y-4">
                                    <DialogTitle className="text-2xl font-display italic text-white tracking-tight">Lead Ingestion Protocol</DialogTitle>
                                    <DialogDescription className="text-[10px] font-mono uppercase tracking-widest opacity-60">Registering Strategic Asset Data</DialogDescription>
                                </DialogHeader>
                                <div className="mt-6">
                                    <LeadForm open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    <CardContent className="p-8">
                        <div className="space-y-4">
                            <div className="size-12 rounded-2xl bg-primary/10 border border-white/10 flex items-center justify-center text-primary rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                <Users className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-display font-bold italic tracking-tighter text-white">{metrics?.total || 0}</p>
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest group-hover:text-primary/60 transition-colors">Capture Capacity</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
                    <CardContent className="p-8">
                        <div className="space-y-4">
                            <div className="size-12 rounded-2xl bg-emerald-500/10 border border-white/10 flex items-center justify-center text-emerald-400 -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                <TrendingUp className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-display font-bold italic tracking-tighter text-white">{(metrics?.conversionRate || 0).toFixed(1)}%</p>
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest group-hover:text-emerald-400/60 transition-colors">Success Velocity</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                    <CardContent className="p-8">
                        <div className="space-y-4">
                            <div className="size-12 rounded-2xl bg-amber-500/10 border border-white/10 flex items-center justify-center text-amber-400 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                                <DollarSign className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-display font-bold italic tracking-tighter text-white">
                                    <span className="text-lg opacity-40 mr-1 font-mono">$</span>
                                    {(metrics?.avgValue || 0).toLocaleString()}
                                </p>
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest group-hover:text-amber-400/60 transition-colors">Yield Potential</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                    <CardContent className="p-8">
                        <div className="space-y-4">
                            <div className="size-12 rounded-2xl bg-cyan-500/10 border border-white/10 flex items-center justify-center text-cyan-400 -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                                <BarChart3 className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-display font-bold italic tracking-tighter text-white">{Object.keys(metrics?.byOrigin || {}).length}</p>
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest group-hover:text-cyan-400/60 transition-colors">Signal Streams</p>
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
                            <div className="relative p-4 rounded-t-xl bg-zinc-950/80 backdrop-blur-md border border-white/15 border-b-0 ring-1 ring-inset ring-white/10 group-header">
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

                            {/* Column Body - Pure Stealth Glass */}
                            <div className="flex-1 p-3 space-y-4 bg-zinc-950/20 backdrop-blur-sm border border-white/10 border-t-0 ring-1 ring-inset ring-white/5 rounded-b-[2rem] max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-none custom-kanban-scroll pb-10">
                                {groupedLeads[col]?.map((lead) => (
                                    <div key={lead.id} className="group/card relative">
                                        <Card className="relative bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/5 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:bg-zinc-900/60 hover:border-white/30 overflow-hidden rounded-[2rem]">
                                            {/* Priority Flare */}
                                            <div className={`absolute top-0 left-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent ${
                                                lead.priority === 'Alta' ? 'via-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                                                lead.priority === 'Media' ? 'via-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' :
                                                'via-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]'
                                            } to-transparent opacity-40 group-hover/card:opacity-100 transition-opacity`} />

                                            <CardContent className="p-6 space-y-5">
                                                {/* Header & Status Dropdown */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="space-y-1">
                                                        <h4 className="font-display italic text-zinc-100 group-hover/card:text-white transition-colors tracking-tight line-clamp-1">{lead.name}</h4>
                                                        {lead.company && (
                                                            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.1em] text-zinc-500 italic">
                                                                <Building2 className="size-2.5" />
                                                                {lead.company}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10">
                                                                <MoreVertical className="size-4 text-zinc-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 rounded-2xl p-2 min-w-[150px]">
                                                            <DropdownMenuItem onClick={() => setEditingLead(lead)} className="rounded-xl px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-400 focus:bg-white/10 focus:text-white">
                                                                <Edit className="size-4 mr-3 opacity-40" /> Archive Control
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => convertMutation.mutate(lead.id)}
                                                                disabled={lead.status === "Ganado"}
                                                                className="rounded-xl px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-primary focus:bg-primary/10 focus:text-primary"
                                                            >
                                                                <UserPlus className="size-4 mr-3 opacity-40" /> Authorize Conversion
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-white/5" />
                                                            <DropdownMenuItem 
                                                                onClick={() => deleteMutation.mutate(lead.id)}
                                                                className="rounded-xl px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-red-400 focus:bg-red-400/10 focus:text-red-400"
                                                            >
                                                                <Trash2 className="size-4 mr-3 opacity-40" /> Purge Asset
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Contact Node Info */}
                                                <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                                                    {lead.email && (
                                                        <div className="flex items-center gap-3">
                                                            <Mail className="size-3 text-zinc-500 opacity-40" />
                                                            <span className="text-[10px] font-mono text-zinc-400 truncate tracking-tight">{lead.email}</span>
                                                        </div>
                                                    )}
                                                    {lead.phone && (
                                                        <div className="flex items-center gap-3">
                                                            <Phone className="size-3 text-zinc-500 opacity-40" />
                                                            <span className="text-[10px] font-mono text-zinc-400 tracking-widest">{lead.phone}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Intelligence & Value Stats */}
                                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Select value={lead.status} onValueChange={(v) => handleStatusChange(lead.id, v)}>
                                                            <SelectTrigger className="h-7 w-auto border-none bg-zinc-900/50 hover:bg-zinc-800 rounded-full px-3 transition-colors">
                                                                <Badge className={`${getStatusColor(lead.status)} text-[9px] font-mono font-bold uppercase tracking-widest h-4 px-2 rounded-full border-none`}>
                                                                    {lead.status}
                                                                </Badge>
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-zinc-950 border-white/10 rounded-2xl">
                                                                {LEAD_STATUSES.map(s => (
                                                                    <SelectItem key={s} value={s} className="text-[9px] font-mono uppercase tracking-widest py-3">{s}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Badge variant="outline" className={`h-4 px-2 text-[8px] font-mono uppercase border-white/10 text-zinc-500 ${lead.priority === 'Alta' ? 'text-red-400' : ''}`}>
                                                            {lead.priority}
                                                        </Badge>
                                                    </div>
                                                    {lead.estimatedValue && (
                                                        <p className="text-[11px] font-mono font-bold text-primary italic">
                                                            ${Number(lead.estimatedValue).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Action Bridge */}
                                                <div className="flex gap-2 w-full pt-1">
                                                    {lead.phone && (
                                                        <Button 
                                                            variant="ghost" 
                                                            onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`, '_blank')}
                                                            className="flex-1 h-9 rounded-xl bg-white/5 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-emerald-400/60 hover:text-emerald-400 transition-all font-mono text-[9px] uppercase tracking-widest"
                                                        >
                                                            <MessageCircle className="size-3.5 mr-2" /> Message
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        variant="ghost"
                                                        className="size-9 rounded-xl bg-white/5 border border-white/5 hover:bg-primary/20 hover:border-primary/40 text-primary transition-all flex items-center justify-center"
                                                    >
                                                        <ArrowRight className="size-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}

                                {(!groupedLeads[col] || groupedLeads[col].length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02] group/empty">
                                        <Info className="size-8 text-zinc-700 opacity-20 group-hover/empty:opacity-40 transition-opacity mb-4" />
                                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600 text-center">Bandeja Vacía</p>
                                        <p className="text-[8px] font-mono uppercase tracking-widest text-zinc-700 text-center mt-1">Ready for Signal Ingestion</p>
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
