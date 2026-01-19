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
        amount: 0,
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
            amount: 0,
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
            amount: formData.amount.toString(),
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
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs rounded-sm">
                    <CheckCircle className="size-3 mr-1" />
                    Pagado
                </Badge>
            );
        }

        if (status === "cancelled") {
            return (
                <Badge variant="outline" className="bg-muted text-muted-foreground text-xs rounded-sm">
                    Cancelado
                </Badge>
            );
        }

        if (isOverdue) {
            return (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs rounded-sm">
                    <AlertTriangle className="size-3 mr-1" />
                    Vencido
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs rounded-sm">
                <Clock className="size-3 mr-1" />
                Pendiente
            </Badge>
        );
    };

    return (
        <>
            <div className="rounded-sm border border-border bg-card">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">Calendario de Pagos</h3>
                        {isLoading && <span className="text-xs text-muted-foreground">Cargando...</span>}
                    </div>
                    <div className="flex gap-2">
                        {installments.length === 0 && (
                            <Button
                                onClick={() => generateMutation.mutate()}
                                disabled={generateMutation.isPending}
                                variant="outline"
                                size="sm"
                                className="h-8 border-dashed border-primary/50 text-primary hover:bg-primary/5"
                            >
                                <Wand2 className="size-3 mr-2" />
                                Generar Automático
                            </Button>
                        )}
                        <Button onClick={() => handleOpenDialog()} variant="ghost" size="sm" className="h-8">
                            <Plus className="size-4 mr-2" />
                            Agregar
                        </Button>
                    </div>
                </div>

                {installments.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        No hay parcialidades generadas
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {installments
                            .sort((a, b) => a.installmentNumber - b.installmentNumber)
                            .map((installment) => (
                                <div key={installment.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center size-8 bg-muted rounded-full font-mono text-sm font-medium">
                                            {installment.installmentNumber}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {installment.resolvedConcept || installment.conceptTemplate || "Sin concepto"}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <Calendar className="size-3" />
                                                {format(new Date(installment.dueDate), "dd/MM/yyyy")}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="font-mono text-sm font-medium">
                                            ${Number(installment.amount).toLocaleString()}
                                        </span>

                                        {getStatusBadge(installment.status, installment.dueDate.toString())}

                                        <div className="flex items-center">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(installment)} className="h-8 w-8">
                                                <Pencil className="size-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteInstallmentId(installment.id)}
                                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        <div className="p-4 bg-muted/30 flex justify-between items-center font-medium text-sm">
                            <span>Total</span>
                            <span>
                                ${installments.reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl rounded-sm">
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
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
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
                                        className="flex-1 rounded-sm"
                                    >
                                        Pendiente
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.status === "collected" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, status: "collected" })}
                                        className={`flex-1 rounded-sm ${formData.status === "collected" ? "bg-green-600 hover:bg-green-700" : ""}`}
                                    >
                                        Pagado
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.status === "cancelled" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, status: "cancelled" })}
                                        className="flex-1 rounded-sm"
                                    >
                                        Cancelado
                                    </Button>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-sm">
                                Cancelar
                            </Button>
                            <Button type="submit" className="rounded-sm" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingInstallment ? "Actualizar" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteInstallmentId !== null} onOpenChange={() => setDeleteInstallmentId(null)}>
                <AlertDialogContent className="rounded-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Parcialidad</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar esta parcialidad?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-sm">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteInstallmentId && deleteMutation.mutate(deleteInstallmentId)}
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
