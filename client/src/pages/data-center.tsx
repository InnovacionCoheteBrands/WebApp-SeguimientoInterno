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
      return "border-muted-foreground text-muted-foreground bg-muted";
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
    fileSize: undefined,
    status: "Disponible",
    campaignId: undefined,
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
      fileSize: undefined,
      status: "Disponible",
      campaignId: undefined,
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
        fileSize: resource.fileSize ?? undefined,
        status: resource.status,
        campaignId: resource.campaignId ?? undefined,
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
    <div className="min-h-screen bg-[#030303] text-zinc-100 p-3 sm:p-8 font-sans selection:bg-primary/30">
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Intel Header & Control Node */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="outline" size="icon" className="size-12 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group-back">
                <ArrowLeft className="size-5 text-zinc-400 group-hover:text-white" />
              </Button>
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-white/10 text-primary">
                  <HardDrive className="size-5" />
                </div>
                <h1 className="text-4xl font-display italic tracking-tight text-white">Asset Intelligence</h1>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.4em] pl-1 opacity-60">Secure Infrastructure Resource Vault</p>
            </div>
          </div>
          
          <Button
            onClick={() => handleOpenDialog()}
            className="h-12 px-8 rounded-2xl bg-primary text-black font-mono font-bold text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary),0.2)]"
            data-testid="button-new-resource"
          >
            <Plus className="size-4 mr-2" />
            Initialize Resource
          </Button>
        </div>

        {/* Infrastructure Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-blue-500/10 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-all duration-500">
                  <HardDrive className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-display font-bold italic tracking-tighter text-white">{stats.totalSize} <span className="text-lg">MB</span></p>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Total Payload Weight</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-emerald-500/10 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-500">
                  <CheckCircle2 className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-display font-bold italic tracking-tighter text-white">{stats.disponibles} / {stats.total}</p>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Available Nodes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-orange-500/10 border border-white/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 transition-all duration-500">
                  <Clock className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-display font-bold italic tracking-tighter text-white">{stats.enUso}</p>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Active Deployments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="size-12 rounded-2xl bg-primary/10 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all duration-500">
                  <FolderKanban className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-display font-bold italic tracking-tighter text-white">{stats.total}</p>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Total Vault Registry</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assets Intelligence Vault Grid */}
        <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-display italic text-white tracking-tight">Resource Inventory</CardTitle>
                <CardDescription className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mt-1">High-Fidelity Neural Asset Registry</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${stats.total > 0 ? (stats.disponibles / stats.total) * 100 : 0}%` }} 
                  />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">Load: {stats.total > 0 ? Math.round((stats.disponibles / stats.total) * 100) : 0}%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {resources.map((resource) => {
                const statusGlow =
                  resource.status === "Disponible" ? "shadow-[0_0_15px_rgba(34,197,94,0.15)] border-green-500/30" :
                    resource.status === "En Uso" ? "shadow-[0_0_15px_rgba(249,115,22,0.15)] border-orange-500/30" :
                      resource.status === "En Revisión" ? "shadow-[0_0_15px_rgba(59,130,246,0.15)] border-blue-500/30" :
                        resource.status === "Aprobado" ? "shadow-[0_0_15px_rgba(16,185,129,0.15)] border-emerald-500/30" : "border-white/10";

                const statusDot =
                  resource.status === "Disponible" ? "bg-green-500" :
                    resource.status === "En Uso" ? "bg-orange-500" :
                      resource.status === "En Revisión" ? "bg-blue-500" :
                        resource.status === "Aprobado" ? "bg-emerald-500" : "bg-zinc-600";

                return (
                  <div
                    key={resource.id}
                    className={`group bg-white/[0.03] border rounded-[2rem] p-6 transition-all duration-500 hover:bg-white/[0.06] hover:scale-[1.02] relative overflow-hidden ${statusGlow}`}
                    data-testid={`resource-card-${resource.id}`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-100 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                            {getResourceIcon(resource.type)}
                          </div>
                          <div>
                            <h3 className="text-zinc-100 font-display font-medium tracking-tight text-base group-hover:text-white transition-colors">
                              {resource.name}
                            </h3>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mt-1">{resource.type}</p>
                          </div>
                        </div>
                        <Badge className={`rounded-full px-3 py-0.5 text-[8px] font-mono uppercase tracking-[0.1em] border-none flex items-center gap-1.5 ${resource.status === 'Disponible' ? 'bg-green-500/20 text-green-400' : resource.status === 'En Uso' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-zinc-400'}`}>
                          <div className={`size-1.5 rounded-full ${statusDot} animate-pulse`} />
                          {resource.status}
                        </Badge>
                      </div>

                      <div className="pt-2 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Metadata</p>
                          <p className="text-xs font-mono text-zinc-300">{resource.format} / {parseFloat(resource.fileSize || "0").toFixed(2)} MB</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Modified</p>
                          <p className="text-xs font-mono text-zinc-300">
                            {resource.lastModified ? formatDistanceToNow(new Date(resource.lastModified), { addSuffix: true, locale: es }) : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {resource.campaignId && (
                        <div className="pt-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                          <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Assigned Node</p>
                          <p className="text-[10px] font-mono text-primary font-bold">{getCampaignName(resource.campaignId)}</p>
                        </div>
                      )}

                      <div className="pt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(resource)}
                          className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-all text-[10px] font-mono uppercase tracking-widest"
                        >
                          <Pencil className="size-3.5 mr-2" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(resource.id)}
                          className="h-9 w-9 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-500/60 hover:bg-rose-500/20 hover:text-rose-500 transition-all"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {resources.length === 0 && (
              <div className="py-24 text-center space-y-4">
                <div className="size-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-700">
                  <FolderKanban className="size-8" />
                </div>
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Vault currently empty of deployable assets</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-sm">
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
                  onChange={(e) => setFormData({ ...formData, fileSize: e.target.value || undefined })}
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
