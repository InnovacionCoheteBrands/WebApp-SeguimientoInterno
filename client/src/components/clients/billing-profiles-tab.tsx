import { useState } from "react";
import { Plus, Pencil, Trash2, FileText, Building, CheckCircle } from "lucide-react";
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
import { fetchBillingProfilesByClient, createBillingProfile, updateBillingProfile, deleteBillingProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { BillingProfile, InsertBillingProfile, UpdateBillingProfile } from "@shared/schema";

interface BillingProfilesTabProps {
    clientId: number;
}

const CFDI_USES = [
    { value: "G01", label: "G01 - Adquisición de mercancías" },
    { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
    { value: "G03", label: "G03 - Gastos en general" },
    { value: "I01", label: "I01 - Construcciones" },
    { value: "I02", label: "I02 - Mobiliario y equipo de oficina" },
    { value: "I03", label: "I03 - Equipo de transporte" },
    { value: "I04", label: "I04 - Equipo de cómputo" },
    { value: "P01", label: "P01 - Por definir" },
    { value: "S01", label: "S01 - Sin efectos fiscales" },
];

export function BillingProfilesTab({ clientId }: BillingProfilesTabProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<BillingProfile | null>(null);
    const [deleteProfileId, setDeleteProfileId] = useState<number | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: profiles = [], isLoading } = useQuery({
        queryKey: ["billing-profiles", clientId],
        queryFn: () => fetchBillingProfilesByClient(clientId),
    });

    const [formData, setFormData] = useState({
        rfc: "",
        businessName: "",
        cfdiUse: "G03",
        taxRegime: "",
        fiscalStreet: "",
        fiscalCity: "",
        fiscalState: "",
        fiscalZip: "",
        isDefault: false,
    });

    const createMutation = useMutation({
        mutationFn: createBillingProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing-profiles", clientId] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Éxito", description: "Perfil de facturación creado" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateBillingProfile }) => updateBillingProfile(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing-profiles", clientId] });
            setIsDialogOpen(false);
            setEditingProfile(null);
            resetForm();
            toast({ title: "Éxito", description: "Perfil actualizado" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteBillingProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing-profiles", clientId] });
            setDeleteProfileId(null);
            toast({ title: "Éxito", description: "Perfil eliminado" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const resetForm = () => {
        setFormData({
            rfc: "",
            businessName: "",
            cfdiUse: "G03",
            taxRegime: "",
            fiscalStreet: "",
            fiscalCity: "",
            fiscalState: "",
            fiscalZip: "",
            isDefault: false,
        });
        setEditingProfile(null);
    };

    const handleOpenDialog = (profile?: BillingProfile) => {
        if (profile) {
            setEditingProfile(profile);
            setFormData({
                rfc: profile.rfc,
                businessName: profile.businessName,
                cfdiUse: profile.cfdiUse,
                taxRegime: profile.taxRegime || "",
                fiscalStreet: profile.fiscalStreet || "",
                fiscalCity: profile.fiscalCity || "",
                fiscalState: profile.fiscalState || "",
                fiscalZip: profile.fiscalZip || "",
                isDefault: profile.isDefault,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.rfc || !formData.businessName || !formData.cfdiUse) {
            toast({ title: "Error", description: "RFC, Razón Social y Uso CFDI son requeridos", variant: "destructive" });
            return;
        }

        const payload = { ...formData, clientId };

        if (editingProfile) {
            updateMutation.mutate({ id: editingProfile.id, data: formData });
        } else {
            createMutation.mutate(payload as InsertBillingProfile);
        }
    };

    return (
        <>
            <Card className="rounded-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Perfiles de Facturación</CardTitle>
                    <Button onClick={() => handleOpenDialog()} className="rounded-sm" size="sm">
                        <Plus className="size-4 mr-2" />
                        Agregar RFC
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground">Cargando...</p>
                    ) : profiles.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay perfiles de facturación</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {profiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    className="flex items-center justify-between p-4 border border-border rounded-sm bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Building className="size-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono font-medium">{profile.rfc}</p>
                                                {profile.isDefault && (
                                                    <Badge variant="outline" className="text-xs rounded-sm text-green-500 border-green-500/30">
                                                        <CheckCircle className="size-3 mr-1" />
                                                        Default
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{profile.businessName}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {CFDI_USES.find(u => u.value === profile.cfdiUse)?.label || profile.cfdiUse}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(profile)}>
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-red-500"
                                            onClick={() => setDeleteProfileId(profile.id)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl rounded-sm">
                    <DialogHeader>
                        <DialogTitle>{editingProfile ? "Editar Perfil" : "Nuevo Perfil de Facturación"}</DialogTitle>
                        <DialogDescription>
                            Datos fiscales para facturación (RFC / Razón Social)
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rfc">RFC *</Label>
                            <Input
                                id="rfc"
                                value={formData.rfc}
                                onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                                placeholder="XAXX010101000"
                                className="h-10 font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessName">Razón Social *</Label>
                            <Input
                                id="businessName"
                                value={formData.businessName}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cfdiUse">Uso CFDI *</Label>
                            <Select value={formData.cfdiUse} onValueChange={(value) => setFormData({ ...formData, cfdiUse: value })}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CFDI_USES.map((use) => (
                                        <SelectItem key={use.value} value={use.value}>{use.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="taxRegime">Régimen Fiscal</Label>
                            <Input
                                id="taxRegime"
                                value={formData.taxRegime}
                                onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                                placeholder="601 - General de Ley PM"
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Dirección Fiscal</Label>
                            <Input
                                value={formData.fiscalStreet}
                                onChange={(e) => setFormData({ ...formData, fiscalStreet: e.target.value })}
                                placeholder="Calle y número"
                                className="h-10"
                            />
                            <div className="grid grid-cols-3 gap-2">
                                <Input
                                    value={formData.fiscalCity}
                                    onChange={(e) => setFormData({ ...formData, fiscalCity: e.target.value })}
                                    placeholder="Ciudad"
                                    className="h-10"
                                />
                                <Input
                                    value={formData.fiscalState}
                                    onChange={(e) => setFormData({ ...formData, fiscalState: e.target.value })}
                                    placeholder="Estado"
                                    className="h-10"
                                />
                                <Input
                                    value={formData.fiscalZip}
                                    onChange={(e) => setFormData({ ...formData, fiscalZip: e.target.value })}
                                    placeholder="C.P."
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="isDefault"
                                checked={formData.isDefault}
                                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: !!checked })}
                            />
                            <Label htmlFor="isDefault" className="text-sm font-normal">Usar como perfil predeterminado</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-sm">
                                Cancelar
                            </Button>
                            <Button type="submit" className="rounded-sm" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingProfile ? "Actualizar" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteProfileId !== null} onOpenChange={() => setDeleteProfileId(null)}>
                <AlertDialogContent className="rounded-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Perfil</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este perfil de facturación?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-sm">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteProfileId && deleteMutation.mutate(deleteProfileId)}
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
