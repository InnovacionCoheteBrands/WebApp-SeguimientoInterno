
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
    Wallet
} from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

// --- Types ---
interface WidgetProps {
    className?: string;
    data?: any;
    loading?: boolean;
}

// --- Quick Actions Component ---
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

// --- KPI Card Component ---
interface KpiCardProps {
    title: string;
    value: string;
    subValue?: string;
    icon: any;
    trend?: string;
    trendUp?: boolean;
    color?: "blue" | "green" | "amber" | "purple";
}

export function KpiCard({ title, value, subValue, icon: Icon, trend, trendUp, color = "green" }: KpiCardProps) {
    const getColors = (c: string) => {
        switch (c) {
            case "blue": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            case "green": return "text-green-500 bg-green-500/10 border-green-500/20";
            case "amber": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            case "purple": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
            default: return "text-green-500 bg-green-500/10 border-green-500/20";
        }
    };

    const colors = getColors(color);

    return (
        <Card className="bg-card/50 border-border relative overflow-hidden group hover:border-sidebar-primary/50 transition-colors">
            {/* Top Gradient Line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-${color}-500/50 to-transparent`} />

            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${colors}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {trend && (
                        <Badge variant="outline" className={`bg-transparent border-border text-xs ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                            {trend}
                        </Badge>
                    )}
                </div>

                <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight tabular-nums">{value}</h3>
                    <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
                    {subValue && (
                        <p className="text-xs text-muted-foreground/60 font-mono">{subValue}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// --- Widget: CRM / Leads ---
export function CrmWidget({ data, loading }: WidgetProps) {
    const [, setLocation] = useLocation();
    const leads = data?.leads || [];
    const metrics = data?.metrics || {};

    return (
        <Card className="bg-card/50 border-border h-full flex flex-col hover:border-white/10 transition-colors">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        CRM - Pipeline
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setLocation("/crm")}>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
                <CardDescription className="text-xs text-muted-foreground">Progreso de ventas y prospectos</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-4">
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-1.5 w-full mt-4" />
                        <Skeleton className="h-10 w-full mt-6" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-bold text-foreground">{metrics.total || 0}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Leads</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-500">${(metrics.avgValue || 0).toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Valor Estimado</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Conversión</span>
                                    <span>{metrics.conversionRate || 0}%</span>
                                </div>
                                <Progress value={metrics.conversionRate || 0} className="h-1.5" />
                            </div>
                        </div>

                        <Button className="w-full mt-6 bg-blue-600/20 hover:bg-blue-600/30 text-blue-500 hover:text-blue-400 border border-blue-600/20" onClick={() => setLocation("/crm")}>
                            Ver CRM Completo
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// --- Widget: Projects ---
export function ProjectsWidget({ data, loading }: WidgetProps) {
    const [, setLocation] = useLocation();
    const activeCount = data?.length || 0;
    // Calculate total budget if available, otherwise mock
    const totalBudget = data?.reduce((acc: number, curr: any) => acc + (curr.budget || 0), 0) || 0;

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            "active": "En Desarrollo",
            "planning": "Planificación",
            "on_hold": "Pausa",
            "completed": "Terminado",
            "cancelled": "Cancelado"
        };
        return map[status] || status;
    };

    return (
        <Card className="bg-card/50 border-border h-full flex flex-col hover:border-white/10 transition-colors">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-amber-500" />
                        Gestión de Proyectos
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setLocation("/proyectos")}>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
                <CardDescription className="text-xs text-muted-foreground">Proyectos activos y entregables</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-4">
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="space-y-3 mt-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full mt-6" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-bold text-foreground">{activeCount}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Proyectos Activos</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-amber-500">${totalBudget.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Cotización Total</p>
                                </div>
                            </div>

                            {/* Mini List of recent projects */}
                            <div className="space-y-3 mt-2">
                                {data?.slice(0, 3).map((proj: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="text-foreground/80 truncate max-w-[180px]">{proj.name}</span>
                                        <Badge variant="outline" className="text-[10px] h-5 border-border text-muted-foreground">{getStatusLabel(proj.status)}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button className="w-full mt-6 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 hover:text-amber-400 border border-amber-600/20" onClick={() => setLocation("/proyectos")}>
                            Ver Proyectos
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// --- Widget: Finance ---
export function FinanceWidget({ data, loading }: WidgetProps) {
    const [, setLocation] = useLocation();
    const balance = data?.netProfit || 0;
    // This would come from real transaction count in a perfect world
    const txCount = 124;

    return (
        <Card className="bg-card/50 border-border h-full flex flex-col hover:border-white/10 transition-colors">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-green-500" />
                        Estado Financiero
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setLocation("/finanzas")}>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
                <CardDescription className="text-xs text-muted-foreground">Balance general y flujo de caja</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-4">
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full mt-6" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-bold text-foreground">${balance.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Balance Actual</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="bg-white/[0.03] p-2 rounded">
                                    <p className="text-[10px] text-muted-foreground uppercase">Ingresos</p>
                                    <p className="text-sm font-medium text-green-500">+${data?.totalIncome?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-white/[0.03] p-2 rounded">
                                    <p className="text-[10px] text-muted-foreground uppercase">Gastos</p>
                                    <p className="text-sm font-medium text-red-500">-${data?.totalExpenses?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                        </div>

                        <Button className="w-full mt-6 bg-green-600/20 hover:bg-green-600/30 text-green-500 hover:text-green-400 border border-green-600/20" onClick={() => setLocation("/finanzas")}>
                            Ver Finanzas
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// --- Widget: HR ---
export function HrWidget({ data, loading }: WidgetProps) {
    const [, setLocation] = useLocation();
    const count = data?.length || 0;
    // Mock payroll calculation if not in data
    const payroll = count * 15000;

    return (
        <Card className="bg-card/50 border-border h-full flex flex-col hover:border-white/10 transition-colors">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        Recursos Humanos
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setLocation("/equipo")}>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
                <CardDescription className="text-xs text-muted-foreground">Personal activo y nómina</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-4">
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="flex -space-x-2 overflow-hidden mt-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-8 rounded-full" />)}
                        </div>
                        <Skeleton className="h-10 w-full mt-6" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-bold text-foreground">{count}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Empleados</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-purple-500">${payroll.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Nómina Mensual</p>
                                </div>
                            </div>

                            <div className="flex -space-x-2 overflow-hidden mt-4">
                                {data?.slice(0, 5).map((member: any, i: number) => (
                                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-[#09090b] bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                                        {member.name.charAt(0)}
                                    </div>
                                ))}
                                {count > 5 && (
                                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#09090b] bg-white/5 flex items-center justify-center text-[10px] text-muted-foreground">
                                        +{count - 5}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button className="w-full mt-6 bg-purple-600/20 hover:bg-purple-600/30 text-purple-500 hover:text-purple-400 border border-purple-600/20" onClick={() => setLocation("/equipo")}>
                            Ver Empleados
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
