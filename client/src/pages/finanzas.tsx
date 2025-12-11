import { useState, useMemo, useCallback } from "react";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Settings2,
    CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchFinancialSummary,
    fetchMonthlyPayables,
    fetchMonthlyReceivables,
    markObligationAsPaid,
    unpayObligation,
    fetchRecurringTransactions,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    type FinancialSummary,
} from "@/lib/api";
import type { Transaction, InsertTransaction, UpdateTransaction, RecurringTransaction, InsertRecurringTransaction, UpdateRecurringTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format-currency";
import { format } from "date-fns";
import { ClientSelector } from "@/components/financial/client-selector";

// Category options
const INCOME_CATEGORIES = [
    "Servicios Digitales",
    "Consultoría",
    "Retainers",
    "Proyectos One-Time",
    "Otros Ingresos",
];

const EXPENSE_CATEGORIES = [
    "Nómina",
    "Software/Herramientas",
    "Oficina",
    "Marketing",
    "Operaciones",
    "Otros Gastos",
];

export default function Finanzas() {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const [newTransaction, setNewTransaction] = useState<InsertTransaction>({
        type: "Ingreso",
        category: "",
        amount: "0",
        date: new Date(),
        isPaid: true,
        paidDate: new Date(),
        description: "",
        clientId: null,
        // status and relatedClient removed from initial state
    });

    const [editTransaction, setEditTransaction] = useState<UpdateTransaction>({});

    // Recurrence configuration state
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringConfig, setRecurringConfig] = useState({
        name: "",
        frequency: "monthly" as "monthly" | "yearly",
        dayOfMonth: 1,
    });

    // Recurring templates management state
    const [recurringSheetOpen, setRecurringSheetOpen] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
    const [editRecurringDialogOpen, setEditRecurringDialogOpen] = useState(false);
    const [deleteRecurringDialogOpen, setDeleteRecurringDialogOpen] = useState(false);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch transactions and financial summary
    const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
        queryKey: ["transactions"],
        queryFn: fetchTransactions,
    });

    const { data: summary, isLoading: summaryLoading } = useQuery<FinancialSummary>({
        queryKey: ["financial-summary"],
        queryFn: () => fetchFinancialSummary(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            setCreateDialogOpen(false);
            resetNewTransaction();
            toast({
                title: "Transacción Creada",
                description: "La transacción ha sido registrada exitosamente.",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "No se pudo crear la transacción.",
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateTransaction }) =>
            updateTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            setEditDialogOpen(false);
            toast({
                title: "Transacción Actualizada",
                description: "La transacción ha sido actualizada exitosamente.",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            setDeleteDialogOpen(false);
            toast({
                title: "Transacción Eliminada",
                description: "La transacción ha sido eliminada del sistema.",
            });
        },
    });

    // Monthly Obligations Queries
    const currentDate = useMemo(() => new Date(), []);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const { data: monthlyPayables = [], isLoading: payablesLoading } = useQuery({
        queryKey: ["monthly-payables", currentYear, currentMonth],
        queryFn: () => fetchMonthlyPayables(currentYear, currentMonth),
    });

    const { data: monthlyReceivables = [], isLoading: receivablesLoading } = useQuery({
        queryKey: ["monthly-receivables", currentYear, currentMonth],
        queryFn: () => fetchMonthlyReceivables(currentYear, currentMonth),
    });

    const markAsPaidMutation = useMutation({
        mutationFn: ({ id, paidDate }: { id: number; paidDate?: Date }) =>
            markObligationAsPaid(id, paidDate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["monthly-payables"] });
            queryClient.invalidateQueries({ queryKey: ["monthly-receivables"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            toast({
                title: "Obligación Marcada",
                description: "La obligación ha sido marcada como pagada exitosamente.",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "No se pudo marcar la obligación como pagada.",
                variant: "destructive",
            });
        },
    });

    // Recurring Transactions Query and Mutations
    const { data: recurringTemplates = [], isLoading: recurringLoading } = useQuery({
        queryKey: ["recurring-transactions"],
        queryFn: fetchRecurringTransactions,
    });

    const createRecurringMutation = useMutation({
        mutationFn: createRecurringTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["monthly-payables"] });
            queryClient.invalidateQueries({ queryKey: ["monthly-receivables"] });
            toast({
                title: "Recurrente Creado",
                description: "La transacción recurrente ha sido registrada.",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "No se pudo crear el recurrente.",
                variant: "destructive",
            });
        },
    });

    const updateRecurringMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateRecurringTransaction }) =>
            updateRecurringTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["monthly-payables"] });
            queryClient.invalidateQueries({ queryKey: ["monthly-receivables"] });
            setEditRecurringDialogOpen(false);
            setEditingRecurring(null);
            toast({
                title: "Recurrente Actualizado",
                description: "La plantilla ha sido actualizada.",
            });
        },
    });

    const deleteRecurringMutation = useMutation({
        mutationFn: deleteRecurringTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["monthly-payables"] });
            queryClient.invalidateQueries({ queryKey: ["monthly-receivables"] });
            setDeleteRecurringDialogOpen(false);
            setEditingRecurring(null);
            toast({
                title: "Recurrente Eliminado",
                description: "La plantilla ha sido eliminada.",
            });
        },
    });

    // Mutation to revert paid status (unpay)
    const unpayMutation = useMutation({
        mutationFn: unpayObligation,
        onSuccess: () => {
            // Invalidate with predicate to match all monthly queries regardless of year/month params
            queryClient.invalidateQueries({
                predicate: (query) => {
                    const key = query.queryKey[0];
                    return key === "recurring-transactions" ||
                        key === "monthly-payables" ||
                        key === "monthly-receivables";
                }
            });
            toast({
                title: "Estado Revertido",
                description: "La obligación ahora aparece como pendiente de pago.",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "No se pudo revertir el estado de pago.",
                variant: "destructive",
            });
        },
    });

    // Helper function to check if a recurring template is paid this month
    const isPaidThisMonth = useCallback((template: RecurringTransaction): boolean => {
        if (!template.lastExecutionDate) return false;
        const lastPaidDate = new Date(template.lastExecutionDate);
        const now = new Date();
        return lastPaidDate.getFullYear() === now.getFullYear() &&
            lastPaidDate.getMonth() === now.getMonth();
    }, []);

    const resetNewTransaction = useCallback(() => {
        setNewTransaction({
            type: "Ingreso",
            category: "",
            amount: "0",
            date: new Date(),
            isPaid: true,
            paidDate: new Date(),
            description: "",
        });
        // Reset recurrence config
        setIsRecurring(false);
        setRecurringConfig({
            name: "",
            frequency: "monthly",
            dayOfMonth: 1,
        });
    }, []);

    // Handler for creating transaction (with optional recurrence)
    const handleCreateTransaction = useCallback(async () => {
        if (!newTransaction.category || !newTransaction.amount) {
            toast({
                title: "Error de Validación",
                description: "La categoría y el monto son requeridos.",
                variant: "destructive",
            });
            return;
        }

        // Validate amount is a valid number
        const amountNum = parseFloat(newTransaction.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast({
                title: "Error de Validación",
                description: "El monto debe ser un número mayor a cero.",
                variant: "destructive",
            });
            return;
        }

        // Validate isPaid + paidDate consistency
        if (newTransaction.isPaid && !newTransaction.paidDate) {
            toast({
                title: "Error de Validación",
                description: "La fecha de pago es requerida cuando está marcado como pagado.",
                variant: "destructive",
            });
            return;
        }

        // If it's a recurring transaction
        if (isRecurring) {
            // Validate recurrence name
            if (!recurringConfig.name.trim()) {
                toast({
                    title: "Error de Validación",
                    description: "El nombre del recurrente es requerido.",
                    variant: "destructive",
                });
                return;
            }

            // Calculate next execution date based on frequency and day
            const nextExecDate = new Date();
            nextExecDate.setDate(recurringConfig.dayOfMonth);
            if (nextExecDate <= new Date()) {
                // If the day has passed this month, set to next month
                nextExecDate.setMonth(nextExecDate.getMonth() + 1);
            }

            // Create the recurring template
            const recurringData: InsertRecurringTransaction = {
                name: recurringConfig.name.trim(),
                type: newTransaction.type,
                category: newTransaction.category,
                amount: newTransaction.amount,
                frequency: recurringConfig.frequency,
                dayOfMonth: recurringConfig.dayOfMonth,
                description: newTransaction.description?.trim() || undefined,
                isActive: true,
                nextExecutionDate: nextExecDate,
            };

            createRecurringMutation.mutate(recurringData);

            // Also create the first transaction (if marked as paid this month)
            if (newTransaction.isPaid) {
                const transactionData: InsertTransaction = {
                    ...newTransaction,
                    description: newTransaction.description?.trim() || undefined,
                    relatedClient: newTransaction.relatedClient?.trim() || undefined,
                    status: "Pagado",
                    isRecurringInstance: true,
                    source: "recurring_template",
                };
                createMutation.mutate(transactionData);
            }

            // Close dialog and reset
            setCreateDialogOpen(false);
            resetNewTransaction();
        } else {
            // Normal (non-recurring) transaction
            const transactionData: InsertTransaction = {
                ...newTransaction,
                description: newTransaction.description?.trim() || undefined,
                relatedClient: newTransaction.relatedClient?.trim() || undefined,
                // Status is now handled by backend based on isPaid
            };

            createMutation.mutate(transactionData);
        }
    }, [newTransaction, isRecurring, recurringConfig, createMutation, createRecurringMutation, toast, resetNewTransaction]);

    const handleEditTransaction = useCallback(() => {
        if (!selectedTransaction) return;

        const editData: UpdateTransaction = {
            ...editTransaction,
            description: editTransaction.description?.trim() || undefined,
            relatedClient: editTransaction.relatedClient?.trim() || undefined,
            // Status update removed, backend syncs it from isPaid
        };

        updateMutation.mutate({
            id: selectedTransaction.id,
            data: editData,
        });
    }, [selectedTransaction, editTransaction, updateMutation]);

    const handleDeleteTransaction = useCallback(() => {
        if (!selectedTransaction) return;
        deleteMutation.mutate(selectedTransaction.id);
    }, [selectedTransaction, deleteMutation]);

    const openEditDialog = useCallback((transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setEditTransaction({
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            date: transaction.date,
            isPaid: transaction.isPaid,  // ✅ Include new field
            paidDate: transaction.paidDate,  // ✅ Include new field
            status: transaction.status,  // ⚠️ Backward compatibility
            description: transaction.description,
            relatedClient: transaction.relatedClient,
            clientId: transaction.clientId,
        });
        setEditDialogOpen(true);
    }, []);

    const openDeleteDialog = useCallback((transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setDeleteDialogOpen(true);
    }, []);

    const handleToggleTransactionStatus = useCallback((transaction: Transaction) => {
        // Just toggle isPaid, backend will sync status
        const newIsPaid = !transaction.isPaid;
        updateMutation.mutate({
            id: transaction.id,
            data: {
                isPaid: newIsPaid,
                paidDate: newIsPaid ? new Date() : undefined,
            },
        });
    }, [updateMutation]);

    // Filter transactions and separate pending from resolved
    const filteredTransactions = useMemo(() => {
        let filtered = transactions;
        if (typeFilter !== "all") {
            filtered = filtered.filter((t) => t.type === typeFilter);
        }
        if (statusFilter !== "all") {
            filtered = filtered.filter((t) => t.status === statusFilter);
        }
        return filtered;
    }, [transactions, typeFilter, statusFilter]);

    // Separate pending and resolved transactions
    const pendingTransactions = useMemo(() => {
        return filteredTransactions.filter((t) => t.status === "Pendiente");
    }, [filteredTransactions]);

    const resolvedTransactions = useMemo(() => {
        return filteredTransactions.filter((t) => t.status === "Pagado");
    }, [filteredTransactions]);

    // Prepare chart data
    const chartData = useMemo(() => {
        if (!summary) return [];
        return summary.monthlyData.map((item) => ({
            month: item.month,
            Ingresos: item.income,
            Gastos: item.expenses,
        }));
    }, [summary]);

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold">Finanzas</h1>
                    <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                        Centro de Control Financiero
                    </p>
                </div>
                <div className="flex gap-2">
                    <Sheet open={recurringSheetOpen} onOpenChange={setRecurringSheetOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                className="rounded-sm h-11"
                            >
                                <Settings2 className="size-4 mr-2" />
                                Gestionar Recurrentes
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[500px] overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle className="font-display text-xl">Plantillas Recurrentes</SheetTitle>
                                <SheetDescription className="font-mono text-xs uppercase tracking-wider">
                                    Gestionar ingresos y gastos automatizados
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-6 space-y-4">
                                {recurringLoading ? (
                                    <p className="text-sm text-muted-foreground">Cargando...</p>
                                ) : recurringTemplates.length === 0 ? (
                                    <div className="text-center py-8">
                                        <RefreshCw className="size-8 mx-auto mb-3 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">No hay plantillas recurrentes</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Crea una transacción recurrente para verla aquí
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {recurringTemplates.map((template) => (
                                            <div
                                                key={template.id}
                                                className="p-4 border border-border rounded-sm bg-card hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold text-sm">{template.name}</p>
                                                        <p className="text-xs text-muted-foreground">{template.category}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-bold ${template.type === 'Ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                                                            {formatCurrency(parseFloat(template.amount))}
                                                        </p>
                                                        <Badge variant="outline" className="text-xs">
                                                            {template.frequency === 'monthly' ? 'Mensual' : 'Anual'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground mb-3">
                                                    Día de ejecución: {template.dayOfMonth || 'N/A'}
                                                    {template.nextExecutionDate && (
                                                        <span className="ml-2">
                                                            • Próximo: {format(new Date(template.nextExecutionDate), 'dd/MM/yyyy')}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Paid Status Indicator */}
                                                {isPaidThisMonth(template) && (
                                                    <div className="flex items-center justify-between p-2 mb-3 bg-green-500/10 border border-green-500/30 rounded-sm">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="size-4 text-green-500" />
                                                            <span className="text-xs text-green-500 font-medium">
                                                                Pagado este mes ({template.lastExecutionDate && format(new Date(template.lastExecutionDate), 'dd/MM')})
                                                            </span>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 text-xs px-2 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                                                            onClick={() => unpayMutation.mutate(template.id)}
                                                            disabled={unpayMutation.isPending}
                                                        >
                                                            Marcar Pendiente
                                                        </Button>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 text-xs"
                                                        onClick={() => {
                                                            setEditingRecurring(template);
                                                            setEditRecurringDialogOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="size-3 mr-1" /> Editar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="flex-1 text-xs"
                                                        onClick={() => {
                                                            setEditingRecurring(template);
                                                            setDeleteRecurringDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="size-3 mr-1" /> Eliminar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="rounded-sm bg-primary hover:bg-primary/90 h-11"
                    >
                        <Plus className="size-4 mr-2" />
                        Nueva Transacción
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Ingresos - Green Accent */}
                <Card status="success" className="hover:shadow-md transition-shadow group relative overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                            Ingresos Totales
                            <TrendingUp className="size-4 text-green-500 opacity-70" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                                {summaryLoading ? "..." : formatCurrency(summary?.totalIncome || 0)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">Mes actual</p>
                    </CardContent>
                </Card>

                {/* Gastos - Red Accent */}
                <Card status="error" className="hover:shadow-md transition-shadow group relative overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                            Gastos Totales
                            <TrendingDown className="size-4 text-red-500 opacity-70" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                                {summaryLoading ? "..." : formatCurrency(summary?.totalExpenses || 0)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">Mes actual</p>
                    </CardContent>
                </Card>

                {/* Beneficio - Blue Accent */}
                <Card status="info" className="hover:shadow-md transition-shadow group relative overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                            Beneficio Neto
                            <DollarSign className="size-4 text-blue-500 opacity-70" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                                {summaryLoading ? "..." : formatCurrency(summary?.netProfit || 0)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">Ingresos - Gastos</p>
                    </CardContent>
                </Card>

                {/* Cash Flow - Warning Accent */}
                <Card status="warning" className="hover:shadow-md transition-shadow group relative overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                            Cash Flow
                            <div className="md:hidden size-2 rounded-full bg-orange-500 animate-pulse" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                                {summaryLoading ? "..." : formatCurrency(summary?.cashFlow || 0)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">Disponible</p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Obligations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cuentas por Pagar */}
                <Card className="border-border bg-card">
                    <CardHeader className="p-4 border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-sm bg-red-500/10">
                                <TrendingDown className="size-4 text-red-500" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-display">CUENTAS POR PAGAR</CardTitle>
                                <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                                    Pendientes del mes ({monthlyPayables.length})
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {payablesLoading ? (
                            <p className="text-sm text-muted-foreground">Cargando...</p>
                        ) : monthlyPayables.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay pagos pendientes</p>
                        ) : (
                            monthlyPayables.map((obligation) => (
                                <div key={obligation.id} className="group flex items-center justify-between p-3 bg-secondary/20 hover:bg-secondary/40 relative overflow-hidden transition-colors rounded-sm">
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-red-500 to-transparent opacity-70" />
                                    <div className="pl-2">
                                        <p className="font-medium text-sm text-foreground">{obligation.name}</p>
                                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{obligation.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-red-500 font-mono mb-1">
                                            {formatCurrency(parseFloat(obligation.amount))}
                                        </p>
                                        <Button
                                            onClick={() => markAsPaidMutation.mutate({ id: obligation.id })}
                                            disabled={markAsPaidMutation.isPending}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] uppercase tracking-wider hover:bg-red-500/10 hover:text-red-500"
                                        >
                                            Marcar Pagado
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Cuentas por Cobrar */}
                <Card className="border-border bg-card">
                    <CardHeader className="p-4 border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-sm bg-green-500/10">
                                <TrendingUp className="size-4 text-green-500" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-display">CUENTAS POR COBRAR</CardTitle>
                                <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                                    Pendientes del mes ({monthlyReceivables.length})
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {receivablesLoading ? (
                            <p className="text-sm text-muted-foreground">Cargando...</p>
                        ) : monthlyReceivables.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay cobros pendientes</p>
                        ) : (
                            monthlyReceivables.map((obligation) => (
                                <div key={obligation.id} className="group flex items-center justify-between p-3 bg-secondary/20 hover:bg-secondary/40 relative overflow-hidden transition-colors rounded-sm">
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-green-500 to-transparent opacity-70" />
                                    <div className="pl-2">
                                        <p className="font-medium text-sm text-foreground">{obligation.name}</p>
                                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{obligation.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-500 font-mono mb-1">
                                            {formatCurrency(parseFloat(obligation.amount))}
                                        </p>
                                        <Button
                                            onClick={() => markAsPaidMutation.mutate({ id: obligation.id })}
                                            disabled={markAsPaidMutation.isPending}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] uppercase tracking-wider hover:bg-green-500/10 hover:text-green-500"
                                        >
                                            Marcar Cobrado
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Section - Dual Table Layout (moved above chart) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Pending Transactions (main table - 2/3 width on desktop) */}
                <Card className="border-border bg-card/50 rounded-sm xl:col-span-2">
                    <CardHeader className="p-4">
                        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                            <div>
                                <CardTitle className="text-base sm:text-lg font-display">Transacciones Pendientes</CardTitle>
                                <CardDescription className="font-mono text-xs uppercase tracking-wider">
                                    Marca para resolver ✓
                                </CardDescription>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="flex-1 sm:w-[120px] h-11 text-xs rounded-sm border-border">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="Ingreso">Ingresos</SelectItem>
                                        <SelectItem value="Gasto">Gastos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {transactionsLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Cargando transacciones...</div>
                        ) : pendingTransactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle2 className="size-8 mx-auto mb-2 opacity-50" />
                                <p>No hay transacciones pendientes</p>
                                <p className="text-xs mt-2">Todas las transacciones han sido resueltas</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">✓</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingTransactions.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={false}
                                                        onCheckedChange={() => handleToggleTransactionStatus(transaction)}
                                                        className="border-yellow-500"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {format(new Date(transaction.date), "dd/MM/yyyy")}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`rounded-sm ${transaction.type === "Ingreso"
                                                            ? "border-green-500/30 bg-green-500/10 text-green-500"
                                                            : "border-red-500/30 bg-red-500/10 text-red-500"
                                                            }`}
                                                    >
                                                        {transaction.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{transaction.category}</TableCell>
                                                <TableCell className={`text-right font-mono font-semibold ${transaction.type === "Ingreso" ? "text-green-500" : "text-red-500"
                                                    }`}>
                                                    {formatCurrency(parseFloat(transaction.amount || "0"))}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => openEditDialog(transaction)}
                                                        >
                                                            <Edit className="size-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                                            onClick={() => openDeleteDialog(transaction)}
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Resolved Transactions (sidebar - 1/3 width on desktop) */}
                <Card className="border-border bg-card/50 rounded-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-transparent via-green-500 to-transparent opacity-50" />
                    <CardHeader className="p-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-5 text-green-500" />
                            <div>
                                <CardTitle className="text-base font-display">Transacciones Resueltas</CardTitle>
                                <CardDescription className="font-mono text-xs uppercase tracking-wider">
                                    {resolvedTransactions.length} pagados/cobrados
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 max-h-[400px] overflow-y-auto">
                        {resolvedTransactions.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <p className="text-sm">No hay transacciones resueltas</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {resolvedTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center gap-3 p-3 rounded-sm bg-green-500/5 hover:bg-green-500/10 transition-colors relative overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-green-500 to-transparent opacity-50" />
                                        <Checkbox
                                            checked={true}
                                            onCheckedChange={() => handleToggleTransactionStatus(transaction)}
                                            className="border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 ml-2"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{transaction.category}</p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {format(new Date(transaction.date), "dd/MM/yyyy")}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-mono font-semibold ${transaction.type === "Ingreso" ? "text-green-500" : "text-red-500"}`}>
                                                {formatCurrency(parseFloat(transaction.amount || "0"))}
                                            </p>
                                            <Badge variant="outline" className="text-[10px] rounded-sm border-green-500/30 bg-green-500/10 text-green-500">
                                                {transaction.type === "Ingreso" ? "Cobrado" : "Pagado"}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Chart - Now below transactions */}
            <Card className="border-border bg-card/50 rounded-sm">
                <CardHeader className="p-4">
                    <CardTitle className="text-base sm:text-lg font-display">
                        Ingresos vs Gastos (Últimos 6 Meses)
                    </CardTitle>
                    <CardDescription className="font-mono text-xs uppercase tracking-wider">
                        Análisis histórico
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="h-[300px] sm:h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                <XAxis
                                    dataKey="month"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '2px',
                                    }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend />
                                <Bar dataKey="Ingresos" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Gastos" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>


            {/* Create Transaction Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="bg-card border-border sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-display text-lg sm:text-xl">Nueva Transacción</DialogTitle>
                        <DialogDescription className="font-mono text-xs uppercase tracking-wider">
                            Registrar ingreso o gasto
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Tipo de Transacción</Label>
                            <Select
                                value={newTransaction.type}
                                onValueChange={(val) => setNewTransaction({ ...newTransaction, type: val, category: "" })}
                            >
                                <SelectTrigger className="rounded-sm border-border bg-background h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ingreso">Ingreso</SelectItem>
                                    <SelectItem value="Gasto">Gasto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Categoría</Label>
                            <Select
                                value={newTransaction.category}
                                onValueChange={(val) => setNewTransaction({ ...newTransaction, category: val })}
                            >
                                <SelectTrigger className="rounded-sm border-border bg-background h-11">
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(newTransaction.type === "Ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Monto</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={newTransaction.amount}
                                    onFocus={(e) => {
                                        // Auto-clear '0' when user focuses
                                        if (e.target.value === '0') {
                                            setNewTransaction({ ...newTransaction, amount: '' });
                                        }
                                    }}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                    className="rounded-sm border-border bg-background h-11 pl-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Fecha</Label>
                            <Input
                                type="date"
                                value={newTransaction.date ? format(new Date(newTransaction.date), "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                    const dateValue = e.target.value;
                                    if (dateValue) {
                                        const newDate = new Date(dateValue + 'T12:00:00');
                                        if (!isNaN(newDate.getTime())) {
                                            setNewTransaction({ ...newTransaction, date: newDate });
                                        }
                                    }
                                }}
                                className="rounded-sm border-border bg-background h-11 cursor-pointer"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isPaid-create"
                                    checked={newTransaction.isPaid || false}
                                    onCheckedChange={(checked) => {
                                        const isPaid = !!checked;
                                        setNewTransaction({
                                            ...newTransaction,
                                            isPaid,
                                            paidDate: isPaid ? (newTransaction.paidDate || new Date()) : undefined,
                                        });
                                    }}
                                />
                                <Label htmlFor="isPaid-create" className="text-sm font-medium cursor-pointer">
                                    ✓ Marcar como {newTransaction.type === "Ingreso" ? "Cobrado" : "Pagado"}
                                </Label>
                            </div>
                        </div>

                        {newTransaction.isPaid && (
                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase">
                                    Fecha de {newTransaction.type === "Ingreso" ? "Cobro" : "Pago"}
                                </Label>
                                <Input
                                    type="date"
                                    value={newTransaction.paidDate
                                        ? format(new Date(newTransaction.paidDate), "yyyy-MM-dd")
                                        : ""
                                    }
                                    onChange={(e) => {
                                        const dateValue = e.target.value;
                                        if (dateValue) {
                                            const newDate = new Date(dateValue + 'T12:00:00');
                                            if (!isNaN(newDate.getTime())) {
                                                setNewTransaction({ ...newTransaction, paidDate: newDate });
                                            }
                                        }
                                    }}
                                    className="rounded-sm border-border bg-background h-11 cursor-pointer"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Descripción (Opcional)</Label>
                            <Textarea
                                placeholder="Descripción de la transacción"
                                value={newTransaction.description || ""}
                                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                className="rounded-sm border-border bg-background min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Cliente Relacionado</Label>
                            <ClientSelector
                                value={newTransaction.clientId}
                                onChange={(clientId) => setNewTransaction({ ...newTransaction, clientId })}
                            />
                        </div>

                        {/* Recurrence Toggle Section */}
                        <div className="p-4 border border-border rounded-sm bg-accent/30 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                        <RefreshCw className="size-4" />
                                        ¿Es Recurrente?
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Se repetirá automáticamente cada mes
                                    </p>
                                </div>
                                <Switch
                                    checked={isRecurring}
                                    onCheckedChange={setIsRecurring}
                                />
                            </div>

                            {isRecurring && (
                                <div className="space-y-4 pt-3 border-t border-border">
                                    {/* Template Name */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-mono uppercase">
                                            Nombre del Recurrente *
                                        </Label>
                                        <Input
                                            placeholder="Ej: Iguala Cliente A, Renta Oficina"
                                            value={recurringConfig.name}
                                            onChange={(e) => setRecurringConfig({ ...recurringConfig, name: e.target.value })}
                                            className="rounded-sm border-border bg-background h-11"
                                        />
                                    </div>

                                    {/* Frequency */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-mono uppercase">Frecuencia</Label>
                                        <Select
                                            value={recurringConfig.frequency}
                                            onValueChange={(val) => setRecurringConfig({ ...recurringConfig, frequency: val as "monthly" | "yearly" })}
                                        >
                                            <SelectTrigger className="rounded-sm border-border bg-background h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">Mensual</SelectItem>
                                                <SelectItem value="yearly">Anual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Day of Month */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-mono uppercase">Día de Cobro/Pago</Label>
                                        <Select
                                            value={recurringConfig.dayOfMonth.toString()}
                                            onValueChange={(val) => setRecurringConfig({ ...recurringConfig, dayOfMonth: parseInt(val) })}
                                        >
                                            <SelectTrigger className="rounded-sm border-border bg-background h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                                                    <SelectItem key={day} value={day.toString()}>
                                                        Día {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-sm h-11">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateTransaction}
                            className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? "Guardando..." : "Crear Transacción"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Transaction Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="bg-card border-border sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-display text-xl">Editar Transacción</DialogTitle>
                        <DialogDescription className="font-mono text-xs uppercase tracking-wider">
                            Modificar datos de la transacción
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Tipo</Label>
                            <Select
                                value={editTransaction.type}
                                onValueChange={(val) => setEditTransaction({ ...editTransaction, type: val })}
                            >
                                <SelectTrigger className="rounded-sm border-border bg-background h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ingreso">Ingreso</SelectItem>
                                    <SelectItem value="Gasto">Gasto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Categoría</Label>
                            <Select
                                value={editTransaction.category}
                                onValueChange={(val) => setEditTransaction({ ...editTransaction, category: val })}
                            >
                                <SelectTrigger className="rounded-sm border-border bg-background h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(editTransaction.type === "Ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Monto</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editTransaction.amount || ""}
                                    onFocus={(e) => {
                                        // Auto-clear '0' when user focuses
                                        if (e.target.value === '0') {
                                            setEditTransaction({ ...editTransaction, amount: '' });
                                        }
                                    }}
                                    onChange={(e) => setEditTransaction({ ...editTransaction, amount: e.target.value })}
                                    className="rounded-sm border-border bg-background h-11 pl-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Fecha</Label>
                            <Input
                                type="date"
                                value={
                                    editTransaction.date
                                        ? format(new Date(editTransaction.date), "yyyy-MM-dd")
                                        : ""
                                }
                                onChange={(e) => {
                                    const dateValue = e.target.value;
                                    if (dateValue) {
                                        const newDate = new Date(dateValue + 'T12:00:00');
                                        if (!isNaN(newDate.getTime())) {
                                            setEditTransaction({ ...editTransaction, date: newDate });
                                        }
                                    }
                                }}
                                className="rounded-sm border-border bg-background h-11 cursor-pointer"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isPaid-edit"
                                    checked={editTransaction.isPaid || false}
                                    onCheckedChange={(checked) => {
                                        const isPaid = !!checked;
                                        setEditTransaction({
                                            ...editTransaction,
                                            isPaid,
                                            paidDate: isPaid ? (editTransaction.paidDate || new Date()) : undefined,
                                        });
                                    }}
                                />
                                <Label htmlFor="isPaid-edit" className="text-sm font-medium cursor-pointer">
                                    ✓ Marcar como {editTransaction.type === "Ingreso" ? "Cobrado" : "Pagado"}
                                </Label>
                            </div>
                        </div>

                        {editTransaction.isPaid && (
                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase">
                                    Fecha de {editTransaction.type === "Ingreso" ? "Cobro" : "Pago"}
                                </Label>
                                <Input
                                    type="date"
                                    value={editTransaction.paidDate
                                        ? format(new Date(editTransaction.paidDate), "yyyy-MM-dd")
                                        : ""
                                    }
                                    onChange={(e) => {
                                        const dateValue = e.target.value;
                                        if (dateValue) {
                                            const newDate = new Date(dateValue + 'T12:00:00');
                                            if (!isNaN(newDate.getTime())) {
                                                setEditTransaction({ ...editTransaction, paidDate: newDate });
                                            }
                                        }
                                    }}
                                    className="rounded-sm border-border bg-background h-11 cursor-pointer"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Descripción</Label>
                            <Textarea
                                value={editTransaction.description || ""}
                                onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })}
                                className="rounded-sm border-border bg-background min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-mono uppercase">Cliente Relacionado</Label>
                            <ClientSelector
                                value={editTransaction.clientId}
                                onChange={(clientId) => setEditTransaction({ ...editTransaction, clientId })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-sm h-11">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleEditTransaction}
                            className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">¿Eliminar Transacción?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La transacción será eliminada permanentemente del sistema.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-sm h-11">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteTransaction}
                            className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Recurring Template Dialog */}
            <Dialog open={editRecurringDialogOpen} onOpenChange={setEditRecurringDialogOpen}>
                <DialogContent className="bg-card border-border sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="font-display text-xl">Editar Recurrente</DialogTitle>
                        <DialogDescription className="font-mono text-xs uppercase tracking-wider">
                            Modificar plantilla recurrente
                        </DialogDescription>
                    </DialogHeader>
                    {editingRecurring && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase">Nombre</Label>
                                <Input
                                    value={editingRecurring.name}
                                    onChange={(e) => setEditingRecurring({ ...editingRecurring, name: e.target.value })}
                                    className="rounded-sm border-border bg-background h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase">Monto</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editingRecurring.amount}
                                        onChange={(e) => setEditingRecurring({ ...editingRecurring, amount: e.target.value })}
                                        className="rounded-sm border-border bg-background h-11 pl-8"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase">Día de Ejecución</Label>
                                <Select
                                    value={(editingRecurring.dayOfMonth || 1).toString()}
                                    onValueChange={(val) => setEditingRecurring({ ...editingRecurring, dayOfMonth: parseInt(val) })}
                                >
                                    <SelectTrigger className="rounded-sm border-border bg-background h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                                            <SelectItem key={day} value={day.toString()}>
                                                Día {day}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={editingRecurring.isActive}
                                    onCheckedChange={(checked) => setEditingRecurring({ ...editingRecurring, isActive: checked })}
                                />
                                <Label className="text-sm">Activo</Label>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditRecurringDialogOpen(false)} className="rounded-sm h-11">
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                if (editingRecurring) {
                                    updateRecurringMutation.mutate({
                                        id: editingRecurring.id,
                                        data: {
                                            name: editingRecurring.name,
                                            amount: editingRecurring.amount,
                                            dayOfMonth: editingRecurring.dayOfMonth,
                                            isActive: editingRecurring.isActive,
                                        },
                                    });
                                }
                            }}
                            className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                            disabled={updateRecurringMutation.isPending}
                        >
                            {updateRecurringMutation.isPending ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Recurring Confirmation Dialog */}
            <AlertDialog open={deleteRecurringDialogOpen} onOpenChange={setDeleteRecurringDialogOpen}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">¿Eliminar Plantilla Recurrente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {editingRecurring && (
                                <>
                                    Estás a punto de eliminar <strong>{editingRecurring.name}</strong>.
                                    Esta acción no se puede deshacer y no generará más transacciones automáticas.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-sm h-11">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (editingRecurring) {
                                    deleteRecurringMutation.mutate(editingRecurring.id);
                                }
                            }}
                            className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
