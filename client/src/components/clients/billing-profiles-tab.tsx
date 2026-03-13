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
        <div className="space-y-6">
            <div className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />
                <div className="flex items-center justify-between p-8 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-2xl bg-primary/10 border border-white/10 text-primary">
                            <FileText className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-display uppercase tracking-tight text-zinc-100 italic">Tax & Fiscal Registry</h3>
                            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-60 italic">Managed Billing Profiles</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => handleOpenDialog()} 
                        className="h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-mono text-[10px] uppercase tracking-widest px-6"
                    >
                        <Plus className="size-3.5 mr-2" />
                        Register New RFC
                    </Button>
                </div>
                <div className="p-8">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />)}
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="size-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                                <FileText className="size-8 text-zinc-600 opacity-20" />
                            </div>
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-40 italic">No fiscal data archives detected.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {profiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    className="flex items-center justify-between p-6 bg-zinc-950/20 border border-white/5 rounded-3xl hover:bg-white/5 hover:border-white/10 transition-all duration-300 group/item"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="size-12 rounded-2xl bg-zinc-900 border border-white/5 shadow-inner flex items-center justify-center">
                                            <Building className="size-6 text-zinc-500 group-hover/item:text-primary transition-colors duration-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-mono text-zinc-100 text-lg font-bold tracking-tight">
                                                    {profile.rfc}
                                                </p>
                                                {profile.isDefault && (
                                                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full h-5 px-3 text-[9px] font-mono font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                        Active Default
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-display uppercase tracking-tight text-muted-foreground mt-1 italic group-hover/item:text-zinc-300 transition-colors">
                                                {profile.businessName}
                                            </p>
                                            <div className="mt-2 text-[9px] font-mono text-primary/40 uppercase tracking-widest italic flex items-center gap-2">
                                                <div className="size-1 rounded-full bg-primary/20" />
                                                {CFDI_USES.find(u => u.value === profile.cfdiUse)?.label || profile.cfdiUse}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-20 group-hover/item:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(profile)} className="h-9 w-9 rounded-full hover:bg-white/10">
                                            <Pencil className="size-4 text-zinc-400" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                                            onClick={() => setDeleteProfileId(profile.id)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl bg-[#030303]/95 backdrop-blur-2xl border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <DialogHeader className="space-y-4">
                        <DialogTitle className="text-2xl font-display text-white italic tracking-tight">
                            {editingProfile ? "Modify Fiscal Archive" : "Initialize Tax Resource"}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">
                            Fiscal Records & Structural Billing Setup
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-8 mt-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="rfc" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Legal ID / RFC</Label>
                                <Input
                                    id="rfc"
                                    value={formData.rfc}
                                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                                    className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-mono uppercase text-primary tracking-wider"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxRegime" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Tax Regime Code</Label>
                                <Input
                                    id="taxRegime"
                                    value={formData.taxRegime}
                                    onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                                    className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessName" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Registered Business Entity</Label>
                            <Input
                                id="businessName"
                                value={formData.businessName}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-display italic"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cfdiUse" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Fiscal Purpose (CFDI Use)</Label>
                            <Select value={formData.cfdiUse} onValueChange={(value) => setFormData({ ...formData, cfdiUse: value })}>
                                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-mono text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-white/10 rounded-2xl">
                                    {CFDI_USES.map((use) => (
                                        <SelectItem key={use.value} value={use.value} className="text-[10px] font-mono uppercase tracking-widest py-3">
                                            {use.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary italic">Fiscal Address Endpoint</Label>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    value={formData.fiscalStreet}
                                    onChange={(e) => setFormData({ ...formData, fiscalStreet: e.target.value })}
                                    placeholder="STREET ARCHIVE"
                                    className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-mono text-[10px] uppercase tracking-widest"
                                />
                                <div className="grid grid-cols-3 gap-4">
                                    <Input
                                        value={formData.fiscalCity}
                                        onChange={(e) => setFormData({ ...formData, fiscalCity: e.target.value })}
                                        placeholder="CITY"
                                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-mono text-[10px] uppercase tracking-widest"
                                    />
                                    <Input
                                        value={formData.fiscalState}
                                        onChange={(e) => setFormData({ ...formData, fiscalState: e.target.value })}
                                        placeholder="STATE"
                                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-mono text-[10px] uppercase tracking-widest"
                                    />
                                    <Input
                                        value={formData.fiscalZip}
                                        onChange={(e) => setFormData({ ...formData, fiscalZip: e.target.value })}
                                        placeholder="Z.O.N.E"
                                        className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-mono text-[10px] uppercase tracking-widest"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                            <Checkbox
                                id="isDefault"
                                checked={formData.isDefault}
                                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: !!checked })}
                                className="rounded-md border-primary/30 data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor="isDefault" className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">Priority Fiscal Path</Label>
                        </div>

                        <DialogFooter className="pt-4 border-t border-white/10">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-full h-10 px-6 font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white">
                                Abort
                            </Button>
                            <Button type="submit" className="rounded-full h-10 px-8 bg-primary text-black font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)]" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingProfile ? "Apply Override" : "Finalize Archive"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteProfileId !== null} onOpenChange={() => setDeleteProfileId(null)}>
                <AlertDialogContent className="bg-[#030303]/95 backdrop-blur-2xl border-white/10 rounded-[2.5rem]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display italic text-white">Purge Fiscal Data</AlertDialogTitle>
                        <AlertDialogDescription className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                            Warning: This operation will permanently erase the fiscal profile from active registries. Existing invoices will not be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-full h-10 px-6 font-mono text-[10px] uppercase tracking-widest border-white/10 bg-white/5 text-zinc-400">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteProfileId && deleteMutation.mutate(deleteProfileId)}
                            className="rounded-full h-10 px-8 bg-red-500 text-white font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        >
                            Execute Purge
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
