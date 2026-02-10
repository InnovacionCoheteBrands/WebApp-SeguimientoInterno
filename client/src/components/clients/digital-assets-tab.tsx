import { useState } from "react";
import { Plus, Pencil, Trash2, Globe, Server, Shield, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDigitalAssetsByClient, createDigitalAsset, updateDigitalAsset, deleteDigitalAsset } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import type { DigitalAsset, InsertDigitalAsset, UpdateDigitalAsset } from "@shared/schema";

interface DigitalAssetsTabProps {
    clientId: number;
}

export function DigitalAssetsTab({ clientId }: DigitalAssetsTabProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<DigitalAsset | null>(null);
    const [deleteAssetId, setDeleteAssetId] = useState<number | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: assets = [], isLoading } = useQuery({
        queryKey: ["digital-assets", clientId],
        queryFn: () => fetchDigitalAssetsByClient(clientId),
    });

    const [formData, setFormData] = useState({
        type: "domain",
        name: "",
        provider: "",
        expirationDate: "",
        cost: 0,
        autoRenew: true,
        status: "active",
    });

    const createMutation = useMutation({
        mutationFn: createDigitalAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["digital-assets", clientId] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Éxito", description: "Activo digital creado" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateDigitalAsset }) => updateDigitalAsset(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["digital-assets", clientId] });
            setIsDialogOpen(false);
            setEditingAsset(null);
            resetForm();
            toast({ title: "Éxito", description: "Activo actualizado" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteDigitalAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["digital-assets", clientId] });
            setDeleteAssetId(null);
            toast({ title: "Éxito", description: "Activo eliminado" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // Helper: Get icon for asset type
    const getIcon = (type: string) => {
        switch (type) {
            case "domain": return <Globe className="size-5 text-blue-500" />;
            case "hosting": return <Server className="size-5 text-purple-500" />;
            case "ssl": return <Shield className="size-5 text-green-500" />;
            case "email": return <Mail className="size-5 text-orange-500" />;
            default: return <Globe className="size-5" />;
        }
    };

    // Helper: Get expiration status badge info
    const getExpirationStatus = (date: Date | null): { label: string; color: string } | null => {
        if (!date) return null;
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: `Vencido hace ${Math.abs(diffDays)} días`, color: "text-red-500 border-red-200" };
        if (diffDays <= 30) return { label: `Vence en ${diffDays} días`, color: "text-red-500 border-red-200" };
        if (diffDays <= 60) return { label: `Vence en ${diffDays} días`, color: "text-yellow-500 border-yellow-200" };
        return { label: `Vence en ${diffDays} días`, color: "text-green-500 border-green-200" };
    };

    // Reset form now clears selected files
    const resetForm = () => {
        setFormData({
            type: "domain",
            name: "",
            provider: "",
            expirationDate: "",
            cost: 0,
            autoRenew: true,
            status: "active",
        });
        setSelectedFiles([]);
        setEditingAsset(null);
    };

    const handleOpenDialog = (asset?: DigitalAsset) => {
        if (asset) {
            setEditingAsset(asset);
            setFormData({
                type: asset.assetType,
                name: asset.name,
                provider: asset.provider || "",
                expirationDate: asset.expirationDate ? new Date(asset.expirationDate).toISOString().split('T')[0] : "",
                cost: asset.cost ? Number(asset.cost) : 0,
                autoRenew: asset.autoRenew,
                status: asset.status,
            });
            setSelectedFiles([]); // Files are not editable directly, only append. Existing files shown in list.
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.type) {
            toast({ title: "Error", description: "Nombre y tipo son requeridos", variant: "destructive" });
            return;
        }

        // Build JSON payload for API
        const payload: UpdateDigitalAsset = {
            clientId,
            assetType: formData.type,
            name: formData.name,
            provider: formData.provider || null,
            cost: formData.cost ? formData.cost.toString() : undefined,
            autoRenew: formData.autoRenew,
            status: formData.status,
            expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : null,
        };

        if (editingAsset) {
            updateMutation.mutate({ id: editingAsset.id, data: payload });
        } else {
            createMutation.mutate(payload as InsertDigitalAsset);
        }
    };

    // ... helper functions ...

    return (
        <>
            <Card className="rounded-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Dominios y Hosting (D&H)</CardTitle>
                    <Button onClick={() => handleOpenDialog()} className="rounded-sm" size="sm">
                        <Plus className="size-4 mr-2" />
                        Agregar Activo
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground">Cargando...</p>
                    ) : assets.length === 0 ? (
                        <div className="text-center py-8">
                            <Globe className="size-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay activos digitales registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {assets.map((asset) => {
                                const expiration = getExpirationStatus(asset.expirationDate ? new Date(asset.expirationDate) : null);
                                const hasFiles = asset.files && Array.isArray(asset.files) && asset.files.length > 0;

                                return (
                                    <div
                                        key={asset.id}
                                        className="flex flex-col p-4 border border-border rounded-[2rem] bg-card hover:bg-muted/50 transition-colors gap-3 relative overflow-hidden group"
                                    >
                                        {/* Neon Side Stripe based on expiration */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-transparent ${expiration?.color.includes('red') ? 'via-red-500' :
                                            expiration?.color.includes('yellow') ? 'via-yellow-500' :
                                                'via-green-500'
                                            } to-transparent opacity-70 group-hover:opacity-100 transition-opacity`} />
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    {getIcon(asset.assetType)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{asset.name}</p>
                                                        <Badge variant="outline" className="text-[10px] uppercase rounded-full">
                                                            {asset.assetType}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                        <span>{asset.provider}</span>
                                                        {asset.cost && <span>| ${Number(asset.cost).toFixed(2)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {expiration && (
                                                    <Badge variant="outline" className={`text-xs rounded-full font-normal ${expiration.color}`}>
                                                        {expiration.label}
                                                    </Badge>
                                                )}

                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(asset)}>
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-red-500"
                                                        onClick={() => setDeleteAssetId(asset.id)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {hasFiles && (
                                            <div className="pl-[3.5rem] flex flex-wrap gap-2">
                                                {asset.files?.map((file: any, index: number) => (
                                                    <a
                                                        key={index}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1 text-xs text-primary hover:underline bg-primary/5 px-2 py-1 rounded-sm border border-primary/20"
                                                    >
                                                        <ExternalLink className="size-3" />
                                                        {file.name}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-xl rounded-sm">
                    <DialogHeader>
                        <DialogTitle>{editingAsset ? "Editar Activo" : "Nuevo Activo Digital"}</DialogTitle>
                        <DialogDescription>
                            Administra dominios, hosting y certificados SSL
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo *</Label>
                                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="domain">Dominio</SelectItem>
                                        <SelectItem value="hosting">Hosting</SelectItem>
                                        <SelectItem value="ssl">Certificado SSL</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="other">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Estado</Label>
                                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Activo</SelectItem>
                                        <SelectItem value="expired">Vencido</SelectItem>
                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre / URL *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="ej. miempresa.com"
                                className="h-10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="provider">Proveedor</Label>
                                <Input
                                    id="provider"
                                    value={formData.provider}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                    placeholder="ej. GoDaddy"
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cost">Costo ($)</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expirationDate">Fecha de Vencimiento</Label>
                            <Input
                                id="expirationDate"
                                type="date"
                                value={formData.expirationDate}
                                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="files">Archivos Adjuntos</Label>
                            <Input
                                id="files"
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="cursor-pointer"
                            />
                            {selectedFiles.length > 0 && (
                                <ul className="text-xs text-muted-foreground list-disc pl-4 mt-1">
                                    {selectedFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                                </ul>
                            )}
                            {editingAsset && editingAsset.files && Array.isArray(editingAsset.files) && editingAsset.files.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs font-medium mb-1">Archivos actuales:</p>
                                    <ul className="text-xs text-muted-foreground list-disc pl-4">
                                        {editingAsset.files.map((f: any, i) => <li key={i}>{f.name}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="autoRenew"
                                checked={formData.autoRenew}
                                onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: !!checked })}
                            />
                            <Label htmlFor="autoRenew" className="text-sm font-normal">Renovación automática</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-sm">
                                Cancelar
                            </Button>
                            <Button type="submit" className="rounded-sm" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingAsset ? "Actualizar" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteAssetId !== null} onOpenChange={() => setDeleteAssetId(null)}>
                <AlertDialogContent className="rounded-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Activo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este activo digital?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-sm">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteAssetId && deleteMutation.mutate(deleteAssetId)}
                            className="rounded-sm bg-destructive text-destructive-foreground"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
