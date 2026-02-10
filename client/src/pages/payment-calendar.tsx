/**
 * Payment Calendar - Calendario de Pagos
 * Part of Cohete Brands Replica - Financial Module
 * Shows project payments and maintenance fees in a calendar grid
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Calendar as CalendarIcon,
    Check,
    Clock,
    AlertCircle,
    Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { fetchProjects, type Project } from "@/lib/api";

// Installment type for payment schedule
interface CalendarPayment {
    id: number;
    projectId: number;
    projectName: string;
    clientName: string;
    amount: number;
    dueDate: Date;
    type: "project" | "maintenance";
    status: "pending" | "paid" | "overdue";
}

export default function PaymentCalendar() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedPayment, setSelectedPayment] = useState<CalendarPayment | null>(null);

    // Fetch projects to build payment calendar
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: fetchProjects,
    });

    // Generate calendar payments from projects
    const calendarPayments = useMemo(() => {
        const payments: CalendarPayment[] = [];
        const today = new Date();

        projects.forEach((project) => {
            // Project payments from quotation
            if (project.quotationAmount && Number(project.quotationAmount) > 0) {
                const startDate = project.startDate ? new Date(project.startDate) : new Date(project.createdAt);
                const isPaid = project.progress === 100;
                payments.push({
                    id: project.id * 1000,
                    projectId: project.id,
                    projectName: project.name,
                    clientName: project.client?.companyName || "Cliente",
                    amount: Number(project.quotationAmount),
                    dueDate: startDate,
                    type: "project",
                    status: isPaid ? "paid" : startDate < today ? "overdue" : "pending",
                });
            }

            // Monthly maintenance payments
            if (project.monthlyMaintenance && Number(project.monthlyMaintenance) > 0) {
                const month = currentDate.getMonth();
                const year = currentDate.getFullYear();
                const billingDay = project.billingDay || 1;
                const maintenanceDate = new Date(year, month, billingDay);

                payments.push({
                    id: project.id * 1000 + month + 1,
                    projectId: project.id,
                    projectName: project.name,
                    clientName: project.client?.companyName || "Cliente",
                    amount: Number(project.monthlyMaintenance),
                    dueDate: maintenanceDate,
                    type: "maintenance",
                    status: maintenanceDate < today ? "overdue" : "pending",
                });
            }
        });

        return payments;
    }, [projects, currentDate]);

    // Filter payments for current month
    const monthPayments = useMemo(() => {
        return calendarPayments.filter((p) => {
            const paymentMonth = p.dueDate.getMonth();
            const paymentYear = p.dueDate.getFullYear();
            return paymentMonth === currentDate.getMonth() && paymentYear === currentDate.getFullYear();
        });
    }, [calendarPayments, currentDate]);

    // Calculate month summary
    const monthSummary = useMemo(() => {
        let total = 0;
        let received = 0;
        let pending = 0;

        monthPayments.forEach((p) => {
            total += p.amount;
            if (p.status === "paid") {
                received += p.amount;
            } else {
                pending += p.amount;
            }
        });

        return { total, received, pending, progress: total > 0 ? (received / total) * 100 : 0 };
    }, [monthPayments]);

    // Generate calendar grid
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay(); // 0 = Sunday
        const totalDays = lastDay.getDate();

        const days: Array<{ date: Date | null; day: number | null; payments: CalendarPayment[] }> = [];

        // Padding for start of month
        for (let i = 0; i < startPadding; i++) {
            days.push({ date: null, day: null, payments: [] });
        }

        // Actual days
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dayPayments = monthPayments.filter((p) => p.dueDate.getDate() === day);
            days.push({ date, day, payments: dayPayments });
        }

        return days;
    }, [currentDate, monthPayments]);

    const navigateMonth = (direction: number) => {
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
    };

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Calendario de Pagos</h1>
                    <p className="text-muted-foreground">Control de cobros y mantenimientos mensuales</p>
                </div>
            </div>

            {/* Month Navigation & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Month Navigator */}
                <Card className="lg:col-span-2">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{monthNames[currentDate.getMonth()]}</p>
                                <p className="text-muted-foreground">{currentDate.getFullYear()}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                                <DollarSign className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-bold">{formatCurrency(monthSummary.total)}</p>
                                <p className="text-xs text-muted-foreground">Total del Mes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-green-500/10">
                                <Check className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-lg font-bold">{formatCurrency(monthSummary.received)}</p>
                                <p className="text-xs text-muted-foreground">Recibido</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-yellow-500/10">
                                <Clock className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-lg font-bold">{formatCurrency(monthSummary.pending)}</p>
                                <p className="text-xs text-muted-foreground">Pendiente</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Grid */}
            <Card>
                <CardContent className="p-4">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((dayData, index) => (
                            <div
                                key={index}
                                className={`min-h-24 p-1 rounded-2xl border transition-colors ${dayData.day
                                    ? "bg-card hover:bg-accent/50 cursor-pointer"
                                    : "bg-muted/30"
                                    } ${dayData.day === new Date().getDate() &&
                                        currentDate.getMonth() === new Date().getMonth() &&
                                        currentDate.getFullYear() === new Date().getFullYear()
                                        ? "border-primary"
                                        : "border-border/50"
                                    }`}
                            >
                                {dayData.day && (
                                    <>
                                        <div className="text-xs font-medium mb-1">{dayData.day}</div>
                                        <div className="space-y-1">
                                            {dayData.payments.slice(0, 3).map((payment) => (
                                                <div
                                                    key={payment.id}
                                                    onClick={() => setSelectedPayment(payment)}
                                                    className={`text-[10px] p-1 rounded-full truncate cursor-pointer transition-colors ${payment.type === "maintenance"
                                                        ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                                        : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                        } ${payment.status === "overdue" ? "bg-red-500/20 text-red-400" : ""}`}
                                                >
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                            ))}
                                            {dayData.payments.length > 3 && (
                                                <div className="text-[10px] text-muted-foreground text-center">
                                                    +{dayData.payments.length - 3} más
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Payments List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Cobros del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {monthPayments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">Sin cobros programados este mes</p>
                        ) : (
                            monthPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedPayment(payment)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${payment.type === "maintenance" ? "bg-blue-500/10" : "bg-green-500/10"
                                            }`}>
                                            {payment.type === "maintenance" ? (
                                                <CalendarIcon className="w-4 h-4 text-blue-500" />
                                            ) : (
                                                <Building2 className="w-4 h-4 text-green-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{payment.projectName}</p>
                                            <p className="text-xs text-muted-foreground">{payment.clientName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(payment.amount)}</p>
                                        <Badge
                                            variant={payment.status === "paid" ? "default" : payment.status === "overdue" ? "destructive" : "secondary"}
                                            className="text-[10px]"
                                        >
                                            {payment.status === "paid" ? "Pagado" : payment.status === "overdue" ? "Vencido" : "Pendiente"}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Payment Detail Dialog */}
            <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalle del Cobro</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-full ${selectedPayment.type === "maintenance" ? "bg-blue-500/10" : "bg-green-500/10"
                                    }`}>
                                    {selectedPayment.type === "maintenance" ? (
                                        <CalendarIcon className="w-6 h-6 text-blue-500" />
                                    ) : (
                                        <Building2 className="w-6 h-6 text-green-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold">{selectedPayment.projectName}</p>
                                    <p className="text-sm text-muted-foreground">{selectedPayment.clientName}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-muted/50">
                                    <p className="text-xs text-muted-foreground">Monto</p>
                                    <p className="text-xl font-bold">{formatCurrency(selectedPayment.amount)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/50">
                                    <p className="text-xs text-muted-foreground">Fecha de Vencimiento</p>
                                    <p className="font-medium">{selectedPayment.dueDate.toLocaleDateString("es-MX")}</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-muted/50">
                                <p className="text-xs text-muted-foreground">Tipo</p>
                                <Badge variant={selectedPayment.type === "maintenance" ? "secondary" : "default"}>
                                    {selectedPayment.type === "maintenance" ? "Mantenimiento Mensual" : "Pago de Proyecto"}
                                </Badge>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    className="flex-1"
                                    variant={selectedPayment.status === "paid" ? "secondary" : "default"}
                                    disabled={selectedPayment.status === "paid"}
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    {selectedPayment.status === "paid" ? "Ya Cobrado" : "Marcar como Cobrado"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
