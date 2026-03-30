/**
 * Payment Calendar - Calendario de Pagos
 * Part of Cohete Brands Replica - Financial Module
 * Shows project payments and maintenance fees in a calendar grid
 */

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
    ArrowLeft,
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
import { fetchProjects, updateProject, type Project } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

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

    const markAsPaidMutation = useMutation({
        mutationFn: async (payment: CalendarPayment) => {
            if (payment.type === "project") {
                return updateProject(payment.projectId, { progress: 100 });
            }
            throw new Error("El mantenimiento mensual se gestiona desde el módulo de Finanzas.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast({ title: "Pago registrado", description: "El proyecto fue marcado como completado/pagado." });
            setSelectedPayment(null);
        },
        onError: (error: any) => {
            toast({ title: "Aviso", description: error.message || "No se pudo registrar el pago.", variant: "destructive" });
        },
    });

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
    <div className="min-h-screen bg-[#030303] text-zinc-100 p-3 sm:p-8 font-sans selection:bg-primary/30">
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Intel Header & Financial Control */}
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
                  <DollarSign className="size-5" />
                </div>
                <h1 className="text-4xl font-display italic tracking-tight text-white">Payment Intelligence</h1>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.4em] pl-1 opacity-60">Financial Node Lifecycle Monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-6 py-3 bg-zinc-950/40 border border-white/10 rounded-2xl backdrop-blur-md">
            <div className={`size-2 rounded-full ${monthSummary.pending > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">Yield Progress: </span>
            <span className="text-[10px] font-mono font-bold text-white">{Math.round(monthSummary.progress)}%</span>
          </div>
        </div>

            {/* Month Navigation & Summary */}
        {/* Month Navigation & Strategic Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Chronological Controller */}
          <Card className="lg:col-span-2 bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)} className="size-12 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                  <ChevronLeft className="size-6 text-zinc-400" />
                </Button>
                <div className="text-center space-y-1">
                  <p className="text-3xl font-display italic font-bold tracking-tight text-white uppercase">{monthNames[currentDate.getMonth()]}</p>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] opacity-60">{currentDate.getFullYear()}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)} className="size-12 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                  <ChevronRight className="size-6 text-zinc-400" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metric Nodes */}
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] group overflow-hidden">
            <CardContent className="p-8 h-full flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Total Liquidity</p>
                <DollarSign className="size-4 text-zinc-600 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-2xl font-display font-medium text-white tracking-widest">{formatCurrency(monthSummary.total)}</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] group overflow-hidden">
            <CardContent className="p-8 h-full flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Confirmed Output</p>
                <Check className="size-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-2xl font-display font-medium text-emerald-400 tracking-widest">{formatCurrency(monthSummary.received)}</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] group overflow-hidden shadow-[inset_0_0_20px_rgba(245,158,11,0.02)]">
            <CardContent className="p-8 h-full flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Pending Flux</p>
                <Clock className="size-4 text-zinc-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-2xl font-display font-medium text-amber-400 tracking-widest">{formatCurrency(monthSummary.pending)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Lifecycle Matrix (Calendar Grid) */}
        <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8">
            {/* Day Headers - Technical Labelling */}
            <div className="grid grid-cols-7 gap-4 mb-6">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <div key={day} className="text-center text-[9px] font-mono font-bold text-zinc-600 tracking-[0.3em] py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days - High-Tech Grid */}
            <div className="grid grid-cols-7 gap-4">
              {calendarDays.map((dayData, index) => {
                const isToday = dayData.day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={index}
                    className={`min-h-[140px] p-4 rounded-3xl border transition-all duration-300 relative group/day ${dayData.day
                      ? "bg-white/[0.02] hover:bg-white/[0.05] border-white/5 cursor-pointer"
                      : "bg-transparent border-transparent"
                      } ${isToday ? "ring-1 ring-primary border-primary/40 bg-primary/[0.03]" : ""}`}
                  >
                    {dayData.day && (
                      <>
                        <div className={`text-xs font-mono font-bold mb-3 ${isToday ? 'text-primary' : 'text-zinc-500 group-hover/day:text-zinc-300'} transition-colors`}>
                          {dayData.day.toString().padStart(2, '0')}
                        </div>
                        <div className="space-y-2">
                          {dayData.payments.slice(0, 3).map((payment) => {
                            const isMaintenance = payment.type === "maintenance";
                            const isOverdue = payment.status === "overdue";
                            
                            return (
                              <div
                                key={payment.id}
                                onClick={() => setSelectedPayment(payment)}
                                className={`text-[9px] font-mono px-3 py-1.5 rounded-full truncate transition-all border ${
                                  isOverdue 
                                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                                    : isMaintenance 
                                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                } hover:scale-[1.05] active:scale-[0.95]`}
                              >
                                {formatCurrency(payment.amount)}
                              </div>
                            );
                          })}
                          {dayData.payments.length > 3 && (
                            <div className="text-[8px] font-mono text-zinc-600 pl-2">
                              + {dayData.payments.length - 3} NODES
                            </div>
                          )}
                        </div>
                        {isToday && (
                          <div className="absolute top-3 right-3 size-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Operational Ledger (List View) */}
        <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="text-xl font-display italic text-white tracking-tight">Active Operations Ledger</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {monthPayments.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <div className="size-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-700">
                    <CalendarIcon className="size-8" />
                  </div>
                  <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">No transaction cycles active for current chronological frame</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monthPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="group bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 flex items-center justify-between cursor-pointer"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`size-12 rounded-2xl flex items-center justify-center border shadow-inner transition-colors duration-500 ${
                          payment.type === "maintenance" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        }`}>
                          {payment.type === "maintenance" ? (
                            <CalendarIcon className="size-5" />
                          ) : (
                            <Building2 className="size-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-display font-medium text-white tracking-tight group-hover:text-primary transition-colors">{payment.projectName}</p>
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{payment.clientName}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-display font-bold text-white tracking-tight">{formatCurrency(payment.amount)}</p>
                        <Badge 
                          className={`rounded-full px-3 py-0.5 text-[8px] font-mono uppercase tracking-[0.1em] border-none ${
                            payment.status === 'paid' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : payment.status === 'overdue' 
                                ? 'bg-rose-500/20 text-rose-400 animate-pulse' 
                                : 'bg-white/10 text-zinc-400'
                          }`}
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Payment Detail Dialog - Redesigned as Intel Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-lg">
          <DialogHeader className="pb-6 border-b border-white/5">
            <DialogTitle className="text-2xl font-display italic text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-white/10 text-primary">
                <DollarSign className="size-5" />
              </div>
              Transaction Detail
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-8 pt-8">
              <div className="flex items-center gap-6">
                <div className={`size-16 rounded-[1.5rem] flex items-center justify-center border shadow-inner transition-colors duration-500 ${
                  selectedPayment.type === "maintenance" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}>
                  {selectedPayment.type === "maintenance" ? (
                    <CalendarIcon className="size-8" />
                  ) : (
                    <Building2 className="size-8" />
                  )}
                </div>
                <div>
                  <p className="text-xl font-display font-medium text-white tracking-tight">{selectedPayment.projectName}</p>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] font-bold">{selectedPayment.clientName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 space-y-2">
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest leading-none">Payload Value</p>
                  <p className="text-2xl font-display font-bold text-white tracking-widest">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div className="p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 space-y-2">
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest leading-none">Node Maturity</p>
                  <p className="text-base font-mono font-bold text-zinc-300">{selectedPayment.dueDate.toLocaleDateString("es-MX")}</p>
                </div>
              </div>

              <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest leading-none">Classification</p>
                  <p className="text-xs font-mono text-zinc-400">
                    {selectedPayment.type === "maintenance" ? "Monthly Infrastructure Ops" : "Core Project Deployment"}
                  </p>
                </div>
                <Badge className={`rounded-full px-4 py-1 text-[9px] font-mono uppercase tracking-[0.2em] border-none ${
                    selectedPayment.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                    {selectedPayment.status}
                </Badge>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  className={`flex-1 h-14 rounded-2xl font-mono text-[10px] uppercase tracking-widest font-bold transition-all ${
                    selectedPayment.status === "paid" 
                      ? "bg-white/5 text-zinc-500 border border-white/10" 
                      : "bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.2)]"
                  }`}
                  disabled={selectedPayment.status === "paid" || markAsPaidMutation.isPending}
                  onClick={() => selectedPayment && markAsPaidMutation.mutate(selectedPayment)}
                >
                  <Check className="size-4 mr-2" />
                  {markAsPaidMutation.isPending ? "Procesando..." : selectedPayment.status === "paid" ? "Transaction Confirmed" : "Finalize Settlement"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPayment(null)}
                  className="h-14 px-8 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 font-mono text-[10px] uppercase tracking-widest"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
