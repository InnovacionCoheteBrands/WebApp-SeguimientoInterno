import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar, CheckCircle, AlertTriangle, Clock, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInstallmentsByProject, createInstallment, updateInstallment, deleteInstallment, generateInstallmentsForProject } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, isToday } from "date-fns";
import type { Installment, InsertInstallment, UpdateInstallment } from "@shared/schema";

interface InstallmentsTableProps {
    projectId: number;
}

export function InstallmentsTable({ projectId }: InstallmentsTableProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
    const [deleteInstallmentId, setDeleteInstallmentId] = useState<number | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: installments = [], isLoading } = useQuery({
        queryKey: ["installments", projectId],
        queryFn: () => fetchInstallmentsByProject(projectId),
    });

    const [formData, setFormData] = useState({
        installmentNumber: 1,
        concept: "",
        amount: "" as string | number,
        dueDate: "",
        status: "pending",
    });

    const createMutation = useMutation({
        mutationFn: (data: InsertInstallment) => createInstallment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["installments", projectId] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Éxito", description: "Parcialidad creada" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateInstallment }) => updateInstallment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["installments", projectId] });
            setIsDialogOpen(false);
            setEditingInstallment(null);
            resetForm();
            toast({ title: "Éxito", description: "Parcialidad actualizada" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteInstallment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["installments", projectId] });
            setDeleteInstallmentId(null);
            toast({ title: "Éxito", description: "Parcialidad eliminada" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const generateMutation = useMutation({
        mutationFn: () => generateInstallmentsForProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["installments", projectId] });
            toast({ title: "Éxito", description: "Parcialidades generadas correctamente" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const resetForm = () => {
        setFormData({
            installmentNumber: installments.length + 1,
            concept: "",
            amount: "",
            dueDate: "",
            status: "pending",
        });
        setEditingInstallment(null);
    };

    const handleOpenDialog = (installment?: Installment) => {
        if (installment) {
            setEditingInstallment(installment);
            setFormData({
                installmentNumber: installment.installmentNumber,
                // Use resolvedConcept or fallback to template or empty
                concept: (installment.resolvedConcept || installment.conceptTemplate || "") as string,
                amount: Number(installment.amount),
                dueDate: new Date(installment.dueDate).toISOString().split('T')[0],
                status: installment.status,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.concept || !formData.dueDate) {
            toast({ title: "Error", description: "Concepto y fecha de vencimiento son requeridos", variant: "destructive" });
            return;
        }

        const payload = {
            projectId,
            installmentNumber: formData.installmentNumber,
            amount: (formData.amount === "" ? 0 : Number(formData.amount)).toString(),
            dueDate: new Date(formData.dueDate),
            // Set resolved concept for display
            resolvedConcept: formData.concept,
            // Status handling
            status: formData.status
        };

        if (editingInstallment) {
            updateMutation.mutate({ id: editingInstallment.id, data: payload as UpdateInstallment });
        } else {
            createMutation.mutate(payload as unknown as InsertInstallment);
        }
    };

    const getStatusBadge = (status: string, dueDate: string) => {
        const isOverdue = status === "pending" && isPast(new Date(dueDate)) && !isToday(new Date(dueDate));

        if (status === "collected") {
            return (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs rounded-full">
                    <CheckCircle className="size-3 mr-1" />
                    Pagado
                </Badge>
            );
        }

        if (status === "cancelled") {
            return (
                <Badge variant="outline" className="bg-muted text-muted-foreground text-xs rounded-full">
                    Cancelado
                </Badge>
            );
        }

        if (isOverdue) {
            return (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs rounded-full">
                    <AlertTriangle className="size-3 mr-1" />
                    Vencido
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs rounded-full">
                <Clock className="size-3 mr-1" />
                Pendiente
            </Badge>
        );
    };

    return (
        <>
            <div className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-2xl bg-primary/10 border border-white/10 text-primary">
                            <Clock className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-display uppercase tracking-tight text-zinc-100">Plan de Recaudación</h3>
                            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Scheduled Fiscal Milestones</p>
                        </div>
                        {isLoading && <span className="text-[10px] font-mono text-primary animate-pulse ml-2 uppercase">Syncing...</span>}
                    </div>
                    <div className="flex gap-3">
                        {installments.length === 0 && (
                            <Button
                                onClick={() => generateMutation.mutate()}
                                disabled={generateMutation.isPending}
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-full border-dashed border-primary/30 text-primary hover:bg-primary/10 transition-all font-mono text-[10px] uppercase tracking-widest px-4"
                            >
                                <Wand2 className="size-3.5 mr-2" />
                                Smart Generate
                            </Button>
                        )}
                        <Button onClick={() => handleOpenDialog()} variant="ghost" size="sm" className="h-9 w-9 rounded-full hover:bg-white/5 border border-white/5 group-hover:border-white/20 transition-all">
                            <Plus className="size-4 text-zinc-400" />
                        </Button>
                    </div>
                </div>

                {installments.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-40 italic">
                            No active payment structures detected.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5 bg-zinc-950/20">
                        {installments
                            .sort((a, b) => a.installmentNumber - b.installmentNumber)
                            .map((installment) => (
                                <div key={installment.id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-all duration-300">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center justify-center size-10 bg-zinc-900 border border-white/5 rounded-2xl font-mono text-[11px] font-bold text-zinc-400 shadow-inner">
                                            {installment.installmentNumber.toString().padStart(2, '0')}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-100 italic tracking-tight">
                                                {installment.resolvedConcept || installment.conceptTemplate || "Unidentified Milestone"}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1.5 opacity-60">
                                                <Calendar className="size-3 opacity-50" />
                                                {format(new Date(installment.dueDate), "dd . MM . yyyy")}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <span className="font-mono text-sm font-bold text-zinc-100 italic tabular-nums">
                                            $ {Number(installment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>

                                        <div className="min-w-[100px] flex justify-end">
                                            {getStatusBadge(installment.status, installment.dueDate.toString())}
                                        </div>

                                        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(installment)} className="h-8 w-8 rounded-full hover:bg-white/10">
                                                <Pencil className="size-3.5 text-zinc-400" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteInstallmentId(installment.id)}
                                                className="h-8 w-8 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        <div className="p-6 bg-white/5 flex justify-between items-center">
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-60">Total Recaudación Anticipada</span>
                            <span className="font-mono text-lg font-bold text-primary italic tabular-nums">
                                $ {installments.reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle>{editingInstallment ? "Editar Parcialidad" : "Nueva Parcialidad"}</DialogTitle>
                        <DialogDescription>
                            Detalles del pago programado
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="installmentNumber">Número #</Label>
                                <Input
                                    id="installmentNumber"
                                    type="number"
                                    value={formData.installmentNumber}
                                    onChange={(e) => setFormData({ ...formData, installmentNumber: parseInt(e.target.value) || 1 })}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Vencimiento</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="concept">Concepto</Label>
                            <Input
                                id="concept"
                                value={formData.concept}
                                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                                placeholder="ej. Pago Mensual 1/12"
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={formData.amount === 0 ? "" : formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="h-10"
                            />
                        </div>

                        {editingInstallment && (
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={formData.status === "pending" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, status: "pending" })}
                                        className="flex-1 rounded-full"
                                    >
                                        Pendiente
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.status === "collected" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, status: "collected" })}
                                        className={`flex-1 rounded-full ${formData.status === "collected" ? "bg-green-600 hover:bg-green-700" : ""}`}
                                    >
                                        Pagado
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.status === "cancelled" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, status: "cancelled" })}
                                        className="flex-1 rounded-full"
                                    >
                                        Cancelado
                                    </Button>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full">
                                Cancelar
                            </Button>
                            <Button type="submit" className="rounded-full" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingInstallment ? "Actualizar" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteInstallmentId !== null} onOpenChange={() => setDeleteInstallmentId(null)}>
                <AlertDialogContent className="rounded-[2rem]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Parcialidad</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar esta parcialidad?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteInstallmentId && deleteMutation.mutate(deleteInstallmentId)}
                            className="rounded-full bg-destructive text-destructive-foreground"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
