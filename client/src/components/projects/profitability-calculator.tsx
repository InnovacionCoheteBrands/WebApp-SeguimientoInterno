/**
 * ProfitabilityCalculator — Calculadora de Rentabilidad
 *
 * Displays an interactive, editable table of services on a project, showing:
 *   • Unit cost (proveedor) and sell price (cliente)
 *   • Quantity
 *   • Line totals (costo, precio, margen)
 *   • Aggregated totals with colour-coded health indicator
 *
 * UX Rules:
 *   • Margin ≥ 20% → emerald (saludable)
 *   • Margin 10–19% → amber (atención)
 *   • Margin < 10% or negative → red (crítico)
 */
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    TrendingUp,
    RefreshCcw,
    Info,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Repeat2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface ProfitLine {
    id: number;
    serviceId: number;
    serviceName: string;
    category: string | null;
    supplierName: string | null;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    lineCost: number;
    linePrice: number;
    lineMargin: number;
    lineMarginPct: number;
    notes: string | null;
}

interface ProfitabilityData {
    projectId: number;
    projectName: string;
    dealType: string;
    isRecurringMonthly: boolean;
    lines: ProfitLine[];
    totals: {
        totalCost: number;
        totalPrice: number;
        totalMargin: number;
        profitabilityPct: number;
        health: "healthy" | "warning" | "critical";
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────
function fmt(n: number) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
    }).format(n);
}

function healthConfig(h: "healthy" | "warning" | "critical") {
    switch (h) {
        case "healthy": return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Rentabilidad Saludable" };
        case "warning": return { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", label: "Rentabilidad Baja" };
        case "critical": return { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Margen Crítico" };
    }
}

function pctColor(pct: number) {
    if (pct >= 20) return "text-emerald-400";
    if (pct >= 10) return "text-amber-400";
    return "text-red-400";
}

// ── Component ──────────────────────────────────────────────────────────────
export function ProfitabilityCalculator({ projectId }: { projectId: number }) {
    const { toast } = useToast();
    const qc = useQueryClient();

    // ── Fetch profitability data ──────────────────────────────────────────
    const { data, isLoading, isError, refetch } = useQuery<ProfitabilityData>({
        queryKey: [`/api/projects/${projectId}/profitability`],
        queryFn: () =>
            apiRequest("GET", `/api/projects/${projectId}/profitability`).then(r => r.json()),
    });

    // ── Inline editing state ──────────────────────────────────────────────
    const [editing, setEditing] = useState<{
        lineId: number;
        field: "qty" | "cost" | "price";
        value: string;
    } | null>(null);

    // ── Update mutation ───────────────────────────────────────────────────
    const updateLine = useMutation({
        mutationFn: ({
            serviceId,
            quantity,
            customCost,
            sellPrice,
        }: {
            serviceId: number;
            quantity?: number;
            customCost?: string;
            sellPrice?: string;
        }) =>
            apiRequest("PATCH", `/api/projects/${projectId}/services/${serviceId}/line`, {
                quantity,
                customCost,
                sellPrice,
            }).then(r => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [`/api/projects/${projectId}/profitability`] });
            setEditing(null);
        },
        onError: () => toast({ title: "Error al actualizar línea", variant: "destructive" }),
    });

    const commitEdit = useCallback(
        (line: ProfitLine) => {
            if (!editing) return;
            const val = parseFloat(editing.value);
            if (isNaN(val) || val < 0) {
                toast({ title: "Valor inválido", variant: "destructive" });
                return;
            }
            if (editing.field === "qty") {
                updateLine.mutate({ serviceId: line.serviceId, quantity: Math.round(val) });
            } else if (editing.field === "cost") {
                updateLine.mutate({ serviceId: line.serviceId, customCost: String(val) });
            } else {
                updateLine.mutate({ serviceId: line.serviceId, sellPrice: String(val) });
            }
        },
        [editing, updateLine, toast]
    );

    // ── Render ────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-8 bg-muted rounded-xl w-1/3" />
                <div className="h-32 bg-muted rounded-2xl" />
                <div className="h-20 bg-muted rounded-2xl" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
                <XCircle className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No se pudo cargar la rentabilidad.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-2">
                    <RefreshCcw className="w-4 h-4" /> Reintentar
                </Button>
            </div>
        );
    }

    const { lines, totals, isRecurringMonthly, dealType } = data;
    const hCfg = healthConfig(totals.health);
    const HealthIcon = hCfg.icon;

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold">Calculadora de Rentabilidad</h3>
                    {isRecurringMonthly && (
                        <Badge variant="outline" className="gap-1 text-xs text-sky-400 border-sky-400/40 bg-sky-500/10">
                            <Repeat2 className="w-3 h-3" /> Iguala Mensual
                        </Badge>
                    )}
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" onClick={() => refetch()} className="w-8 h-8">
                            <RefreshCcw className="w-3.5 h-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Recalcular</TooltipContent>
                </Tooltip>
            </div>

            {lines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                        Aún no hay servicios asignados a este proyecto.
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                        Agrega servicios desde la pestaña "Servicios" para ver el análisis de rentabilidad.
                    </p>
                </div>
            ) : (
                <>
                    {/* Services table */}
                    <div className="rounded-2xl border border-border/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/40 text-xs text-muted-foreground">
                                        <th className="text-left px-4 py-3 font-medium">Servicio</th>
                                        <th className="text-center px-3 py-3 font-medium w-20">Cant.</th>
                                        <th className="text-right px-3 py-3 font-medium w-32">Costo Unit.</th>
                                        <th className="text-right px-3 py-3 font-medium w-32">Precio Unit.</th>
                                        <th className="text-right px-3 py-3 font-medium w-28">Costo Total</th>
                                        <th className="text-right px-4 py-3 font-medium w-28">Precio Total</th>
                                        <th className="text-right px-4 py-3 font-medium w-24">Margen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {lines.map(line => {
                                        const isEditingQty = editing?.lineId === line.id && editing.field === "qty";
                                        const isEditingCost = editing?.lineId === line.id && editing.field === "cost";
                                        const isEditingPrice = editing?.lineId === line.id && editing.field === "price";

                                        return (
                                            <tr key={line.id} className="group hover:bg-muted/20 transition-colors">
                                                {/* Service name */}
                                                <td className="px-4 py-3">
                                                    <div className="font-medium leading-tight">{line.serviceName}</div>
                                                    {line.supplierName && (
                                                        <div className="text-xs text-muted-foreground mt-0.5">{line.supplierName}</div>
                                                    )}
                                                </td>

                                                {/* Quantity — editable */}
                                                <td className="px-3 py-3 text-center">
                                                    {isEditingQty ? (
                                                        <Input
                                                            autoFocus
                                                            type="number"
                                                            min={1}
                                                            className="w-16 h-7 text-center text-xs px-1"
                                                            value={editing.value}
                                                            onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                                                            onBlur={() => commitEdit(line)}
                                                            onKeyDown={e => { if (e.key === "Enter") commitEdit(line); if (e.key === "Escape") setEditing(null); }}
                                                        />
                                                    ) : (
                                                        <button
                                                            className="px-2 py-0.5 rounded hover:bg-muted transition-colors cursor-text"
                                                            onClick={() => setEditing({ lineId: line.id, field: "qty", value: String(line.quantity) })}
                                                        >
                                                            {line.quantity}
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Unit cost — editable */}
                                                <td className="px-3 py-3 text-right">
                                                    {isEditingCost ? (
                                                        <Input
                                                            autoFocus
                                                            type="number"
                                                            min={0}
                                                            step={0.01}
                                                            className="w-28 h-7 text-right text-xs px-1"
                                                            value={editing.value}
                                                            onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                                                            onBlur={() => commitEdit(line)}
                                                            onKeyDown={e => { if (e.key === "Enter") commitEdit(line); if (e.key === "Escape") setEditing(null); }}
                                                        />
                                                    ) : (
                                                        <button
                                                            className="text-right w-full px-1 py-0.5 rounded hover:bg-muted transition-colors cursor-text text-muted-foreground"
                                                            onClick={() => setEditing({ lineId: line.id, field: "cost", value: String(line.unitCost) })}
                                                        >
                                                            {fmt(line.unitCost)}
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Unit price — editable */}
                                                <td className="px-3 py-3 text-right">
                                                    {isEditingPrice ? (
                                                        <Input
                                                            autoFocus
                                                            type="number"
                                                            min={0}
                                                            step={0.01}
                                                            className="w-28 h-7 text-right text-xs px-1"
                                                            value={editing.value}
                                                            onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                                                            onBlur={() => commitEdit(line)}
                                                            onKeyDown={e => { if (e.key === "Enter") commitEdit(line); if (e.key === "Escape") setEditing(null); }}
                                                        />
                                                    ) : (
                                                        <button
                                                            className="text-right w-full px-1 py-0.5 rounded hover:bg-muted transition-colors cursor-text"
                                                            onClick={() => setEditing({ lineId: line.id, field: "price", value: String(line.unitPrice) })}
                                                        >
                                                            {fmt(line.unitPrice)}
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Line totals (read-only) */}
                                                <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">{fmt(line.lineCost)}</td>
                                                <td className="px-4 py-3 text-right tabular-nums">{fmt(line.linePrice)}</td>

                                                {/* Margin */}
                                                <td className={`px-4 py-3 text-right tabular-nums font-medium ${pctColor(line.lineMarginPct)}`}>
                                                    {line.lineMarginPct.toFixed(1)}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals Panel */}
                    <div className={`rounded-2xl border p-5 ${hCfg.bg}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <HealthIcon className={`w-5 h-5 ${hCfg.color}`} />
                            <span className={`text-sm font-semibold ${hCfg.color}`}>{hCfg.label}</span>
                            {isRecurringMonthly && (
                                <span className="text-xs text-muted-foreground ml-auto">* Importes mensuales (Iguala)</span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <TotalItem label="Costo Total" value={fmt(totals.totalCost)} sub="Proveedor / Interno" />
                            <TotalItem label="Precio Total" value={fmt(totals.totalPrice)} sub="Facturado al cliente" />
                            <TotalItem
                                label="Margen Bruto"
                                value={fmt(totals.totalMargin)}
                                sub={totals.totalMargin >= 0 ? "Utilidad" : "Pérdida"}
                                valueClass={pctColor(totals.profitabilityPct)}
                            />
                            <TotalItem
                                label="Rentabilidad"
                                value={`${totals.profitabilityPct.toFixed(1)}%`}
                                sub="Sobre precio de venta"
                                valueClass={`text-2xl font-bold ${pctColor(totals.profitabilityPct)}`}
                            />
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            Haz clic en Cant., Costo o Precio de cualquier línea para editarlo en línea. Los cambios se guardan automáticamente.
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function TotalItem({
    label,
    value,
    sub,
    valueClass = "text-foreground",
}: {
    label: string;
    value: string;
    sub: string;
    valueClass?: string;
}) {
    return (
        <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${valueClass}`}>{value}</p>
            <p className="text-xs text-muted-foreground/60">{sub}</p>
        </div>
    );
}
