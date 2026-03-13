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
            <div className="flex items-center justify-between px-8 pt-8">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-white/10">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-display uppercase tracking-tight text-zinc-100 italic">Profitability Logic</h3>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">Financial Yield Analysis</p>
                    </div>
                    {isRecurringMonthly && (
                        <Badge variant="outline" className="gap-2 text-[9px] font-mono uppercase tracking-widest text-sky-400 border-sky-400/20 bg-sky-500/10 px-3 h-6">
                            <Repeat2 className="w-3 h-3" /> Recurring Model
                        </Badge>
                    )}
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" onClick={() => refetch()} className="w-10 h-10 rounded-full hover:bg-white/5 border border-white/5 transition-all">
                            <RefreshCcw className="w-4 h-4 text-zinc-500" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-950 border-white/10 font-mono text-[9px] uppercase tracking-widest">Recalcular</TooltipContent>
                </Tooltip>
            </div>

            {lines.length === 0 ? (
                <div className="m-8 rounded-[2rem] border border-dashed border-white/10 py-16 text-center bg-white/5">
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground opacity-60 italic">
                        No se detectaron activos de servicio asociados.
                    </p>
                </div>
            ) : (
                <div className="p-8 space-y-8">
                    {/* Services table */}
                    <div className="rounded-[1.5rem] border border-white/10 overflow-hidden bg-zinc-950/20">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] uppercase font-mono tracking-widest text-muted-foreground">
                                        <th className="text-left px-6 py-4 font-bold">Servicio / Glosario</th>
                                        <th className="text-center px-4 py-4 font-bold w-20">Qty</th>
                                        <th className="text-right px-4 py-4 font-bold w-32">Costo U.</th>
                                        <th className="text-right px-4 py-4 font-bold w-32">Precio U.</th>
                                        <th className="text-right px-4 py-4 font-bold w-32">Gasto</th>
                                        <th className="text-right px-6 py-4 font-bold w-32">Factura</th>
                                        <th className="text-right px-6 py-4 font-bold w-24 pr-8">Yield</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {lines.map(line => {
                                        const isEditingQty = editing?.lineId === line.id && editing.field === "qty";
                                        const isEditingCost = editing?.lineId === line.id && editing.field === "cost";
                                        const isEditingPrice = editing?.lineId === line.id && editing.field === "price";

                                        return (
                                            <tr key={line.id} className="group hover:bg-white/5 transition-all duration-300">
                                                {/* Service name */}
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-zinc-100 italic">{line.serviceName}</div>
                                                    {line.supplierName && (
                                                        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1 opacity-50">{line.supplierName}</div>
                                                    )}
                                                </td>

                                                {/* Quantity — editable */}
                                                <td className="px-4 py-4 text-center">
                                                    {isEditingQty ? (
                                                        <Input
                                                            autoFocus
                                                            type="number"
                                                            min={1}
                                                            className="w-16 h-7 text-center text-[10px] font-mono px-1 bg-white/5 border-white/20 rounded-lg focus:border-primary/50"
                                                            value={editing.value}
                                                            onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                                                            onBlur={() => commitEdit(line)}
                                                            onKeyDown={e => { if (e.key === "Enter") commitEdit(line); if (e.key === "Escape") setEditing(null); }}
                                                        />
                                                    ) : (
                                                        <button
                                                            className="px-3 py-1 font-mono text-[10px] rounded-lg text-zinc-400 border border-white/5 hover:bg-white/5 group-hover:border-white/20 transition-all cursor-text"
                                                            onClick={() => setEditing({ lineId: line.id, field: "qty", value: String(line.quantity) })}
                                                        >
                                                            {line.quantity}
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Unit cost — editable */}
                                                {/* Unit cost — editable */}
                                                <td className="px-4 py-4 text-right">
                                                    {isEditingCost ? (
                                                        <Input
                                                            autoFocus
                                                            type="number"
                                                            min={0}
                                                            step={0.01}
                                                            className="w-28 h-7 text-right text-[10px] font-mono px-1 bg-white/5 border-white/20 rounded-lg focus:border-primary/50"
                                                            value={editing.value}
                                                            onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                                                            onBlur={() => commitEdit(line)}
                                                            onKeyDown={e => { if (e.key === "Enter") commitEdit(line); if (e.key === "Escape") setEditing(null); }}
                                                        />
                                                    ) : (
                                                        <button
                                                            className="text-right w-full px-2 py-1 font-mono text-[10px] rounded-lg text-muted-foreground border border-transparent hover:border-white/5 hover:bg-white/5 transition-all cursor-text"
                                                            onClick={() => setEditing({ lineId: line.id, field: "cost", value: String(line.unitCost) })}
                                                        >
                                                            {fmt(line.unitCost)}
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Unit price — editable */}
                                                <td className="px-4 py-4 text-right">
                                                    {isEditingPrice ? (
                                                        <Input
                                                            autoFocus
                                                            type="number"
                                                            min={0}
                                                            step={0.01}
                                                            className="w-28 h-7 text-right text-[10px] font-mono px-1 bg-white/5 border-white/20 rounded-lg focus:border-primary/50"
                                                            value={editing.value}
                                                            onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                                                            onBlur={() => commitEdit(line)}
                                                            onKeyDown={e => { if (e.key === "Enter") commitEdit(line); if (e.key === "Escape") setEditing(null); }}
                                                        />
                                                    ) : (
                                                        <button
                                                            className="text-right w-full px-2 py-1 font-mono text-[10px] rounded-lg text-zinc-100 border border-transparent hover:border-white/5 hover:bg-white/5 transition-all cursor-text font-bold"
                                                            onClick={() => setEditing({ lineId: line.id, field: "price", value: String(line.unitPrice) })}
                                                        >
                                                            {fmt(line.unitPrice)}
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Line totals (read-only) */}
                                                <td className="px-4 py-4 text-right text-muted-foreground font-mono text-[10px] tabular-nums opacity-40">{fmt(line.lineCost)}</td>
                                                <td className="px-6 py-4 text-right text-zinc-100 font-mono text-[10px] tabular-nums opacity-80">{fmt(line.linePrice)}</td>

                                                {/* Margin */}
                                                <td className={`px-6 py-4 text-right tabular-nums font-mono text-[10px] pr-8 ${pctColor(line.lineMarginPct)}`}>
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
                    <div className={`rounded-[1.5rem] border p-8 bg-zinc-950/40 backdrop-blur-md relative overflow-hidden group shadow-[0_0_25px_rgba(0,0,0,0.2)] ${hCfg.bg.replace('bg-', 'bg-opacity-5 ')}`}>
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`p-2 rounded-lg bg-zinc-950/60 border border-white/5 ${hCfg.color}`}>
                                <HealthIcon className="w-5 h-5 shadow-[0_0_10px_currentColor]" />
                            </div>
                            <span className={`text-[10px] font-mono uppercase tracking-[0.2em] font-bold ${hCfg.color}`}>{hCfg.label}</span>
                            {isRecurringMonthly && (
                                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground ml-auto opacity-40 italic">* Real-time Recurrent Valuation</span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <TotalItem label="Total Exposure" value={fmt(totals.totalCost)} sub="Internal Costing" />
                            <TotalItem label="Project Revenue" value={fmt(totals.totalPrice)} sub="Client Invoicing" />
                            <TotalItem
                                label="Aggregated Margin"
                                value={fmt(totals.totalMargin)}
                                sub={totals.totalMargin >= 0 ? "Net Surplus" : "Resource Deficit"}
                                valueClass={pctColor(totals.profitabilityPct)}
                            />
                            <TotalItem
                                label="Operational Yield"
                                value={`${totals.profitabilityPct.toFixed(1)}%`}
                                sub="Conversion Efficiency"
                                valueClass={`text-3xl font-display italic font-bold ${pctColor(totals.profitabilityPct)}`}
                            />
                        </div>

                        <div className="mt-8 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-30 group-hover:opacity-50 transition-opacity">
                            <Info className="w-4 h-4 shrink-0" />
                            Global inline editing active. System persists all tactical adjustments in real-time.
                        </div>
                    </div>
                </div>
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
        <div className="space-y-1 group/item">
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground opacity-50 group-hover/item:opacity-80 transition-opacity">{label}</p>
            <p className={`text-xl font-bold font-mono tracking-tight tabular-nums ${valueClass}`}>{value}</p>
            <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground opacity-30">{sub}</p>
        </div>
    );
}
