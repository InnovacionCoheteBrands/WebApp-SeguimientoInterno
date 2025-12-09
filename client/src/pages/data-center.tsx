import { useMemo, memo, useState } from "react";
import { ArrowLeft, FolderKanban, HardDrive, CheckCircle2, Clock, Plus, Pencil, Trash2, Palette, FileText, Image, Brush, Video, File, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchResources, createResource, updateResource, deleteResource, fetchCampaigns } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { InsertResource, Resource } from "@shared/schema";

const RESOURCE_TYPES = ["Creative", "Copy", "Asset", "Design", "Video", "Document"] as const;
const RESOURCE_FORMATS = ["PSD", "AI", "MP4", "PDF", "DOC", "DOCX", "PNG", "JPG", "AE", "PR", "Otros"] as const;
const RESOURCE_STATUS = ["Disponible", "En Uso", "En Revisión", "Aprobado", "Archivado"] as const;

const getResourceIcon = (type: string) => {
  switch (type) {
    case "Creative":
      return <Palette className="size-5" />;
    case "Copy":
      return <FileText className="size-5" />;
    case "Asset":
      return <Image className="size-5" />;
    case "Design":
      return <Brush className="size-5" />;
    case "Video":
      return <Video className="size-5" />;
    case "Document":
      return <File className="size-5" />;
    default:
      return <File className="size-5" />;
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "Disponible":
      return "border-green-500 text-green-500 bg-green-500/10";
    case "En Uso":
      return "border-yellow-500 text-yellow-500 bg-yellow-500/10";
    case "En Revisión":
      return "border-blue-500 text-blue-500 bg-blue-500/10";
    case "Aprobado":
      return "border-emerald-600 text-emerald-600 bg-emerald-600/10";
    case "Archivado":
      return "border-gray-500 text-gray-500 bg-gray-500/10";
    default:
      return "border-border text-foreground";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Aprobado":
      return <CheckCircle2 className="size-5 text-emerald-600" />;
    case "En Revisión":
      return <Clock className="size-5 text-blue-500" />;
    case "Disponible":
      return <CheckCircle2 className="size-5 text-green-500" />;
    default:
      return <AlertCircle className="size-5 text-yellow-500" />;
  }
};

const DataCenter = memo(function DataCenter() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resources = [] } = useQuery({
    queryKey: ["resources"],
    queryFn: fetchResources,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });

  const stats = useMemo(() => {
    const totalSize = resources.reduce((sum, r) => sum + (parseFloat(r.fileSize || "0")), 0);
    const disponibles = resources.filter(r => r.status === "Disponible").length;
    const enUso = resources.filter(r => r.status === "En Uso").length;
    const total = resources.length;

    return {
      totalSize: totalSize.toFixed(2),
      disponibles,
      enUso,
      total,
    };
  }, [resources]);

  const [formData, setFormData] = useState<Partial<InsertResource>>({
    name: "",
    type: "Creative",
    format: "PSD",
    fileSize: null,
    status: "Disponible",
    campaignId: null,
    lastModified: new Date().toISOString(),
  });

  const createMutation = useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Éxito", description: "Recurso creado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertResource> }) =>
      updateResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsDialogOpen(false);
      setEditingResource(null);
      resetForm();
      toast({ title: "Éxito", description: "Recurso actualizado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setDeleteId(null);
      toast({ title: "Éxito", description: "Recurso eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "Creative",
      format: "PSD",
      fileSize: null,
      status: "Disponible",
      campaignId: null,
      lastModified: new Date().toISOString(),
    });
    setEditingResource(null);
  };

  const handleOpenDialog = (resource?: Resource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        name: resource.name,
        type: resource.type,
        format: resource.format,
        fileSize: resource.fileSize,
        status: resource.status,
        campaignId: resource.campaignId,
        lastModified: resource.lastModified || new Date().toISOString(),
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({ title: "Error", description: "Por favor ingrese el nombre del recurso", variant: "destructive" });
      return;
    }

    const dataToSubmit = {
      ...formData,
      lastModified: new Date().toISOString(),
    };

    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit as InsertResource);
    }
  };

  const getCampaignName = (campaignId: number | null) => {
    if (!campaignId) return null;
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.campaignCode : null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="rounded-sm" data-testid="button-back">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">Gestión de Recursos</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                Administrar Entregables y Assets
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-new-resource"
          >
            <Plus className="size-4 mr-2" />
            Nuevo Recurso
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Storage - Blue Accent */}
          <Card status="info" className="bg-zinc-900 border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-[10px] sm:text-xs font-mono uppercase text-zinc-500 tracking-wider">Almacenamiento Total</span>
                <HardDrive className="size-4 text-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-display font-medium tracking-tight text-foreground" data-testid="total-storage">
                  {stats.totalSize} MB
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-500">Espacio utilizado</p>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center text-[10px] sm:text-xs font-mono">
                <span className="text-blue-400">Total</span>
                <span className="text-zinc-500 ml-2">en archivos</span>
              </div>
            </CardContent>
          </Card>

          {/* Available - Green Accent */}
          <Card status="success" className="bg-zinc-900 border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-[10px] sm:text-xs font-mono uppercase text-zinc-500 tracking-wider">Recursos Disponibles</span>
                <CheckCircle2 className="size-4 text-green-500 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-display font-medium tracking-tight text-foreground" data-testid="resources-available">
                  {stats.disponibles}/{stats.total}
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-500">Listos para usar</p>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center text-[10px] sm:text-xs font-mono">
                <span className={stats.disponibles > 0 ? "text-green-400" : "text-yellow-400"}>
                  {stats.total > 0 ? Math.round((stats.disponibles / stats.total) * 100) : 0}%
                </span>
                <span className="text-zinc-500 ml-2">disponibilidad</span>
              </div>
            </CardContent>
          </Card>

          {/* In Use - Yellow Accent */}
          <Card status="warning" className="bg-zinc-900 border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-[10px] sm:text-xs font-mono uppercase text-zinc-500 tracking-wider">En Uso</span>
                <Clock className="size-4 text-orange-500 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-display font-medium tracking-tight text-foreground" data-testid="resources-in-use">
                  {stats.enUso}
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-500">Recursos activos</p>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center text-[10px] sm:text-xs font-mono">
                <span className={stats.enUso > 0 ? "text-orange-400" : "text-green-400"}>
                  {stats.enUso > 0 ? "Activo" : "Disponible"}
                </span>
                <span className="text-zinc-500 ml-2">estado</span>
              </div>
            </CardContent>
          </Card>

          {/* Total - Amber Accent (Primary) */}
          <Card status="default" className="bg-zinc-900 border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            {/* Note: Card default status handles border color if empty, but usually we might want specific colors. Card component default is primary/amber. */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500" />
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-[10px] sm:text-xs font-mono uppercase text-zinc-500 tracking-wider">Total de Recursos</span>
                <FolderKanban className="size-4 text-amber-500 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-display font-medium tracking-tight text-foreground" data-testid="total-resources">
                  {stats.total}
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-500">Entregables registrados</p>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center text-[10px] sm:text-xs font-mono">
                <span className="text-amber-500">Activos</span>
                <span className="text-zinc-500 ml-2">en catálogo</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50 shadow-sm relative overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-4">
            <CardTitle className="text-lg font-display uppercase tracking-tight flex items-center gap-2">
              <FolderKanban className="size-5 text-amber-500" />
              Recursos y Entregables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resources.map((resource) => {
                // Determine accent color based on status
                const statusColor =
                  resource.status === "Disponible" ? "bg-green-500" :
                    resource.status === "En Uso" ? "bg-orange-500" :
                      resource.status === "En Revisión" ? "bg-blue-500" :
                        resource.status === "Aprobado" ? "bg-emerald-600" : "bg-zinc-500";

                return (
                  <div
                    key={resource.id}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-sm border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-all gap-3 relative overflow-hidden"
                    data-testid={`resource-card-${resource.id}`}
                  >
                    {/* Status Accent Line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${statusColor} opacity-70`} />

                    <div className="flex items-center gap-4 pl-2 w-full sm:w-auto">
                      <div className="flex items-center justify-center size-10 rounded-full bg-black/40 shrink-0 border border-zinc-800">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground truncate" data-testid={`resource-name-${resource.id}`}>
                            {resource.name}
                          </p>
                          <Badge variant="outline" className="rounded-sm text-[10px] h-5 px-1.5 font-normal border-zinc-700 bg-zinc-950 text-zinc-400">
                            {resource.type}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 font-mono">
                          <span data-testid={`resource-format-${resource.id}`}>
                            {resource.format}
                          </span>
                          <span>•</span>
                          <span data-testid={`resource-size-${resource.id}`}>
                            {parseFloat(resource.fileSize || "0").toFixed(2)} MB
                          </span>
                          {resource.campaignId && getCampaignName(resource.campaignId) && (
                            <>
                              <span>•</span>
                              <span data-testid={`resource-campaign-${resource.id}`}>
                                {getCampaignName(resource.campaignId)}
                              </span>
                            </>
                          )}
                          {resource.lastModified && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span data-testid={`resource-modified-${resource.id}`} className="hidden sm:inline">
                                {formatDistanceToNow(new Date(resource.lastModified), { addSuffix: true, locale: es })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-2 sm:pl-0">
                      <Badge
                        variant="outline"
                        className={`rounded-sm text-[10px] font-normal ${getStatusBadgeClass(resource.status)}`}
                        data-testid={`resource-status-${resource.id}`}
                      >
                        {resource.status}
                      </Badge>
                      <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(resource)}
                          className="rounded-sm h-8 w-8 p-0 text-zinc-500 hover:text-amber-500"
                          data-testid={`button-edit-resource-${resource.id}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(resource.id)}
                          className="rounded-sm h-8 w-8 p-0 text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                          data-testid={`button-delete-resource-${resource.id}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {resources.length === 0 && (
              <div className="py-12 text-center text-zinc-500">
                <p>No hay recursos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-sm">
          <DialogHeader>
            <DialogTitle>{editingResource ? "Editar Recurso" : "Nuevo Recurso"}</DialogTitle>
            <DialogDescription>
              {editingResource ? "Actualiza la información del recurso" : "Agrega un nuevo recurso al catálogo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Recurso *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej. Banner principal campaña verano"
                data-testid="input-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type" data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Formato *</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) => setFormData({ ...formData, format: value })}
                >
                  <SelectTrigger id="format" data-testid="select-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_FORMATS.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fileSize">Tamaño (MB)</Label>
                <Input
                  id="fileSize"
                  type="number"
                  step="0.01"
                  value={formData.fileSize ?? ""}
                  onChange={(e) => setFormData({ ...formData, fileSize: e.target.value ? e.target.value : null })}
                  placeholder="0.00"
                  data-testid="input-file-size"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaña Asociada (opcional)</Label>
              <Select
                value={formData.campaignId?.toString() || "none"}
                onValueChange={(value) => setFormData({ ...formData, campaignId: value === "none" ? null : parseInt(value) })}
              >
                <SelectTrigger id="campaignId" data-testid="select-campaign">
                  <SelectValue placeholder="Seleccionar campaña" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin campaña</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.campaignCode} - {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-sm"
                data-testid="button-cancel-resource"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-sm"
                disabled={createMutation.isPending}
                data-testid="button-submit-resource"
              >
                {editingResource ? "Actualizar" : "Crear"} Recurso
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Recurso</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este recurso? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" data-testid="button-cancel-delete-resource">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-resource"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default DataCenter;
