import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  Activity,
  Users,
  Gauge,
  AlertCircle,
  Plus,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp
} from "lucide-react";
import { MobileFAB } from "@/components/mobile-fab";
import { MetricsCarousel } from "@/components/metrics-carousel";
import { CompactCampaignCard } from "@/components/compact-campaign-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCampaigns, createCampaign, updateCampaign, deleteCampaign } from "@/lib/api";
import type { InsertCampaign, Campaign } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Dashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editCampaign, setEditCampaign] = useState<Partial<InsertCampaign>>({});
  const [progressValue, setProgressValue] = useState(0);
  const [telemetryData, setTelemetryData] = useState<Array<{ name: string, value: number }>>([
    { name: "00:00", value: 40 },
    { name: "04:00", value: 30 },
    { name: "08:00", value: 65 },
    { name: "12:00", value: 85 },
    { name: "16:00", value: 55 },
    { name: "20:00", value: 70 },
    { name: "23:59", value: 60 },
  ]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const [newCampaign, setNewCampaign] = useState<InsertCampaign>({
    campaignCode: "",
    name: "",
    clientName: "",
    channel: "",
    status: "Planning",
    progress: 0,
    priority: "Medium",
    budget: 0,
    spend: 0,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isConnected, lastMessage } = useWebSocket("/ws");

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });

  const createCampaignMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: async (newCampaign) => {
      queryClient.setQueryData(["campaigns"], (oldCampaigns: Campaign[] = []) => {
        return [...oldCampaigns, newCampaign];
      });
      setCreateDialogOpen(false);
      setNewCampaign({
        campaignCode: "",
        name: "",
        clientName: "",
        channel: "",
        status: "Planning",
        progress: 0,
        priority: "Medium",
        budget: 0,
        spend: 0,
      });
      toast({
        title: "Campaña Creada",
        description: "La nueva campaña ha sido registrada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la campaña. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCampaign(id, data),
    onSuccess: async (updatedCampaign) => {
      queryClient.setQueryData(["campaigns"], (oldCampaigns: Campaign[] = []) => {
        return oldCampaigns.map((campaign) =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign
        );
      });
      setEditDialogOpen(false);
      setProgressDialogOpen(false);
      toast({
        title: "Campaña Actualizada",
        description: "La campaña ha sido actualizada exitosamente.",
      });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(["campaigns"], (oldCampaigns: Campaign[] = []) => {
        return oldCampaigns.filter((campaign) => campaign.id !== variables);
      });
      setDeleteDialogOpen(false);
      toast({
        title: "Campaña Eliminada",
        description: "La campaña ha sido eliminada del sistema.",
      });
    },
  });

  const handleCreateCampaign = useCallback(() => {
    if (!newCampaign.campaignCode || !newCampaign.name) {
      toast({
        title: "Error de Validación",
        description: "El código de campaña y el nombre son requeridos.",
        variant: "destructive",
      });
      return;
    }
    createCampaignMutation.mutate(newCampaign);
  }, [newCampaign, createCampaignMutation, toast]);

  const handleEditCampaign = useCallback(() => {
    if (!selectedCampaign) return;
    updateCampaignMutation.mutate({
      id: selectedCampaign.id,
      data: editCampaign,
    });
  }, [selectedCampaign, editCampaign, updateCampaignMutation]);

  const handleUpdateProgress = useCallback(() => {
    if (!selectedCampaign) return;
    updateCampaignMutation.mutate({
      id: selectedCampaign.id,
      data: { progress: progressValue },
    });
  }, [selectedCampaign, progressValue, updateCampaignMutation]);

  const handleDeleteCampaign = useCallback(() => {
    if (!selectedCampaign) return;
    deleteCampaignMutation.mutate(selectedCampaign.id);
  }, [selectedCampaign, deleteCampaignMutation]);

  const openEditDialog = useCallback((campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setEditCampaign({
      campaignCode: campaign.campaignCode,
      name: campaign.name,
      clientName: campaign.clientName,
      channel: campaign.channel,
      priority: campaign.priority,
      status: campaign.status,
      budget: campaign.budget,
      spend: campaign.spend,
    });
    setEditDialogOpen(true);
  }, []);

  const openProgressDialog = useCallback((campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setProgressValue(campaign.progress);
    setProgressDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDeleteDialogOpen(true);
  }, []);

  const handleCompleteCampaign = useCallback((id: number) => {
    updateCampaignMutation.mutate({
      id,
      data: { status: "Completed", progress: 100 },
    });
  }, [updateCampaignMutation]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === "telemetry") {
        setTelemetryData((prev) => {
          const newData = [...prev, {
            name: lastMessage.data.name,
            value: lastMessage.data.value
          }];
          return newData.slice(-24);
        });
      } else if (lastMessage.type === "campaign_update") {
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      } else if (lastMessage.type === "metrics_update") {
        setSystemMetrics(lastMessage.data);
      }
    }
  }, [lastMessage, queryClient]);


  const activeCampaigns = useMemo(() => {
    let filtered = campaigns.filter(c => c.status === "Active" || c.status === "In Progress" || c.status === "Planning");

    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }

    return filtered;
  }, [campaigns, statusFilter, priorityFilter]);

  const operationalCount = useMemo(() =>
    campaigns.filter(c => c.status === "Active").length,
    [campaigns]
  );

  return (
    <>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

        <MetricsCarousel
          clientStatus={{ operational: operationalCount, total: campaigns.length }}
          team={{ active: systemMetrics?.activeTeam?.value ? parseInt(systemMetrics.activeTeam.value.replace(/,/g, '')) : 1284, trend: systemMetrics?.activeTeam?.trend || "+12%" }}
          systemLoad={{ percent: systemMetrics?.utilizationRate?.value ? parseInt(systemMetrics.utilizationRate.value) : 42, status: systemMetrics?.utilizationRate?.trendLabel || "optimized" }}
          threatLevel={{ level: systemMetrics?.urgencyLevel?.value || "LOW", incidents: systemMetrics?.urgencyLevel?.trend ? parseInt(systemMetrics.urgencyLevel.trend) : 0 }}
        />

        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatusCard
            title="Estado de Clientes"
            value={systemMetrics?.clientStatus?.value || `${operationalCount}/${campaigns.length}`}
            label={systemMetrics?.clientStatus?.label || "Activos"}
            icon={BarChart3}
            trend={systemMetrics?.clientStatus?.trend || `+${operationalCount}`}
            trendLabel={systemMetrics?.clientStatus?.trendLabel || "campañas activas"}
          />
          <StatusCard
            title="Equipo Activo"
            value={systemMetrics?.activeTeam?.value || "1,284"}
            label={systemMetrics?.activeTeam?.label || "En Servicio"}
            icon={Users}
            trend={systemMetrics?.activeTeam?.trend || "+12%"}
            trendLabel={systemMetrics?.activeTeam?.trendLabel || "vs último turno"}
          />
          <StatusCard
            title="Utilización"
            value={systemMetrics?.utilizationRate?.value || "42%"}
            label={systemMetrics?.utilizationRate?.label || "Capacidad Usada"}
            icon={Gauge}
            trend={systemMetrics?.utilizationRate?.trend || "-5%"}
            trendLabel={systemMetrics?.utilizationRate?.trendLabel || "optimizado"}
            success={systemMetrics?.utilizationRate?.success !== undefined ? systemMetrics.utilizationRate.success : true}
          />
          <StatusCard
            title="Nivel de Urgencia"
            value={systemMetrics?.urgencyLevel?.value || "BAJO"}
            label={systemMetrics?.urgencyLevel?.label || "Controlado"}
            icon={AlertCircle}
            trend={systemMetrics?.urgencyLevel?.trend || "0"}
            trendLabel={systemMetrics?.urgencyLevel?.trendLabel || "incidentes"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2 border-border bg-card/50 rounded-sm">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-base sm:text-lg font-display flex items-center justify-between">
                <span>Análisis de Rendimiento</span>
                <Badge variant="outline" className="rounded-sm font-mono font-normal text-primary border-primary/30 bg-primary/5 text-xs">EN VIVO</Badge>
              </CardTitle>
              <CardDescription className="font-mono text-xs uppercase tracking-wider">Datos en tiempo real</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="h-[320px] sm:h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetryData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(43 100% 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(43 100% 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm flex flex-col">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                <div>
                  <CardTitle className="text-base sm:text-lg font-display">Campañas Activas</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase tracking-wider">Cola de Prioridad</CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1 sm:w-[100px] h-11 text-xs rounded-sm border-border" data-testid="select-status-filter">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Planning">Planeación</SelectItem>
                      <SelectItem value="Active">Activa</SelectItem>
                      <SelectItem value="In Progress">En Progreso</SelectItem>
                      <SelectItem value="Paused">Pausada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="flex-1 sm:w-[100px] h-11 text-xs rounded-sm border-border" data-testid="select-priority-filter">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="High">Alta</SelectItem>
                      <SelectItem value="Medium">Media</SelectItem>
                      <SelectItem value="Low">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4 sm:p-6 pt-0">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">Cargando campañas...</div>
              ) : activeCampaigns.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="mb-2">No hay campañas activas</p>
                  <p className="text-xs">Crea una nueva campaña para comenzar</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 md:hidden">
                    {activeCampaigns.slice(0, 6).map((campaign) => (
                      <CompactCampaignCard
                        key={campaign.id}
                        id={campaign.id}
                        campaignCode={campaign.campaignCode}
                        name={campaign.name}
                        status={campaign.status}
                        priority={campaign.priority}
                        progress={campaign.progress}
                        createdAt={campaign.createdAt ? new Date(campaign.createdAt).toISOString() : ""}
                        updatedAt={campaign.updatedAt ? new Date(campaign.updatedAt).toISOString() : ""}
                        onMenuClick={() => {
                          setSelectedCampaign(campaign);
                        }}
                      />
                    ))}
                  </div>

                  <div className="hidden md:block space-y-3 sm:space-y-4">
                    {activeCampaigns.slice(0, 4).map((campaign) => (
                      <div key={campaign.id} className="group flex flex-col sm:flex-row items-start justify-between p-3 rounded-sm border border-transparent hover:border-border hover:bg-muted/30 transition-all gap-3" data-testid={`campaign-card-${campaign.id}`}>
                        <div className="space-y-1 flex-1 w-full sm:w-auto">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-primary" data-testid={`campaign-code-${campaign.id}`}>{campaign.campaignCode}</span>
                            <span className="font-medium text-sm" data-testid={`campaign-name-${campaign.id}`}>{campaign.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={
                              campaign.status === "Active" ? "text-green-400" :
                                campaign.status === "In Progress" ? "text-blue-400" :
                                  campaign.status === "Planning" ? "text-yellow-400" : "text-gray-400"
                            } data-testid={`campaign-status-${campaign.id}`}>● {campaign.status}</span>
                            <span>•</span>
                            <span data-testid={`campaign-priority-${campaign.id}`}>{campaign.priority} Priority</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="flex-1 sm:w-24">
                            <div className="flex justify-between text-[10px] mb-1 font-mono text-muted-foreground">
                              <span>PROG</span>
                              <span data-testid={`campaign-progress-${campaign.id}`}>{campaign.progress}%</span>
                            </div>
                            <Progress value={campaign.progress} className="h-1 bg-muted" indicatorClassName={campaign.progress === 100 ? "bg-green-500" : "bg-primary"} />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-11 w-11" data-testid={`button-menu-${campaign.id}`}>
                                <MoreVertical className="size-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border">
                              <DropdownMenuItem onClick={() => openEditDialog(campaign)} data-testid={`menu-edit-${campaign.id}`}>
                                <Edit className="size-3 mr-2" />
                                Editar Campaña
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openProgressDialog(campaign)} data-testid={`menu-progress-${campaign.id}`}>
                                <TrendingUp className="size-3 mr-2" />
                                Actualizar Progreso
                              </DropdownMenuItem>
                              {campaign.status !== "Completed" && (
                                <DropdownMenuItem onClick={() => handleCompleteCampaign(campaign.id)} data-testid={`menu-complete-${campaign.id}`}>
                                  <CheckCircle2 className="size-3 mr-2" />
                                  Marcar Completada
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(campaign)}
                                className="text-destructive focus:text-destructive"
                                data-testid={`menu-delete-${campaign.id}`}
                              >
                                <Trash2 className="size-3 mr-2" />
                                Eliminar Campaña
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {activeCampaigns.length > 4 && (
                <Button variant="outline" className="w-full mt-4 rounded-sm border-dashed border-border hover:bg-muted hover:text-primary font-mono text-xs uppercase h-11">
                  Ver Todas las Campañas ({activeCampaigns.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          <InfoWidget title="Condiciones del Mercado" value="Estable" subtitle="Visibilidad 100%" />
          <InfoWidget title="Latencia de Red" value="24ms" subtitle="Nodo: Alpha" />
          <InfoWidget title="Reservas de Presupuesto" value="98.4%" subtitle="Estado: Óptimo" />
        </div>

      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg sm:text-xl">Crear Nueva Campaña</DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase tracking-wider">
              Inicializar parámetros de campaña
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-code" className="text-xs font-mono uppercase">Código de Campaña</Label>
              <Input
                id="campaign-code"
                placeholder="CMP-XXX"
                value={newCampaign.campaignCode}
                onChange={(e) => setNewCampaign({ ...newCampaign, campaignCode: e.target.value })}
                className="rounded-sm border-border bg-background h-11"
                data-testid="input-campaign-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-name" className="text-xs font-mono uppercase">Nombre de Campaña</Label>
              <Input
                id="campaign-name"
                placeholder="Ingresa el nombre de la campaña"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                className="rounded-sm border-border bg-background h-11"
                data-testid="input-campaign-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-xs font-mono uppercase">Cliente</Label>
              <Input
                id="client-name"
                placeholder="Nombre del cliente"
                value={newCampaign.clientName}
                onChange={(e) => setNewCampaign({ ...newCampaign, clientName: e.target.value })}
                className="rounded-sm border-border bg-background h-11"
                data-testid="input-client-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel" className="text-xs font-mono uppercase">Canal</Label>
              <Select value={newCampaign.channel} onValueChange={(val) => setNewCampaign({ ...newCampaign, channel: val })}>
                <SelectTrigger className="rounded-sm border-border bg-background h-11" data-testid="select-channel">
                  <SelectValue placeholder="Selecciona un canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meta">Meta</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-xs font-mono uppercase">Presupuesto</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="0"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: parseInt(e.target.value) || 0 })}
                  className="rounded-sm border-border bg-background h-11"
                  data-testid="input-budget"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spend" className="text-xs font-mono uppercase">Gasto Actual</Label>
                <Input
                  id="spend"
                  type="number"
                  placeholder="0"
                  value={newCampaign.spend}
                  onChange={(e) => setNewCampaign({ ...newCampaign, spend: parseInt(e.target.value) || 0 })}
                  className="rounded-sm border-border bg-background h-11"
                  data-testid="input-spend"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-xs font-mono uppercase">Nivel de Prioridad</Label>
              <Select value={newCampaign.priority} onValueChange={(val) => setNewCampaign({ ...newCampaign, priority: val })}>
                <SelectTrigger className="rounded-sm border-border bg-background h-11" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Baja</SelectItem>
                  <SelectItem value="Medium">Media</SelectItem>
                  <SelectItem value="High">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-mono uppercase">Estado</Label>
              <Select value={newCampaign.status} onValueChange={(val) => setNewCampaign({ ...newCampaign, status: val })}>
                <SelectTrigger className="rounded-sm border-border bg-background h-11" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planeación</SelectItem>
                  <SelectItem value="Active">Activa</SelectItem>
                  <SelectItem value="In Progress">En Progreso</SelectItem>
                  <SelectItem value="Paused">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-sm h-11" data-testid="button-cancel">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCampaign}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              disabled={createCampaignMutation.isPending}
              data-testid="button-submit-campaign"
            >
              {createCampaignMutation.isPending ? "Creando..." : "Crear Campaña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Editar Campaña</DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase tracking-wider">
              Actualizar parámetros de campaña
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase">Código de Campaña</Label>
              <Input
                value={editCampaign.campaignCode || ""}
                onChange={(e) => setEditCampaign({ ...editCampaign, campaignCode: e.target.value })}
                className="rounded-sm border-border bg-background h-11"
                data-testid="input-edit-code"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase">Nombre de Campaña</Label>
              <Input
                value={editCampaign.name || ""}
                onChange={(e) => setEditCampaign({ ...editCampaign, name: e.target.value })}
                className="rounded-sm border-border bg-background h-11"
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase">Cliente</Label>
              <Input
                value={editCampaign.clientName || ""}
                onChange={(e) => setEditCampaign({ ...editCampaign, clientName: e.target.value })}
                className="rounded-sm border-border bg-background h-11"
                data-testid="input-edit-client"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase">Canal</Label>
              <Select value={editCampaign.channel} onValueChange={(val) => setEditCampaign({ ...editCampaign, channel: val })}>
                <SelectTrigger className="rounded-sm border-border bg-background h-11" data-testid="select-edit-channel">
                  <SelectValue placeholder="Selecciona un canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meta">Meta</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase">Presupuesto</Label>
                <Input
                  type="number"
                  value={editCampaign.budget || 0}
                  onChange={(e) => setEditCampaign({ ...editCampaign, budget: parseInt(e.target.value) || 0 })}
                  className="rounded-sm border-border bg-background h-11"
                  data-testid="input-edit-budget"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase">Gasto Actual</Label>
                <Input
                  type="number"
                  value={editCampaign.spend || 0}
                  onChange={(e) => setEditCampaign({ ...editCampaign, spend: parseInt(e.target.value) || 0 })}
                  className="rounded-sm border-border bg-background h-11"
                  data-testid="input-edit-spend"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase">Prioridad</Label>
              <Select value={editCampaign.priority} onValueChange={(val) => setEditCampaign({ ...editCampaign, priority: val })}>
                <SelectTrigger className="rounded-sm border-border bg-background h-11" data-testid="select-edit-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Baja</SelectItem>
                  <SelectItem value="Medium">Media</SelectItem>
                  <SelectItem value="High">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase">Estado</Label>
              <Select value={editCampaign.status} onValueChange={(val) => setEditCampaign({ ...editCampaign, status: val })}>
                <SelectTrigger className="rounded-sm border-border bg-background h-11" data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planeación</SelectItem>
                  <SelectItem value="Active">Activa</SelectItem>
                  <SelectItem value="In Progress">En Progreso</SelectItem>
                  <SelectItem value="Paused">Pausada</SelectItem>
                  <SelectItem value="Completed">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-sm h-11">
              Cancelar
            </Button>
            <Button
              onClick={handleEditCampaign}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              disabled={updateCampaignMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateCampaignMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Actualizar Progreso de Campaña</DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase tracking-wider">
              Ajustar porcentaje de completación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <Label className="text-xs font-mono uppercase">Progreso</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={progressValue}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setProgressValue(val);
                    }}
                    className="w-20 rounded-sm border-border bg-background text-center font-display font-bold h-11"
                    data-testid="input-progress"
                  />
                  <span className="text-xl font-display font-bold text-primary">%</span>
                </div>
              </div>
              <Slider
                value={[progressValue]}
                onValueChange={(val) => setProgressValue(val[0])}
                max={100}
                step={5}
                className="w-full"
                data-testid="slider-progress"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressDialogOpen(false)} className="rounded-sm h-11">
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateProgress}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              disabled={updateCampaignMutation.isPending}
              data-testid="button-save-progress"
            >
              {updateCampaignMutation.isPending ? "Actualizando..." : "Actualizar Progreso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Confirmar Eliminación de Campaña</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              ¿Estás seguro de que deseas eliminar la campaña <span className="text-primary font-bold">{selectedCampaign?.campaignCode}</span>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCampaign}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteCampaignMutation.isPending ? "Eliminando..." : "Eliminar Campaña"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileFAB onClick={() => setCreateDialogOpen(true)} />
    </>
  );
}


function StatusCard({ title, value, label, icon: Icon, trend, trendLabel, success }: any) {
  return (
    <Card className="border-border bg-card/50 rounded-sm hover:border-primary/50 transition-colors group">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-[10px] sm:text-xs font-mono uppercase text-muted-foreground tracking-wider">{title}</span>
          <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-display font-bold tracking-tight">{value}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
        </div>
        <div className="mt-3 sm:mt-4 flex items-center text-[10px] sm:text-xs font-mono">
          <span className={`${success || trend.startsWith("+") ? "text-green-400" : "text-primary"}`}>{trend}</span>
          <span className="text-muted-foreground ml-2">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoWidget({ title, value, subtitle }: any) {
  return (
    <div className="border border-border bg-card/30 p-4 rounded-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">{title}</p>
        <p className="font-display font-semibold text-lg">{value}</p>
      </div>
      <div className="text-right">
        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden mb-1">
          <div className="h-full bg-primary w-[70%] animate-pulse"></div>
        </div>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
