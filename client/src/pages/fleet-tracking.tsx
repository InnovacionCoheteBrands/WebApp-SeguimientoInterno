import { memo, useState } from "react";
import { Briefcase, ArrowLeft, Building2, DollarSign, TrendingUp, Clock, Plus, Pencil, Trash2, Target } from "lucide-react";
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
import { fetchClientAccounts, createClientAccount, updateClientAccount, deleteClientAccount, type ClientAccount } from "@/lib/api";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { InsertClientAccount } from "@shared/schema";

const FleetTracking = memo(function FleetTracking() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ClientAccount | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clientAccounts = [] } = useQuery({
    queryKey: ["client-accounts"],
    queryFn: fetchClientAccounts,
  });

  const [formData, setFormData] = useState<Partial<InsertClientAccount>>({
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
      toast({ title: "Éxito", description: "Cliente creado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertClientAccount> }) =>
      updateClientAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-accounts"] });
      setIsDialogOpen(false);
      setEditingAccount(null);
      resetForm();
      toast({ title: "Éxito", description: "Cliente actualizado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClientAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-accounts"] });
      setDeleteClientId(null);
      toast({ title: "Éxito", description: "Cliente eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
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

    if (!formData.companyName || !formData.industry) {
      toast({ title: "Error", description: "Por favor completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    if (editingAccount) {
      updateMutation.mutate({
        id: editingAccount.id,
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
              {clientAccounts.length} CLIENTES
            </Badge>
            <Button
              onClick={() => handleOpenDialog()}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-3 sm:px-4 flex-1 sm:flex-initial"
              data-testid="button-new-client"
            >
              <Plus className="size-5 sm:size-4 sm:mr-2" />
              <span className="hidden sm:inline">Nuevo Cliente</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>

        {/* Mobile Grid - 2 Columns */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {clientAccounts.map((account) => (
            <Card
              key={account.id}
              status={account.status === "Active" ? "success" : account.status === "Paused" ? "warning" : "default"}
              className="bg-zinc-900 border-zinc-800 rounded-sm"
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={`rounded-sm text-[9px] h-4 px-1 font-normal border-transparent bg-zinc-950 ${
                      account.status === "Active" ? "text-green-500" :
                      account.status === "Paused" ? "text-yellow-500" : "text-zinc-500"
                    }`}
                  >
                    {account.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm truncate mb-2">{account.companyName}</h3>
                <div className="space-y-1 text-[10px] text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Building2 className="size-3" />
                    <span>{account.industry}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="size-3" />
                    <span>${account.monthlyBudget.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-1 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(account)}
                    className="flex-1 h-7 text-xs"
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteClientId(account.id)}
                    className="h-7 w-7 p-0 text-zinc-500 hover:text-red-500"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Grid - 3 Columns */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {clientAccounts.map((account) => (
            <Card
              key={account.id}
              status={account.status === "Active" ? "success" : account.status === "Paused" ? "warning" : "default"}
              className="bg-zinc-900 border-zinc-800 rounded-sm hover:border-zinc-700 transition-all group relative overflow-hidden"
              data-testid={`client-card-${account.id}`}
            >
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-4 text-zinc-500" />
                    <CardTitle className="text-base font-display font-bold tracking-tight">
                      {account.companyName}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={`rounded-sm text-[10px] h-5 px-1.5 font-normal border-transparent bg-zinc-950 ${
                      account.status === "Active" ? "text-green-500" :
                      account.status === "Paused" ? "text-yellow-500" : "text-zinc-500"
                    }`}
                    data-testid={`client-status-${account.id}`}
                  >
                    {account.status}
                  </Badge>
                </div>
                <CardDescription className="font-mono text-xs uppercase tracking-wider text-zinc-500 mt-1 truncate">
                  {account.industry}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-5 pt-2">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase text-zinc-600 font-mono">Industria</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                      <Building2 className="size-3 text-amber-500/70" />
                      <span>{account.industry}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase text-zinc-600 font-mono">Presupuesto</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                      <DollarSign className="size-3 text-amber-500/70" />
                      <span>${account.monthlyBudget.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase text-zinc-600 font-mono">Gasto</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                      <TrendingUp className="size-3 text-amber-500/70" />
                      <span>${account.currentSpend.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase text-zinc-600 font-mono">Actividad</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                      <Clock className="size-3 text-amber-500/70" />
                      <span className="truncate">
                        {formatDistanceToNow(new Date(account.lastContact), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <div className="flex justify-between text-[10px] mb-1.5 font-mono text-zinc-500">
                    <span>HEALTH SCORE</span>
                    <span className={account.healthScore >= 80 ? 'text-green-500' : account.healthScore < 50 ? 'text-red-500' : 'text-yellow-500'}>
                      {account.healthScore}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        account.healthScore >= 80 ? "bg-green-500" :
                        account.healthScore >= 50 ? "bg-yellow-500" :
                        "bg-red-500"
                      }`}
                      style={{ width: `${account.healthScore}%` }}
                    />
                  </div>
                </div>

                {account.nextMilestone && (
                  <div className="px-3 py-2 bg-zinc-950/50 rounded-sm border border-zinc-800">
                    <div className="flex items-center gap-2 text-xs">
                      <Target className="size-3 text-amber-500" />
                      <span className="font-mono text-zinc-400 truncate">
                        {account.nextMilestone}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(account)}
                    className="flex-1 rounded-sm h-8 text-xs border-dashed border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800 hover:text-amber-500"
                    data-testid={`button-edit-client-${account.id}`}
                  >
                    <Pencil className="size-3 mr-1.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteClientId(account.id)}
                    className="rounded-sm h-8 w-8 p-0 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                    data-testid={`button-delete-client-${account.id}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clientAccounts.length === 0 && (
          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-12 text-center">
              <Building2 className="size-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No hay clientes registrados actualmente</p>
              <Button onClick={() => handleOpenDialog()} className="rounded-sm">
                <Plus className="size-4 mr-2" />
                Crear Primer Cliente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-sm">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Actualiza los detalles del cliente" : "Agrega un nuevo cliente a tu cartera"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre del Cliente *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="ej. Acme Corporation"
                className="h-11"
                data-testid="input-company-name"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industria *</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger id="industry" className="h-11" data-testid="select-industry">
                  <SelectValue placeholder="Selecciona una industria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tech">Tech</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyBudget">Presupuesto Mensual ($)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData({ ...formData, monthlyBudget: parseFloat(e.target.value) || 0 })}
                  className="h-11"
                  data-testid="input-budget"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentSpend">Gasto Actual ($)</Label>
                <Input
                  id="currentSpend"
                  type="number"
                  value={formData.currentSpend}
                  onChange={(e) => setFormData({ ...formData, currentSpend: parseFloat(e.target.value) || 0 })}
                  className="h-11"
                  data-testid="input-spend"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthScore">Health Score (0-100)</Label>
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
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as "Active" | "Paused" | "Planning" })}
              >
                <SelectTrigger id="status" className="h-11" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Activo</SelectItem>
                  <SelectItem value="Paused">Pausado</SelectItem>
                  <SelectItem value="Planning">En Planificación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-sm h-11"
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-sm h-11"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {editingAccount ? "Actualizar" : "Crear"} Cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteClientId !== null} onOpenChange={() => setDeleteClientId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer y eliminará todos los proyectos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteClientId && deleteMutation.mutate(deleteClientId)}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileFAB
        label="Nuevo Cliente"
        onClick={() => handleOpenDialog()}
      />
    </div>
  );
});

export default FleetTracking;
