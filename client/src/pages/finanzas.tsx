import { useState, useMemo } from "react";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    RefreshCw,
    Settings2,
    CalendarClock,
    Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchTransactions,
    deleteTransaction,
    fetchFinancialSummary,
    fetchMonthlyPayables,
    fetchMonthlyReceivables,
    markObligationAsPaid,
    fetchRecurringTransactions,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    type FinancialSummary,
} from "@/lib/api";
import type { Transaction, RecurringTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format-currency";
import { TransactionForm } from "@/components/financial/transaction-form";
import { TransactionTable } from "@/components/financial/transaction-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSystemSettings } from "@/hooks/use-system-settings";

import { AutomationHub } from "@/components/financial/automation-hub";

export default function Finanzas() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: settings } = useSystemSettings();
    const [selectedTab, setSelectedTab] = useState("ingresos");

    // Dialog States
    const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [transactionType, setTransactionType] = useState<"Ingreso" | "Gasto">("Ingreso");

    const [deleteTransactionId, setDeleteTransactionId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Filter States
    const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Queries
    const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
        queryKey: ["transactions"],
        queryFn: () => fetchTransactions(),
    });

    const { data: summary } = useQuery<FinancialSummary>({
        queryKey: ["financial-summary"],
        queryFn: () => fetchFinancialSummary(),
    });

    const { data: monthlyPayables = [] } = useQuery({
        queryKey: ["monthly-payables"],
        queryFn: () => fetchMonthlyPayables(),
    });

    const { data: monthlyReceivables = [] } = useQuery({
        queryKey: ["monthly-receivables"],
        queryFn: () => fetchMonthlyReceivables(),
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            toast({ title: "Transacción eliminada" });
            setIsDeleteDialogOpen(false);
        },
    });

    const markAsPaidMutation = useMutation({
        mutationFn: markObligationAsPaid,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            queryClient.invalidateQueries({ queryKey: ["monthly-payables"] });
            queryClient.invalidateQueries({ queryKey: ["monthly-receivables"] });
            toast({ title: "Obligación marcada como pagada/cobrada" });
        },
    });

    // Filtering Logic
    const filteredTransactions = useMemo(() => {
        let filtered = transactions;

        // Filter by Tab/Type
        if (selectedTab === "ingresos") {
            filtered = filtered.filter(t => t.type === "Ingreso");
        } else if (selectedTab === "egresos") {
            filtered = filtered.filter(t => t.type === "Gasto");
        }

        // Filter by Month (simple string match on ISO date)
        if (monthFilter) {
            filtered = filtered.filter(t => t.date.toString().startsWith(monthFilter));
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedTab, monthFilter]);

    // Derived Financials for Chart
    const chartData = useMemo(() => {
        if (!summary?.monthlyData) return [];
        return summary.monthlyData.slice(0, 6).reverse().map(stat => ({
            month: stat.month,
            Ingresos: Number(stat.income),
            Gastos: Number(stat.expenses),
        }));
    }, [summary]);

    // Handlers
    const handleOpenCreate = (type: "Ingreso" | "Gasto") => {
        setTransactionType(type);
        setEditingTransaction(null);
        setIsTransactionFormOpen(true);
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setTransactionType(transaction.type as "Ingreso" | "Gasto"); // Cast for safety
        setIsTransactionFormOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteTransactionId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deleteTransactionId) deleteMutation.mutate(deleteTransactionId);
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold tracking-tight text-white mb-1">
                        Centro Financiero
                    </h2>
                    <p className="text-zinc-400 font-mono text-sm leading-relaxed">
                        Sistema de control de flujos y obligaciones fiscales.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 w-[160px] font-mono text-xs"
                    />
                    <AutomationHub
                        trigger={
                            <Button variant="outline" size="icon" title="Automatizaciones">
                                <CalendarClock className="size-4" />
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-950/50 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-widest font-mono">
                            Ingresos Netos
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-white">
                            {formatCurrency(Number(summary?.totalIncome || 0))}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Facturado en el periodo total
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-950/50 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-widest font-mono">
                            Gastos Totales
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-white">
                            {formatCurrency(Number(summary?.totalExpenses || 0))}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Egreso operativo total
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-950/50 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-widest font-mono">
                            Balance Operativo
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold font-mono ${(summary?.netProfit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {formatCurrency(Number(summary?.netProfit || 0))}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Margen bruto antes de impuestos
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="ingresos" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                <TabsList className="bg-zinc-950 border border-zinc-800 p-1 w-full md:w-auto h-12">
                    <TabsTrigger value="ingresos" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 font-mono text-xs uppercase px-6 h-9">
                        Ingresos
                    </TabsTrigger>
                    <TabsTrigger value="egresos" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-rose-400 font-mono text-xs uppercase px-6 h-9">
                        Egresos
                    </TabsTrigger>
                    <TabsTrigger value="resumen" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-400 font-mono text-xs uppercase px-6 h-9">
                        Resumen & Reportes
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {/* INGRESOS TAB */}
                    <TabsContent value="ingresos" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-display text-white">Registro de Ingresos</h3>
                            <Button
                                onClick={() => handleOpenCreate("Ingreso")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Agregar Ingreso
                            </Button>
                        </div>

                        {/* Monthly Receivables (Cuentas por Cobrar) */}
                        {monthlyReceivables.length > 0 && (
                            <Card className="border-l-4 border-l-emerald-500 bg-zinc-900/40 border-y-zinc-800 border-r-zinc-800">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <CalendarClock className="h-4 w-4 text-emerald-500" />
                                        <CardTitle className="text-sm">Por Cobrar este Mes</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {monthlyReceivables.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-2 bg-zinc-950 border border-zinc-800 rounded-sm">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm text-zinc-200">{item.name}</span>
                                                <span className="text-[10px] text-zinc-500 uppercase">{item.category}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono font-bold text-emerald-400">{formatCurrency(Number(item.amount))}</span>
                                                <Button
                                                    size="sm" variant="ghost"
                                                    className="text-[10px] h-6 hover:bg-emerald-500/10 hover:text-emerald-400"
                                                    onClick={() => markAsPaidMutation.mutate(item.id)}
                                                    disabled={markAsPaidMutation.isPending}
                                                >
                                                    Marcar Cobrado
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <TransactionTable
                            data={filteredTransactions}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            showClient={true}
                        />
                    </TabsContent>

                    {/* EGRESOS TAB */}
                    <TabsContent value="egresos" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-display text-white">Registro de Egresos</h3>
                            <Button
                                onClick={() => handleOpenCreate("Gasto")}
                                className="bg-rose-600 hover:bg-rose-700 text-white border-none"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Registrar Gasto
                            </Button>
                        </div>

                        {/* Monthly Payables (Obligaciones) */}
                        {monthlyPayables.length > 0 && (
                            <Card className="border-l-4 border-l-rose-500 bg-zinc-900/40 border-y-zinc-800 border-r-zinc-800">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <CalendarClock className="h-4 w-4 text-rose-500" />
                                        <CardTitle className="text-sm">Obligaciones del Mes</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {monthlyPayables.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-2 bg-zinc-950 border border-zinc-800 rounded-sm">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm text-zinc-200">{item.name}</span>
                                                <span className="text-[10px] text-zinc-500 uppercase">{item.category}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono font-bold text-rose-400">{formatCurrency(Number(item.amount))}</span>
                                                <Button
                                                    size="sm" variant="ghost"
                                                    className="text-[10px] h-6 hover:bg-rose-500/10 hover:text-rose-400"
                                                    onClick={() => markAsPaidMutation.mutate(item.id)}
                                                    disabled={markAsPaidMutation.isPending}
                                                >
                                                    Marcar Pagado
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <TransactionTable
                            data={filteredTransactions}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            showProvider={true}
                        />
                    </TabsContent>

                    {/* RESUMEN TAB */}
                    <TabsContent value="resumen" className="space-y-6">
                        <Card className="bg-zinc-950 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-mono uppercase tracking-wider text-zinc-300">Flujo Anual</CardTitle>
                                <CardDescription>Comparativa de Ingresos vs Gastos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
                                            <XAxis
                                                dataKey="month"
                                                stroke="#71717a"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fill: '#71717a' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="#71717a"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                                tick={{ fill: '#71717a' }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{
                                                    backgroundColor: '#09090b',
                                                    borderColor: '#27272a',
                                                    borderRadius: '4px',
                                                    color: '#fff'
                                                }}
                                                formatter={(value: number) => [formatCurrency(value), ""]}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar dataKey="Ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} isAnimationActive={settings?.chartAnimations ?? true} />
                                            <Bar dataKey="Gastos" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} isAnimationActive={settings?.chartAnimations ?? true} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Dialogs */}
            <TransactionForm
                open={isTransactionFormOpen}
                onOpenChange={setIsTransactionFormOpen}
                initialData={editingTransaction}
                defaultType={transactionType}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-zinc-800 bg-transparent hover:bg-zinc-900">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Manage Recurring Dialog */}



        </div>
    );
}
