import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Target,
    Briefcase,
    TrendingUp,
    DollarSign,
    CreditCard,
    ArrowRight,
    Plus,
    FileText,
    UserPlus,
    Wallet,
    Sparkles,
    Loader2,
    AlertTriangle,
    RefreshCw
} from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAiSummaryHealth, generateSummary, SummaryRequestError, type SummaryModule } from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { format, subMonths, startOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Types ---
interface WidgetProps {
    className?: string;
    data?: any;
    loading?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Quick Actions
// ─────────────────────────────────────────────────────────────
export function QuickActions() {
    const [, setLocation] = useLocation();

    const actions = [
        { label: "Nuevo Lead", icon: UserPlus, onClick: () => setLocation("/crm") },
        { label: "Nuevo Proyecto", icon: Briefcase, onClick: () => setLocation("/proyectos") },
        { label: "Nuevo Empleado", icon: Users, onClick: () => setLocation("/equipo") },
        { label: "Nueva Transacción", icon: CreditCard, onClick: () => setLocation("/finanzas") },
        { label: "Ver Financiero", icon: TrendingUp, onClick: () => setLocation("/finanzas") },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
                <Button
                    key={index}
                    variant="outline"
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-primary transition-all rounded-full h-8 text-xs font-medium"
                    onClick={action.onClick}
                >
                    <action.icon className="mr-2 h-3.5 w-3.5" />
                    {action.label}
                </Button>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────
interface KpiCardProps {
    title: string;
    value: string;
    subValue?: string;
    icon: any;
    trend?: string;
    trendUp?: boolean;
    color?: "blue" | "green" | "amber" | "purple";
    onClick?: () => void;
}

export function KpiCard({ title, value, subValue, icon: Icon, trend, trendUp, onClick }: KpiCardProps) {
    return (
        <Card
            className={`bg-zinc-950/40 backdrop-blur-md border-white/15 ring-1 ring-inset ring-white/10 shadow-sm relative overflow-hidden group hover:bg-zinc-900/50 hover:border-white/30 transition-all duration-500 ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}`}
            onClick={onClick}
        >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] group-hover:bg-primary/[0.05] group-hover:border-primary/20 transition-colors">
                        <Icon className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors" />
                    </div>
                    {trend && (
                        <Badge variant="outline" className={`bg-transparent border-white/5 text-[10px] uppercase font-medium tracking-wider px-2 py-0.5 ${trendUp ? 'text-primary/90' : 'text-red-400/80'}`}>
                            {trend}
                        </Badge>
                    )}
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight tabular-nums">{value}</h3>
                    <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
                    {subValue && <p className="text-xs text-muted-foreground/60 font-mono">{subValue}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────
// CRM Widget
// ─────────────────────────────────────────────────────────────
export function CrmWidget({ data, loading }: WidgetProps) {
    const [, setLocation] = useLocation();
    const metrics = data?.metrics || {};

    return (
        <Card className="bg-zinc-950/40 backdrop-blur-md border-white/15 ring-1 ring-inset ring-white/10 shadow-sm h-full flex flex-col hover:bg-zinc-900/40 hover:border-white/30 transition-all duration-500">
            <CardHeader className="pb-2 border-b border-white/[0.05] mb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-[13px] uppercase tracking-widest font-semibold text-zinc-300 flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-primary/80" />
                        CRM Pipeline
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-50 hover:opacity-100 hover:bg-white/5" onClick={() => setLocation("/crm")}>
                        <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </Button>
                </div>
                <CardDescription className="text-xs text-zinc-500 mt-1">Progreso de ventas y cualificación</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2"><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-24" /></div>
                            <div className="flex flex-col items-end space-y-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-3 w-24" /></div>
                        </div>
                        <Skeleton className="h-1.5 w-full mt-4" />
                        <Skeleton className="h-10 w-full mt-6" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-display font-medium text-zinc-50 tracking-tight">{metrics.total || 0}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Total Leads</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-medium text-primary">${(metrics.avgValue || 0).toLocaleString()}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Valor Estimado</p>
                                </div>
                            </div>
                            <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/[0.02]">
                                <div className="flex justify-between text-xs text-zinc-400 font-medium">
                                    <span className="uppercase tracking-wider text-[10px]">Tasa de Cierre</span>
                                    <span className="text-primary">{metrics.conversionRate || 0}%</span>
                                </div>
                                <Progress value={metrics.conversionRate || 0} className="h-1 bg-white/5 [&>div]:bg-primary" />
                            </div>
                        </div>
                        <Button className="w-full mt-6 bg-transparent hover:bg-white/5 border border-white/10 text-zinc-300 transition-all font-medium text-xs tracking-wider uppercase h-10" onClick={() => setLocation("/crm")}>
                            Ver Tablero CRM
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────
// Projects Widget
// ─────────────────────────────────────────────────────────────
export function ProjectsWidget({ data, loading }: WidgetProps) {
    const [, setLocation] = useLocation();
    const activeCount = data?.length || 0;
    const totalBudget = data?.reduce((acc: number, curr: any) => acc + (curr.budget || 0), 0) || 0;

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            "active": "En Desarrollo", "planning": "Planificación",
            "on_hold": "Pausa", "completed": "Terminado", "cancelled": "Cancelado"
        };
        return map[status] || status;
    };

    return (
        <Card className="bg-zinc-950/40 backdrop-blur-md border-white/15 ring-1 ring-inset ring-white/10 shadow-sm h-full flex flex-col hover:bg-zinc-900/40 hover:border-white/30 transition-all duration-500">
            <CardHeader className="pb-2 border-b border-white/[0.05] mb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-[13px] uppercase tracking-widest font-semibold text-zinc-300 flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-primary/80" />
                        Gestión de Proyectos
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-50 hover:opacity-100 hover:bg-white/5" onClick={() => setLocation("/proyectos")}>
                        <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </Button>
                </div>
                <CardDescription className="text-xs text-zinc-500 mt-1">Proyectos activos y entregables</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2"><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-24" /></div>
                            <div className="flex flex-col items-end space-y-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-3 w-24" /></div>
                        </div>
                        <div className="space-y-3 mt-4">
                            <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full mt-6" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-display font-medium text-zinc-50 tracking-tight">{activeCount}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Proyectos Activos</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-medium text-primary">${totalBudget.toLocaleString()}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Cotización Total</p>
                                </div>
                            </div>
                            <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/[0.02]">
                                {data?.slice(0, 3).map((proj: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-300 font-medium truncate max-w-[150px]">{proj.name}</span>
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider h-5 border-white/10 text-zinc-400 bg-white/5">{getStatusLabel(proj.status)}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Button className="w-full mt-6 bg-transparent hover:bg-white/5 border border-white/10 text-zinc-300 transition-all font-medium text-xs tracking-wider uppercase h-10" onClick={() => setLocation("/proyectos")}>
                            Ver Proyectos
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// ─────────────────────────────────────────────────────────────
// Finance Widget
// ─────────────────────────────────────────────────────────────
export function FinanceWidget({ data, loading }: WidgetProps) {
    const [, setLocation] = useLocation();
    const balance = data?.netProfit || 0;

    return (
        <Card className="bg-zinc-950/40 backdrop-blur-md border-white/15 ring-1 ring-inset ring-white/10 shadow-sm h-full flex flex-col hover:bg-zinc-900/40 hover:border-white/30 transition-all duration-500">
            <CardHeader className="pb-2 border-b border-white/[0.05] mb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-[13px] uppercase tracking-widest font-semibold text-zinc-300 flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5 text-primary/80" />
                        Estado Financiero
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-50 hover:opacity-100 hover:bg-white/5" onClick={() => setLocation("/finanzas")}>
                        <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </Button>
                </div>
                <CardDescription className="text-xs text-zinc-500 mt-1">Balance general y flujo de caja</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-3 w-24" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full mt-6" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-display font-medium text-zinc-50 tracking-tight">${balance.toLocaleString()}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Balance Actual</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.02]">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Ingresos</p>
                                    <p className="text-sm font-semibold text-primary mt-1">+${(data?.totalIncome || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.02]">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Gastos</p>
                                    <p className="text-sm font-semibold text-red-400/90 mt-1">-${(data?.totalExpenses || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <Button className="w-full mt-6 bg-transparent hover:bg-white/5 border border-white/10 text-zinc-300 transition-all font-medium text-xs tracking-wider uppercase h-10" onClick={() => setLocation("/finanzas")}>
                            Ver Finanzas
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// ─────────────────────────────────────────────────────────────
// HR Widget
// ─────────────────────────────────────────────────────────────
export function HrWidget({ data, loading }: WidgetProps) {
    const [, setLocation] = useLocation();
    const count = data?.length || 0;
    const payroll = count * 15000;

    return (
        <Card className="bg-zinc-950/40 backdrop-blur-md border-white/15 ring-1 ring-inset ring-white/10 shadow-sm h-full flex flex-col hover:bg-zinc-900/40 hover:border-white/30 transition-all duration-500">
            <CardHeader className="pb-2 border-b border-white/[0.05] mb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-[13px] uppercase tracking-widest font-semibold text-zinc-300 flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-primary/80" />
                        Recursos Humanos
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-50 hover:opacity-100 hover:bg-white/5" onClick={() => setLocation("/equipo")}>
                        <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </Button>
                </div>
                <CardDescription className="text-xs text-zinc-500 mt-1">Personal activo y nómina</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2"><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-24" /></div>
                            <div className="flex flex-col items-end space-y-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-3 w-24" /></div>
                        </div>
                        <div className="flex -space-x-2 overflow-hidden mt-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-8 rounded-full" />)}
                        </div>
                        <Skeleton className="h-10 w-full mt-6" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-display font-medium text-zinc-50 tracking-tight">{count}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Total Empleados</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-medium text-primary">${payroll.toLocaleString()}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Nómina Mensual</p>
                                </div>
                            </div>

                            <div className="flex -space-x-2 overflow-hidden bg-white/[0.02] p-4 rounded-xl border border-white/[0.02]">
                                {data?.slice(0, 5).map((member: any, i: number) => (
                                    <div key={i} className="inline-flex h-8 w-8 rounded-full ring-2 ring-[#09090b] bg-white/10 items-center justify-center text-[10px] font-bold text-white">
                                        {member.name?.charAt(0) ?? "?"}
                                    </div>
                                ))}
                                {count > 5 && (
                                    <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-[#09090b] bg-white/5 items-center justify-center text-[10px] text-muted-foreground">
                                        +{count - 5}
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button className="w-full mt-6 bg-transparent hover:bg-white/5 border border-white/10 text-zinc-300 transition-all font-medium text-xs tracking-wider uppercase h-10" onClick={() => setLocation("/equipo")}>
                            Ver Empleados
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// ─────────────────────────────────────────────────────────────
// Strategic Insights (internal)
// ─────────────────────────────────────────────────────────────
function StrategicInsights({ moduleName, data }: { moduleName: string, data: any }) {
    const insights = useMemo(() => {
        if (!data) return [];

        switch (moduleName) {
            case 'finance': {
                const income = data.totalIncome || 0;
                const expenses = data.totalExpenses || 0;
                const margin = income > 0 ? ((income - expenses) / income) * 100 : 0;

                let burnRate = 0;
                if (data.monthlyData && data.monthlyData.length > 0) {
                    const totalMonthlyExpenses = data.monthlyData.reduce((acc: number, m: any) => acc + (Number(m.expenses) || 0), 0);
                    burnRate = totalMonthlyExpenses / data.monthlyData.length;
                }

                return [
                    { label: "Margen de Beneficio (Profit Margin)", value: `${margin.toFixed(1)}%`, highlight: margin >= 20 },
                    { label: "Burn Rate (Gasto Promedio Mensual)", value: `$${burnRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: false },
                    { label: "Eficiencia de Capital", value: income > expenses ? 'Saludable' : 'Riesgo', highlight: income > expenses }
                ];
            }
            case 'leads': {
                if (!Array.isArray(data) || data.length === 0) return [];

                const won = data.filter((l: any) => l.status === 'Won' || l.status === 'Converted').length;
                const lost = data.filter((l: any) => l.status === 'Lost').length;
                const totalResolved = won + lost;
                const winRate = totalResolved > 0 ? (won / totalResolved) * 100 : 0;

                const valueOfActive = data
                    .filter((l: any) => l.status !== 'Won' && l.status !== 'Lost')
                    .reduce((acc: number, curr: any) => acc + (Number(curr.estimatedValue) || 0), 0);

                const origins = data.reduce((acc: Record<string, number>, curr: any) => {
                    const origin = curr.origin || 'Desconocido';
                    acc[origin] = (acc[origin] || 0) + 1;
                    return acc;
                }, {});
                const topOrigin = Object.entries(origins).sort((a: any, b: any) => b[1] - a[1])[0];

                return [
                    { label: "Win Rate (Tasa de Cierre)", value: `${winRate.toFixed(1)}%`, highlight: winRate >= 20 },
                    { label: "Valor del Pipeline (Leads Activos)", value: `$${valueOfActive.toLocaleString()}`, highlight: true },
                    { label: "Mejor Canal de Adquisición", value: topOrigin ? `${topOrigin[0]} (${topOrigin[1]})` : 'N/A', highlight: false }
                ];
            }
            case 'projects': {
                if (!Array.isArray(data) || data.length === 0) return [];

                const avgTicket = data.reduce((acc: number, curr: any) => acc + (Number(curr.budget) || 0), 0) / data.length;
                const highValueProjects = data.filter((p: any) => (Number(p.budget) || 0) > avgTicket).length;

                return [
                    { label: "Ticket Promedio (Proyectos Activos)", value: `$${avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: true },
                    { label: "Oportunidades High-Ticket", value: `${highValueProjects} proyectos`, highlight: highValueProjects > 0 },
                    { label: "Health Score General", value: "Estable", highlight: true }
                ];
            }
            case 'hr': {
                if (!Array.isArray(data) || data.length === 0) return [];

                const totalPayroll = data.reduce((acc: number, curr: any) => acc + (Number(curr.monthlySalary) || 0), 0);
                const avgPayroll = data.length > 0 ? totalPayroll / data.length : 0;
                const activeTeam = data.filter((e: any) => e.employeeStatus !== 'Inactivo' && e.status !== 'Inactive').length;

                return [
                    { label: "Fuerza Laboral Activa", value: `${activeTeam} personas`, highlight: true },
                    { label: "Masa Salarial Base (Mensual)", value: `$${totalPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: false },
                    { label: "Sueldo Promedio", value: `$${avgPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: false }
                ];
            }
            default:
                return [];
        }
    }, [data, moduleName]);

    if (!insights || insights.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {insights.map((insight: any, idx: number) => (
                <div key={idx} className={`p-5 rounded-2xl border flex flex-col justify-center transition-all duration-300 ${insight.highlight ? 'border-primary/20 bg-primary/[0.03]' : 'border-white/5 bg-zinc-950/50'}`}>
                    <span className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-widest font-medium">{insight.label}</span>
                    <span className={`text-2xl font-display font-medium tracking-tight ${insight.highlight ? 'text-primary' : 'text-zinc-50'}`}>{insight.value}</span>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// KPI Details Dialog (AI Summary)
// ─────────────────────────────────────────────────────────────
interface SummaryUiError {
    title: string;
    description: string;
    retryable: boolean;
}

function hasDataForSummary(data: any): boolean {
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === "object") return Object.keys(data).length > 0;
    return true;
}

function mapSummaryError(error: unknown): SummaryUiError {
    if (error instanceof SummaryRequestError) {
        switch (error.code) {
            case "AI_AUTH_MISCONFIGURED":
            case "AI_AUTH_FAILED":
                return { title: "Configuracion de IA incompleta", description: error.details || "Configura una API key valida para xAI / Grok antes de generar resumenes.", retryable: false };
            case "AI_PROVIDER_MISMATCH":
                return { title: "Proveedor de IA mal configurado", description: error.details || "El modelo y la base URL configurados no coinciden con xAI / Grok.", retryable: false };
            case "AI_PROVIDER_UNAVAILABLE":
            case "AI_UPSTREAM_ERROR":
                return { title: "Proveedor no disponible", description: error.details || "El proveedor de IA no esta disponible en este momento. Intenta de nuevo en unos minutos.", retryable: true };
            case "AI_RATE_LIMITED":
                return { title: "Limite temporal alcanzado", description: error.details || "Se alcanzo el limite temporal del proveedor de IA. Espera un momento y reintenta.", retryable: true };
            case "AI_TIMEOUT":
                return { title: "Tiempo de espera agotado", description: error.details || "La IA tardo demasiado en responder. Puedes intentar nuevamente.", retryable: true };
            case "SUMMARY_PAYLOAD_TOO_LARGE":
                return { title: "Demasiados datos para resumir", description: error.details || "El conjunto de datos es demasiado grande para una sola solicitud de resumen.", retryable: false };
            case "SUMMARY_EMPTY_DATA":
                return { title: "Sin datos", description: error.details || "No hay informacion suficiente para generar un resumen.", retryable: false };
            default:
                return { title: "Error de IA", description: error.details || error.message || "Hubo un problema contactando al agente.", retryable: error.retryable };
        }
    }
    if (error instanceof Error) {
        return { title: "Error de IA", description: error.message || "Hubo un problema contactando al agente.", retryable: true };
    }
    return { title: "Error de IA", description: "Ocurrio un error inesperado al generar el resumen.", retryable: true };
}

interface KpiDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    data: any;
    moduleName: SummaryModule;
}

export function KpiDetailsDialog({ isOpen, onClose, title, description, data, moduleName }: KpiDetailsDialogProps) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [summaryError, setSummaryError] = useState<SummaryUiError | null>(null);

    const hasData = useMemo(() => hasDataForSummary(data), [data]);

    const {
        data: aiHealth,
        isLoading: isCheckingAi,
        isError: failedToCheckAi,
        refetch: refetchAiHealth,
    } = useQuery({
        queryKey: ["agent-summary-health"],
        queryFn: fetchAiSummaryHealth,
        staleTime: 60_000,
        enabled: isOpen,
    });

    const availabilityError = useMemo<SummaryUiError | null>(() => {
        if (failedToCheckAi) {
            return { title: "No se pudo verificar la IA", description: "No fue posible validar la disponibilidad del proveedor de IA en este momento.", retryable: true };
        }
        if (aiHealth && !aiHealth.available) {
            return { title: "IA no disponible", description: aiHealth.issues[0] || "La configuracion de IA no esta lista para generar resumenes.", retryable: false };
        }
        return null;
    }, [aiHealth, failedToCheckAi]);

    const handleGenerateSummary = async () => {
        if (!hasData) {
            const emptyDataError = { title: "Sin datos", description: "No hay informacion suficiente para generar un resumen.", retryable: false };
            setSummaryError(emptyDataError);
            toast({ title: emptyDataError.title, description: emptyDataError.description, variant: "destructive" });
            return;
        }
        if (availabilityError) {
            setSummaryError(availabilityError);
            toast({ title: availabilityError.title, description: availabilityError.description, variant: "destructive" });
            return;
        }
        setSummaryError(null);
        setIsGenerating(true);
        try {
            const result = await generateSummary(moduleName, data);
            setSummary(result.summary);
            toast({ title: "Resumen generado", description: "La IA genero el analisis exitosamente." });
        } catch (error: unknown) {
            const nextError = mapSummaryError(error);
            setSummaryError(nextError);
            toast({ title: nextError.title, description: nextError.description, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const chartData = useMemo(() => {
        if (!hasData) return [];

        if (moduleName === 'finance') {
            if (data.monthlyData && Array.isArray(data.monthlyData)) {
                return data.monthlyData.map((m: any) => {
                    const d = parseISO(m.month);
                    const label = isNaN(d.valueOf()) ? m.month : format(d, 'MMM', { locale: es });
                    return {
                        name: label.charAt(0).toUpperCase() + label.slice(1),
                        Ingresos: m.income,
                        Gastos: m.expenses,
                    };
                });
            }
            return [];
        }

        const now = new Date();
        const months = Array.from({ length: 6 }).map((_, i) => startOfMonth(subMonths(now, 5 - i)));

        const grouped = months.map(month => {
            const monthStr = format(month, 'MMM', { locale: es });
            return {
                name: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
                dateStr: month.toISOString(),
                Total: 0,
            };
        });

        if (Array.isArray(data)) {
            data.forEach((item: any) => {
                const dateRaw = item.createdAt || item.startDate;
                if (!dateRaw) return;
                const dateObj = new Date(dateRaw);
                if (isNaN(dateObj.getTime())) return;
                const itemMonthStr = format(startOfMonth(dateObj), 'MMM', { locale: es }).toLowerCase();
                const matchIndex = grouped.findIndex(g => g.name.toLowerCase() === itemMonthStr);
                if (matchIndex !== -1) {
                    grouped[matchIndex].Total += 1;
                }
            });
        }

        return grouped;
    }, [data, hasData, moduleName]);

    const renderChart = () => {
        if (chartData.length === 0) return null;

        const commonProps = {
            data: chartData,
            margin: { top: 10, right: 10, left: -20, bottom: 0 }
        };

        const renderXAxis = <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} dy={10} />;
        const renderYAxis = <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value: any) => `${value}`} />;
        const renderTooltip = <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)', padding: '12px 16px' }} itemStyle={{ color: '#fafafa', fontSize: '13px', paddingTop: '4px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />;

        return (
            <div className="h-64 mt-4 w-full mb-8 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    {moduleName === 'finance' ? (
                        <LineChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            {renderXAxis}
                            {renderYAxis}
                            {renderTooltip}
                            <Line type="monotone" dataKey="Ingresos" stroke="#4ade80" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#4ade80' }} />
                            <Line type="monotone" dataKey="Gastos" stroke="#f87171" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#f87171' }} />
                        </LineChart>
                    ) : moduleName === 'leads' ? (
                        <AreaChart {...commonProps}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            {renderXAxis}
                            {renderYAxis}
                            {renderTooltip}
                            <Area type="monotone" dataKey="Total" stroke="#d4af37" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 5, strokeWidth: 0, fill: '#d4af37' }} />
                        </AreaChart>
                    ) : moduleName === 'projects' ? (
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            {renderXAxis}
                            {renderYAxis}
                            {renderTooltip}
                            <Bar dataKey="Total" fill="#d4af37" opacity={0.8} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    ) : (
                        <LineChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            {renderXAxis}
                            {renderYAxis}
                            {renderTooltip}
                            <Line type="stepAfter" dataKey="Total" stroke="#a1a1aa" strokeWidth={2} dot={{ r: 3, fill: '#09090b', strokeWidth: 2, stroke: '#a1a1aa' }} activeDot={{ r: 5, fill: '#d4af37', strokeWidth: 0 }} />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) { onClose(); setSummary(null); setSummaryError(null); }
        }}>
            <DialogContent className="max-w-4xl bg-[#09090b]/95 border-border/40 shadow-2xl backdrop-blur-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 shrink-0 flex items-between">
                    <div>
                        <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight">{title}</DialogTitle>
                        <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight">{title}</DialogTitle>
                        <DialogDescription className="text-muted-foreground/80">{description}</DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-4 space-y-6">
                    {chartData.length > 0 && renderChart()}
                    <StrategicInsights moduleName={moduleName} data={data} />

                    {!summary ? (
                        <div className="flex flex-col items-center justify-center p-12 border border-white/[0.04] rounded-2xl bg-white/[0.01] space-y-6">
                            <div className="p-4 bg-primary/[0.08] rounded-full border border-primary/[0.1]">
                                <Sparkles className="h-8 w-8 text-primary/90" />
                            </div>
                            <p className="text-[15px] text-center text-muted-foreground w-full max-w-lg leading-relaxed">
                                Haz clic en el botón de abajo para que nuestro agente analice el histórico y datos actuales de este módulo y te genere un reporte ejecutivo instantáneo.
                            </p>

                            {(availabilityError || summaryError) && (
                                <Alert variant="destructive" className="w-full max-w-2xl bg-destructive/10 border-destructive/40 text-left text-white">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>{(availabilityError || summaryError)?.title}</AlertTitle>
                                    <AlertDescription>{(availabilityError || summaryError)?.description}</AlertDescription>
                                </Alert>
                            )}

                            {isCheckingAi && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Verificando disponibilidad del proveedor de IA...
                                </div>
                            )}

                            <div className="flex flex-wrap justify-center gap-3">
                                <Button
                                    onClick={handleGenerateSummary}
                                    disabled={isGenerating || isCheckingAi || !hasData || Boolean(availabilityError)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all duration-300 transform hover:scale-105"
                                >
                                    {isGenerating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analizando datos...</>
                                    ) : (
                                        <>{summaryError?.retryable ? 'Reintentar resumen' : 'Crear Resumen con IA'}</>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => { setSummaryError(null); refetchAiHealth(); }}
                                    disabled={isCheckingAi}
                                    className="border-white/10 bg-transparent"
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${isCheckingAi ? 'animate-spin' : ''}`} />
                                    Revisar Disponibilidad
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 rounded-2xl bg-zinc-950/40 backdrop-blur-md border border-white/5 shadow-inner mt-4">
                            <h3 className="text-xs font-semibold text-primary/90 mb-6 uppercase tracking-widest flex items-center gap-2">
                                <span className="p-1 rounded-md bg-primary/10">
                                    <Sparkles className="h-3 w-3" />
                                </span>
                                Resumen Ejecutivo
                            </h3>
                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:text-zinc-300 prose-li:marker:text-primary/50">
                                <ReactMarkdown>{summary}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
