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
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
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
import {
    fetchLeads,
    fetchLeadsMetrics,
    createLead,
    updateLead,
    deleteLead,
    convertLeadToClient,
    type Lead,
} from "@/lib/api";
import { LEAD_ORIGINS, LEAD_STATUSES } from "@shared/schema";

// Kanban column configuration based on ORIGIN (Cohete style)
const KANBAN_COLUMNS = LEAD_ORIGINS;

export default function LeadsControl() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

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

    // Group leads by origin for Kanban
    const leadsByOrigin = useMemo(() => {
        const grouped: Record<string, Lead[]> = {};
        KANBAN_COLUMNS.forEach((origin) => {
            grouped[origin] = leads.filter((lead) => lead.origin === origin);
        });
        return grouped;
    }, [leads]);

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

    const handleCreateLead = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string || null,
            phone: formData.get("phone") as string || null,
            company: formData.get("company") as string || null,
            origin: formData.get("origin") as string,
            status: "Nuevo" as const,
            estimatedValue: formData.get("estimatedValue") as string || null,
            notes: formData.get("notes") as string || null,
        };
        createMutation.mutate(data);
    };

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

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Lead
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Lead</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateLead} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nombre *</Label>
                                <Input id="name" name="name" required placeholder="Juan Pérez" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" placeholder="email@ejemplo.com" />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input id="phone" name="phone" placeholder="+52 33 1234 5678" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="company">Empresa</Label>
                                <Input id="company" name="company" placeholder="Nombre de la empresa" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="origin">Origen *</Label>
                                    <Select name="origin" defaultValue="Otro">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LEAD_ORIGINS.map((origin) => (
                                                <SelectItem key={origin} value={origin}>{origin}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="estimatedValue">Valor Estimado</Label>
                                    <Input id="estimatedValue" name="estimatedValue" type="number" placeholder="$50,000" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="notes">Notas</Label>
                                <Textarea id="notes" name="notes" placeholder="Notas adicionales..." />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? "Creando..." : "Crear Lead"}
                                </Button>
                            </div>
                        </form>
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
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                    {KANBAN_COLUMNS.map((origin) => (
                        <div
                            key={origin}
                            className={`w-72 flex-shrink-0 rounded-lg border-2 ${getOriginColor(origin)}`}
                        >
                            {/* Column Header */}
                            <div className="p-3 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">{origin}</h3>
                                    <Badge variant="secondary" className="text-xs">
                                        {leadsByOrigin[origin]?.length || 0}
                                    </Badge>
                                </div>
                            </div>

                            {/* Column Body */}
                            <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                                {leadsByOrigin[origin]?.map((lead) => (
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
                                {(!leadsByOrigin[origin] || leadsByOrigin[origin].length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Sin leads
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
