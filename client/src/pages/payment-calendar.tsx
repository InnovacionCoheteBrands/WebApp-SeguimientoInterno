/**
 * Payment Calendar - Calendario de Pagos
 * Financial Node Lifecycle Monitoring
 *
 * Data-driven view backed by the /api/finance/payment-calendar endpoint.
 * All aggregation and reconciliation is delegated to the backend; this
 * component only maps the normalized payload to UI primitives.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
    AlertCircle,
    ArrowLeft,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Check,
    Clock,
    DollarSign,
    Lock,
    RefreshCw,
    Wrench,
    Building2,
    Repeat,
    StickyNote,
    TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { fetchPaymentCalendar } from "@/lib/api";
import type {
    FinancialCalendarEvent,
    FinancialCalendarMonthlyTotals,
} from "@shared/schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Window of months fetched around the visible month (past + future). */
const PREFETCH_MONTHS_RADIUS = 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dayOfEvent(event: FinancialCalendarEvent): number {
    return new Date(event.scheduledDate).getDate();
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ---------------------------------------------------------------------------
// Sub-components: icons & badges per sourceType / status / direction
// ---------------------------------------------------------------------------

function SourceIcon({ sourceType, className }: { sourceType: FinancialCalendarEvent["sourceType"]; className?: string }) {
    const props = { className: `size-5 ${className ?? ""}` };
    switch (sourceType) {
        case "segmentacion": return <StickyNote {...props} />;
        case "cotizacion_proyecto": return <Building2 {...props} />;
        case "mantenimiento": return <Wrench {...props} />;
        case "obligacion_recurrente": return <Repeat {...props} />;
        case "transaccion_manual": return <DollarSign {...props} />;
        case "transaccion_independiente": return <TrendingUp {...props} />;
    }
}

function sourceLabel(sourceType: FinancialCalendarEvent["sourceType"]): string {
    const map: Record<FinancialCalendarEvent["sourceType"], string> = {
        segmentacion: "Segmentacion",
        cotizacion_proyecto: "Cotizacion",
        mantenimiento: "Mantenimiento",
        obligacion_recurrente: "Recurrente",
        transaccion_manual: "Manual",
        transaccion_independiente: "Independiente",
    };
    return map[sourceType];
}

function eventColorClasses(event: FinancialCalendarEvent): { bg: string; border: string; text: string } {
    if (event.status === "vencido") return { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400" };
    if (event.status === "pagado") return { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" };
    if (event.direction === "egreso") return { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" };
    return { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" };
}

function StatusBadge({ status }: { status: FinancialCalendarEvent["status"] }) {
    const classes: Record<FinancialCalendarEvent["status"], string> = {
        pagado: "bg-emerald-500/20 text-emerald-400",
        pendiente: "bg-white/10 text-zinc-400",
        vencido: "bg-rose-500/20 text-rose-400 animate-pulse",
    };
    const labels: Record<FinancialCalendarEvent["status"], string> = {
        pagado: "Pagado",
        pendiente: "Pendiente",
        vencido: "Vencido",
    };
    return (
        <Badge className={`rounded-full px-3 py-0.5 text-[8px] font-mono uppercase tracking-[0.1em] border-none ${classes[status]}`}>
            {labels[status]}
        </Badge>
    );
}

// ---------------------------------------------------------------------------
// Monthly totals card row
// ---------------------------------------------------------------------------

function TotalsCards({ totals }: { totals: FinancialCalendarMonthlyTotals | undefined }) {
    const scheduled = totals?.scheduledIncome ?? 0;
    const collected = totals?.collectedIncome ?? 0;
    const expenses = totals?.scheduledExpenses ?? 0;
    const pending = scheduled - collected;
    const progress = scheduled > 0 ? (collected / scheduled) * 100 : 0;

    return (
        <>
            <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] group overflow-hidden">
                <CardContent className="p-8 h-full flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Ingresos Prog.</p>
                        <DollarSign className="size-4 text-zinc-600 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-2xl font-display font-medium text-white tracking-widest">{formatCurrency(scheduled)}</p>
                    <p className="text-[9px] font-mono text-zinc-600 mt-1">Egresos prog. {formatCurrency(expenses)}</p>
                </CardContent>
            </Card>

            <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] group overflow-hidden">
                <CardContent className="p-8 h-full flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Cobrado</p>
                        <Check className="size-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <p className="text-2xl font-display font-medium text-emerald-400 tracking-widest">{formatCurrency(collected)}</p>
                </CardContent>
            </Card>

            <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] group overflow-hidden">
                <CardContent className="p-8 h-full flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Por Cobrar</p>
                        <Clock className="size-4 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <p className="text-2xl font-display font-medium text-amber-400 tracking-widest">{formatCurrency(pending)}</p>
                </CardContent>
            </Card>

            <p className="sr-only">Progreso de cobro del mes: {Math.round(progress)}%</p>
        </>
    );
}

// ---------------------------------------------------------------------------
// Event detail modal
// ---------------------------------------------------------------------------

function EventDetailModal({
    event,
    onClose,
}: {
    event: FinancialCalendarEvent | null;
    onClose: () => void;
}) {
    if (!event) return null;

    const colors = eventColorClasses(event);

    return (
        <Dialog open={!!event} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-lg">
                <DialogHeader className="pb-6 border-b border-white/5">
                    <DialogTitle className="text-2xl font-display italic text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 border border-white/10 text-primary">
                            <DollarSign className="size-5" />
                        </div>
                        Detalle de Evento
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-6">
                    {/* Icon + title + client */}
                    <div className="flex items-center gap-5">
                        <div className={`size-14 rounded-[1.5rem] flex items-center justify-center border shadow-inner ${colors.bg} ${colors.border} ${colors.text}`}>
                            <SourceIcon sourceType={event.sourceType} />
                        </div>
                        <div>
                            <p className="text-lg font-display font-medium text-white tracking-tight leading-snug">{event.title}</p>
                            {event.clientName && (
                                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] font-bold mt-0.5">{event.clientName}</p>
                            )}
                        </div>
                    </div>

                    {/* Amount + dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 space-y-1.5">
                            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Monto</p>
                            <p className="text-xl font-display font-bold text-white tracking-wider">{formatCurrency(event.amount)}</p>
                        </div>
                        <div className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 space-y-1.5">
                            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Fecha Prog.</p>
                            <p className="text-sm font-mono font-bold text-zinc-300">{formatDate(event.scheduledDate)}</p>
                            {event.paidDate && (
                                <>
                                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-2">Fecha Pago</p>
                                    <p className="text-sm font-mono font-bold text-emerald-400">{formatDate(event.paidDate)}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Metadata row */}
                    <div className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Origen</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono ${colors.text}`}>{sourceLabel(event.sourceType)}</span>
                                <span className={`text-[9px] font-mono ${event.direction === "ingreso" ? "text-emerald-400" : "text-rose-400"} flex items-center gap-0.5`}>
                                    {event.direction === "ingreso"
                                        ? <><ArrowUpRight className="size-3" /> Ingreso</>
                                        : <><ArrowDownLeft className="size-3" /> Egreso</>
                                    }
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {event.isSynthetic && (
                                <Badge className="rounded-full px-3 py-0.5 text-[8px] font-mono uppercase tracking-[0.1em] border-none bg-purple-500/20 text-purple-400">
                                    Proyectado
                                </Badge>
                            )}
                            <StatusBadge status={event.status} />
                        </div>
                    </div>

                    {/* Linked IDs */}
                    {(event.projectName || event.transactionId || event.installmentId || event.recurringTemplateId) && (
                        <div className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 space-y-2">
                            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Referencias</p>
                            {event.projectName && <p className="text-[10px] font-mono text-zinc-400">Proyecto: <span className="text-zinc-200">{event.projectName}</span></p>}
                            {event.transactionId && <p className="text-[10px] font-mono text-zinc-400">Transaccion ID: <span className="text-zinc-200">#{event.transactionId}</span></p>}
                            {event.installmentId && <p className="text-[10px] font-mono text-zinc-400">Parcialidad ID: <span className="text-zinc-200">#{event.installmentId}</span></p>}
                            {event.recurringTemplateId && <p className="text-[10px] font-mono text-zinc-400">Template ID: <span className="text-zinc-200">#{event.recurringTemplateId}</span></p>}
                        </div>
                    )}

                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full h-12 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 font-mono text-[10px] uppercase tracking-widest"
                    >
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PaymentCalendar() {
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedEvent, setSelectedEvent] = useState<FinancialCalendarEvent | null>(null);

    // Fetch a window of PREFETCH_MONTHS_RADIUS months around the visible month so that
    // navigating forwards/backwards feels instant thanks to TanStack Query caching.
    const rangeStart = useMemo(
        () => new Date(currentDate.getFullYear(), currentDate.getMonth() - PREFETCH_MONTHS_RADIUS, 1),
        [currentDate],
    );
    const rangeEnd = useMemo(
        () => new Date(currentDate.getFullYear(), currentDate.getMonth() + PREFETCH_MONTHS_RADIUS + 1, 0, 23, 59, 59, 999),
        [currentDate],
    );

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["payment-calendar", rangeStart.toISOString(), rangeEnd.toISOString()],
        queryFn: () => fetchPaymentCalendar(rangeStart, rangeEnd),
        staleTime: 60_000,
    });

    const is403 = isError && (error as any)?.status === 403;

    // Events for the currently visible month only.
    const visibleMonthKey = toMonthKey(currentDate);

    const monthEvents = useMemo(
        () => (data?.events ?? []).filter((e) => e.month === visibleMonthKey),
        [data, visibleMonthKey],
    );

    const monthTotals = useMemo(
        () => data?.monthlyTotals.find((t) => t.month === visibleMonthKey),
        [data, visibleMonthKey],
    );

    // Group events by day-of-month for the grid.
    const eventsByDay = useMemo(() => {
        const map = new Map<number, FinancialCalendarEvent[]>();
        for (const event of monthEvents) {
            const day = dayOfEvent(event);
            const existing = map.get(day) ?? [];
            existing.push(event);
            map.set(day, existing);
        }
        return map;
    }, [monthEvents]);

    // Build the calendar grid cells.
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        type DayCell = { day: number | null; events: FinancialCalendarEvent[] };
        const cells: DayCell[] = [];

        for (let pad = 0; pad < firstDay; pad++) cells.push({ day: null, events: [] });
        for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, events: eventsByDay.get(d) ?? [] });

        return cells;
    }, [currentDate, eventsByDay]);

    const navigateMonth = (delta: number) => {
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    // Yield progress for the header indicator
    const scheduled = monthTotals?.scheduledIncome ?? 0;
    const collected = monthTotals?.collectedIncome ?? 0;
    const yieldProgress = scheduled > 0 ? Math.round((collected / scheduled) * 100) : 0;

    // ---------------------------------------------------------------------------
    // Full-page states: loading, 403, generic error
    // ---------------------------------------------------------------------------

    if (is403) {
        return (
            <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col items-center justify-center gap-6 p-8">
                <div className="size-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                    <Lock className="size-10" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-2xl font-display italic text-white">Acceso restringido</p>
                    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                        Este modulo esta disponible unicamente para administradores.
                    </p>
                </div>
                <Link href="/">
                    <Button variant="outline" className="rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 font-mono text-[10px] uppercase tracking-widest">
                        <ArrowLeft className="size-4 mr-2" /> Volver al inicio
                    </Button>
                </Link>
            </div>
        );
    }

    if (isError && !is403) {
        return (
            <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col items-center justify-center gap-6 p-8">
                <div className="size-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <AlertCircle className="size-10" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-2xl font-display italic text-white">Error al cargar el calendario</p>
                    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                        Ocurrio un error inesperado. Intenta de nuevo.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 font-mono text-[10px] uppercase tracking-widest"
                    onClick={() => window.location.reload()}
                >
                    <RefreshCw className="size-4 mr-2" /> Reintentar
                </Button>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // Main render
    // ---------------------------------------------------------------------------

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-100 p-3 sm:p-8 font-sans selection:bg-primary/30">
            <div className="max-w-[1400px] mx-auto space-y-12">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <Link href="/">
                            <Button variant="outline" size="icon" className="size-12 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                                <ArrowLeft className="size-5 text-zinc-400" />
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
                        <div className={`size-2 rounded-full ${yieldProgress < 100 && scheduled > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"}`} />
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">Yield Progress: </span>
                        <span className="text-[10px] font-mono font-bold text-white">{yieldProgress}%</span>
                    </div>
                </div>

                {/* Navigation + Totals */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Card className="lg:col-span-2 bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between">
                                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)} className="size-12 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                                    <ChevronLeft className="size-6 text-zinc-400" />
                                </Button>
                                <div className="text-center space-y-1">
                                    <p className="text-3xl font-display italic font-bold tracking-tight text-white uppercase">{MONTH_NAMES[currentDate.getMonth()]}</p>
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] opacity-60">{currentDate.getFullYear()}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)} className="size-12 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                                    <ChevronRight className="size-6 text-zinc-400" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <TotalsCards totals={monthTotals} />
                </div>

                {/* Calendar Grid */}
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-7 gap-4 mb-6">
                            {["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"].map((d) => (
                                <div key={d} className="text-center text-[9px] font-mono font-bold text-zinc-600 tracking-[0.3em] py-2">{d}</div>
                            ))}
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-7 gap-4">
                                {Array.from({ length: 35 }).map((_, i) => (
                                    <div key={i} className="min-h-[120px] rounded-3xl bg-white/[0.02] animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-4">
                                {calendarDays.map((cell, idx) => {
                                    const today = new Date();
                                    const isToday = cell.day !== null
                                        && cell.day === today.getDate()
                                        && currentDate.getMonth() === today.getMonth()
                                        && currentDate.getFullYear() === today.getFullYear();

                                    return (
                                        <div
                                            key={idx}
                                            className={`min-h-[120px] p-3 rounded-3xl border transition-all duration-300 relative group/day
                                                ${cell.day ? "bg-white/[0.02] hover:bg-white/[0.05] border-white/5" : "bg-transparent border-transparent"}
                                                ${isToday ? "ring-1 ring-primary border-primary/40 bg-primary/[0.03]" : ""}
                                            `}
                                        >
                                            {cell.day && (
                                                <>
                                                    <div className={`text-xs font-mono font-bold mb-2 ${isToday ? "text-primary" : "text-zinc-500 group-hover/day:text-zinc-300"} transition-colors`}>
                                                        {String(cell.day).padStart(2, "0")}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {cell.events.slice(0, 3).map((event) => {
                                                            const c = eventColorClasses(event);
                                                            return (
                                                                <div
                                                                    key={event.id}
                                                                    onClick={() => setSelectedEvent(event)}
                                                                    className={`text-[8px] font-mono px-2 py-1 rounded-full truncate transition-all border cursor-pointer ${c.bg} ${c.border} ${c.text} hover:scale-[1.04] active:scale-[0.97]`}
                                                                    title={event.title}
                                                                >
                                                                    {formatCurrency(event.amount)}
                                                                </div>
                                                            );
                                                        })}
                                                        {cell.events.length > 3 && (
                                                            <div className="text-[8px] font-mono text-zinc-600 pl-1">
                                                                +{cell.events.length - 3} MAS
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
                        )}
                    </CardContent>
                </Card>

                {/* Operations Ledger */}
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-white/5">
                        <CardTitle className="text-xl font-display italic text-white tracking-tight">Active Operations Ledger</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 rounded-[2rem] bg-white/[0.02] animate-pulse" />
                                ))}
                            </div>
                        ) : monthEvents.length === 0 ? (
                            <div className="py-24 text-center space-y-4">
                                <div className="size-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-700">
                                    <CalendarIcon className="size-8" />
                                </div>
                                <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                                    Sin eventos financieros en este periodo
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {monthEvents.map((event) => {
                                    const c = eventColorClasses(event);
                                    return (
                                        <div
                                            key={event.id}
                                            className="group bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 flex items-center justify-between cursor-pointer"
                                            onClick={() => setSelectedEvent(event)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`size-12 rounded-2xl flex items-center justify-center border shadow-inner transition-colors ${c.bg} ${c.border} ${c.text}`}>
                                                    <SourceIcon sourceType={event.sourceType} className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="font-display font-medium text-white tracking-tight group-hover:text-primary transition-colors line-clamp-1 max-w-[200px]">
                                                        {event.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                                                            {event.clientName ?? sourceLabel(event.sourceType)}
                                                        </span>
                                                        {event.isSynthetic && (
                                                            <span className="text-[8px] font-mono text-purple-500 uppercase">· proj</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-1 shrink-0">
                                                <p className={`font-display font-bold tracking-tight ${event.direction === "ingreso" ? "text-white" : "text-rose-300"}`}>
                                                    {event.direction === "egreso" && "−"}{formatCurrency(event.amount)}
                                                </p>
                                                <StatusBadge status={event.status} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </div>
    );
}
