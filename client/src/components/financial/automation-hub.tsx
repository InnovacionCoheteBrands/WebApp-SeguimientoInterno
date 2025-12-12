import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecurringForm } from "./recurring-form";
import { RecurringTransaction } from "@shared/schema";
import { Plus, Pencil, Trash2, CalendarClock, Briefcase, Building2, Coins, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
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

export function AutomationHub({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState<RecurringTransaction | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formType, setFormType] = useState<"Ingreso" | "Gasto">("Ingreso");
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: recurringTransactions, isLoading } = useQuery<RecurringTransaction[]>({
        queryKey: ["/api/recurring_transactions"],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/recurring_transactions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/recurring_transactions"] });
            toast({ title: "Eliminado", description: "La automatización ha sido eliminada." });
            setDeleteId(null);
        }
    });

    const handleEdit = (item: RecurringTransaction) => {
        setEditItem(item);
        setFormType(item.type as "Ingreso" | "Gasto");
        setIsFormOpen(true);
    };

    const handleNew = (type: "Ingreso" | "Gasto") => {
        setEditItem(null);
        setFormType(type);
        setIsFormOpen(true);
    };

    const incomeTemplates = recurringTransactions?.filter(t => t.type === "Ingreso") || [];
    const expenseTemplates = recurringTransactions?.filter(t => t.type === "Gasto") || [];

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || <Button variant="outline"><CalendarClock className="mr-2 h-4 w-4" /> Automatizaciones</Button>}
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <div className="p-6 pb-2 border-b bg-muted/10">
                        <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                <CalendarClock className="h-6 w-6 text-primary" />
                                Hub de Automatización
                            </DialogTitle>
                            <CardDescription className="text-base">
                                Gestiona tus ingresos y gastos recurrentes. El sistema generará automáticamente las transacciones según tu configuración.
                            </CardDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-hidden p-6 pt-4">
                        <Tabs defaultValue="ingresos" className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="ingresos">Ingresos Recurrentes</TabsTrigger>
                                <TabsTrigger value="gastos">Gastos Recurrentes (Cuentas por Pagar)</TabsTrigger>
                            </TabsList>

                            <TabsContent value="ingresos" className="flex-1 overflow-hidden flex flex-col mt-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-green-600 flex items-center gap-2">
                                        <Coins className="h-5 w-5" /> Contratos y Retainers
                                    </h3>
                                    <Button onClick={() => handleNew("Ingreso")} size="sm" className="bg-green-600 hover:bg-green-700">
                                        <Plus className="mr-2 h-4 w-4" /> Nuevo Ingreso Automático
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1 pr-4">
                                    <div className="space-y-3">
                                        {incomeTemplates.length === 0 && (
                                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                                No hay ingresos recurrentes configurados.
                                            </div>
                                        )}
                                        {incomeTemplates.map(item => (
                                            <RecurringItem key={item.id} item={item} onEdit={handleEdit} onDelete={() => setDeleteId(item.id)} />
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="gastos" className="flex-1 overflow-hidden flex flex-col mt-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-red-600 flex items-center gap-2">
                                        <Building2 className="h-5 w-5" /> Servicios y Suscripciones
                                    </h3>
                                    <Button onClick={() => handleNew("Gasto")} size="sm" variant="destructive">
                                        <Plus className="mr-2 h-4 w-4" /> Nuevo Gasto Automático
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1 pr-4">
                                    <div className="space-y-3">
                                        {expenseTemplates.length === 0 && (
                                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                                No hay gastos recurrentes configurados.
                                            </div>
                                        )}
                                        {expenseTemplates.map(item => (
                                            <RecurringItem key={item.id} item={item} onEdit={handleEdit} onDelete={() => setDeleteId(item.id)} />
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>

            <RecurringForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                initialData={editItem}
                defaultType={formType}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la automatización y dejará de generar transacciones futuras.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function RecurringItem({ item, onEdit, onDelete }: { item: RecurringTransaction, onEdit: (i: RecurringTransaction) => void, onDelete: () => void }) {
    const isNextSoon = item.nextExecutionDate ? new Date(item.nextExecutionDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : false;

    return (
        <Card className="hover:bg-muted/30 transition-colors border-l-4" style={{ borderLeftColor: item.isActive ? (item.type === 'Ingreso' ? '#16a34a' : '#dc2626') : '#94a3b8' }}>
            <div className="flex items-center p-4 gap-4">
                <div className="p-2 rounded-full bg-background border shadow-sm">
                    {item.type === 'Ingreso' ? <Briefcase className="h-5 w-5 text-green-600" /> : <Building2 className="h-5 w-5 text-red-600" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                        {!item.isActive && <Badge variant="secondary" className="text-xs">Inactivo</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {translateFrequency(item.frequency)}
                        </span>
                        {item.nextExecutionDate && (
                            <span className={`flex items-center gap-1 ${isNextSoon ? "text-orange-600 font-medium" : ""}`}>
                                <ArrowRight className="h-3 w-3" /> Próx: {format(new Date(item.nextExecutionDate), "d 'de' MMM", { locale: es })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-right mr-4">
                    <div className="font-bold text-sm">
                        ${parseFloat(item.amount.toString()).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        + IVA: ${(parseFloat(item.amount.toString()) - (parseFloat(item.subtotal?.toString() || "0"))).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function translateFrequency(freq: string) {
    const map: Record<string, string> = {
        'weekly': 'Semanal',
        'biweekly': 'Quincenal',
        'monthly': 'Mensual',
        'quarterly': 'Trimestral',
        'yearly': 'Anual'
    };
    return map[freq] || freq;
}
