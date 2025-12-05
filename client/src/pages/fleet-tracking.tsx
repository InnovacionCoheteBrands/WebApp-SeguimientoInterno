import { useMemo, memo, useState } from "react";
import { Briefcase, ArrowLeft, Activity, Building2, DollarSign, TrendingUp, Clock, Plus, Pencil, Trash2, Target } from "lucide-react";
import { CompactClientCard } from "@/components/compact-client-card";
import { MobileFAB } from "@/components/mobile-fab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCampaigns, fetchClientAccounts, createClientAccount, updateClientAccount, deleteClientAccount, type ClientAccount } from "@/lib/api";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { InsertClientAccount } from "@shared/schema";

const FleetTracking = memo(function FleetTracking() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ClientAccount | null>(null);
  const [deleteCampaignId, setDeleteCampaignId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });

  const { data: clientAccounts = [] } = useQuery({
    queryKey: ["client-accounts"],
    queryFn: fetchClientAccounts,
  });

  const clientData = useMemo(() => {
    return campaigns.map((campaign) => {
      const account = clientAccounts.find((a) => a.campaignId === campaign.id);
      return {
        campaign,
        account,
      };
    });
  }, [campaigns, clientAccounts]);

  const [formData, setFormData] = useState<Partial<InsertClientAccount>>({
    campaignId: 0,
    companyName: "",
    industry: "",
    monthlyBudget: 0,
    currentSpend: 0,
    healthScore: 100,
    nextMilestone: "",
    status: "Active",
  });

  const createMutation = useMutation({
    mutationFn: createClientAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-accounts"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Éxito", description: "Cuenta de cliente creada exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: number; data: Partial<InsertClientAccount> }) =>
      updateClientAccount(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-accounts"] });
      setIsDialogOpen(false);
      setEditingAccount(null);
      resetForm();
      toast({ title: "Éxito", description: "Cuenta de cliente actualizada exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClientAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-accounts"] });
      setDeleteCampaignId(null);
      toast({ title: "Éxito", description: "Cuenta de cliente eliminada exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      campaignId: 0,
      companyName: "",
      industry: "",
      monthlyBudget: 0,
      currentSpend: 0,
      healthScore: 100,
      nextMilestone: "",
      status: "Active",
    });
    setEditingAccount(null);
  };

  const handleOpenDialog = (account?: ClientAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        campaignId: account.campaignId,
        companyName: account.companyName,
        industry: account.industry,
        monthlyBudget: account.monthlyBudget,
        currentSpend: account.currentSpend,
        healthScore: account.healthScore,
        nextMilestone: account.nextMilestone || "",
        status: account.status,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.campaignId || !formData.companyName || !formData.industry) {
      toast({ title: "Error", description: "Por favor completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    if (editingAccount) {
      updateMutation.mutate({
        campaignId: editingAccount.campaignId,
        data: formData
      });
    } else {
      createMutation.mutate(formData as InsertClientAccount);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link href="/">
              <Button variant="outline" size="icon" className="rounded-sm h-11 w-11" data-testid="button-back">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Gestión de Clientes</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                Administrar Cuentas y Proyectos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Badge variant="outline" className="rounded-sm font-mono font-normal text-primary border-primary/30 bg-primary/5 text-xs sm:text-sm">
              {clientData.length} CLIENTES
            </Badge>
            <Button
              onClick={() => handleOpenDialog()}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-3 sm:px-4 flex-1 sm:flex-initial"
              data-testid="button-new-fleet"
            >
              <Plus className="size-5 sm:size-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva Cuenta</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </div>

        {/* Mobile Grid - 2 Columns */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {clientData.map(({ campaign, account }) => (
            <CompactClientCard
              key={campaign.id}
              campaignId={campaign.id}
              campaignCode={campaign.campaignCode}
              clientName={account?.companyName || campaign.name}
              accountData={account ? {
                industry: account.industry,
                monthlyBudget: account.monthlyBudget,
                currentSpend: account.currentSpend,
                healthScore: `${account.healthScore}%`,
                status: account.status,
                lastContact: account.lastContact,
              } : null}
              campaignProgress={campaign.progress}
              onEdit={() => handleOpenDialog(account || undefined)}
              onDelete={() => setDeleteCampaignId(campaign.id)}
              onCreate={() => {
                setFormData({ ...formData, campaignId: campaign.id });
                setIsDialogOpen(true);
              }}
            />
          ))}
        </div>

        {/* Desktop Grid - 3 Columns */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {clientData.map(({ campaign, account }) => (
            <Card key={campaign.id} className="border-border bg-card/50 rounded-sm hover:border-primary/50 transition-colors" data-testid={`fleet-card-${campaign.id}`}>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg font-display flex items-center gap-2">
                    <Briefcase className="size-4" />
                    {campaign.campaignCode}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`rounded-sm text-xs ${account?.status === "Active"
                        ? "border-green-500 text-green-500"
                        : account?.status === "Paused"
                          ? "border-yellow-500 text-yellow-500"
                          : "border-gray-500 text-gray-500"
                      }`}
                    data-testid={`fleet-status-${campaign.id}`}
                  >
                    {account?.status || "Unknown"}
                  </Badge>
                </div>
                <CardDescription className="font-medium text-foreground/80">
                  {account?.companyName || campaign.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                {account ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="size-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground" data-testid={`fleet-sector-${campaign.id}`}>
                          {account.industry}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="size-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground" data-testid={`fleet-velocity-${campaign.id}`}>
                          ${account.monthlyBudget.toLocaleString()} presupuesto
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="size-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground" data-testid={`fleet-distance-${campaign.id}`}>
                          ${account.currentSpend.toLocaleString()} gastado
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground" data-testid={`fleet-lastcontact-${campaign.id}`}>
                          Última actividad {formatDistanceToNow(new Date(account.lastContact), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between text-xs mb-1 font-mono text-muted-foreground">
                        <span>HEALTH SCORE</span>
                        <span data-testid={`fleet-coordinates-${campaign.id}`}>{account.healthScore}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${account.healthScore >= 80 ? "bg-green-500" :
                              account.healthScore >= 50 ? "bg-yellow-500" :
                                "bg-red-500"
                            }`}
                          style={{ width: `${account.healthScore}%` }}
                        />
                      </div>
                    </div>
                    {account.nextMilestone && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="size-4 text-muted-foreground" />
                          <span className="font-mono text-xs text-muted-foreground">
                            {account.nextMilestone}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(account)}
                        className="flex-1 rounded-sm h-11"
                        data-testid={`button-edit-fleet-${campaign.id}`}
                      >
                        <Pencil className="size-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteCampaignId(campaign.id)}
                        className="flex-1 rounded-sm text-destructive hover:text-destructive h-11"
                        data-testid={`button-delete-fleet-${campaign.id}`}
                      >
                        <Trash2 className="size-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">Datos de cuenta no disponibles</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, campaignId: campaign.id });
                        setIsDialogOpen(true);
                      }}
                      className="rounded-sm h-11"
                      data-testid={`button-create-fleet-${campaign.id}`}
                    >
                      <Plus className="size-4 mr-1" />
                      Agregar Cuenta
                    </Button>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs mb-1 font-mono text-muted-foreground">
                    <span>PROGRESO CAMPAÑA</span>
                    <span data-testid={`fleet-progress-${campaign.id}`}>{campaign.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clientData.length === 0 && (
          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No hay clientes registrados actualmente</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-sm">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar Cuenta del Cliente" : "Nueva Cuenta de Cliente"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Actualiza los detalles de la cuenta del cliente" : "Agrega una nueva cuenta de cliente para una campaña"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaña *</Label>
              <Select
                value={formData.campaignId?.toString()}
                onValueChange={(value) => setFormData({ ...formData, campaignId: parseInt(value) })}
                disabled={!!editingAccount}
              >
                <SelectTrigger id="campaign" className="h-11" data-testid="select-mission">
                  <SelectValue placeholder="Selecciona una campaña" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.campaignCode} - {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre del Cliente *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="ej. Acme Corporation"
                className="h-11"
                data-testid="input-sector"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industria *</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger id="industry" className="h-11" data-testid="input-coordinates">
                  <SelectValue placeholder="Selecciona una industria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tech">Tech</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyBudget">Presupuesto ($) *</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData({ ...formData, monthlyBudget: parseFloat(e.target.value) || 0 })}
                  className="h-11"
                  data-testid="input-velocity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentSpend">Gasto Actual ($) *</Label>
                <Input
                  id="currentSpend"
                  type="number"
                  value={formData.currentSpend}
                  onChange={(e) => setFormData({ ...formData, currentSpend: parseFloat(e.target.value) || 0 })}
                  className="h-11"
                  data-testid="input-distance"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthScore">Health Score (0-100) *</Label>
              <Input
                id="healthScore"
                type="number"
                min="0"
                max="100"
                value={formData.healthScore}
                onChange={(e) => setFormData({ ...formData, healthScore: parseInt(e.target.value) || 0 })}
                className="h-11"
                data-testid="input-healthscore"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextMilestone">Próximo Hito</Label>
              <Input
                id="nextMilestone"
                value={formData.nextMilestone || ""}
                onChange={(e) => setFormData({ ...formData, nextMilestone: e.target.value })}
                placeholder="ej. Lanzamiento de campaña Q2"
                className="h-11"
                data-testid="input-milestone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as "Active" | "Paused" | "Planning" })}
              >
                <SelectTrigger id="status" className="h-11" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-sm h-11"
                data-testid="button-cancel-fleet"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-sm h-11"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-fleet"
              >
                {editingAccount ? "Actualizar" : "Crear"} Cuenta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteCampaignId !== null} onOpenChange={() => setDeleteCampaignId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cuenta del Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta cuenta de cliente? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" data-testid="button-cancel-delete-fleet">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCampaignId && deleteMutation.mutate(deleteCampaignId)}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-fleet"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileFAB
        label="Nueva Cuenta"
        onClick={() => handleOpenDialog()}
      />
    </div>
  );
});

export default FleetTracking;
