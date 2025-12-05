import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, BarChart3, AlertTriangle, CheckCircle, Target, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AdsOverview {
    blendedROAS: {
        roas: number;
        totalSpend: number;
        totalRevenue: number;
    };
    spendPacing: {
        monthlyBudget: number;
        currentSpend: number;
        percentSpent: number;
        percentElapsed: number;
        status: "healthy" | "warning" | "critical";
        daysRemaining: number;
    };
    platformBreakdown: Array<{
        platformId: number;
        platformName: string;
        displayName: string;
        totalSpend: number;
        totalRevenue: number;
        roas: number;
        activeCreatives: number;
        isActive: boolean;
    }>;
    lastUpdated: string;
}

interface AdCreative {
    id: number;
    platformId: number;
    platformAdId: string;
    creativeType: string;
    imageUrl: string | null;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    headline: string | null;
    primaryText: string | null;
    ctaText: string | null;
    status: string;
    metrics: {
        impressions: number;
        clicks: number;
        conversions: number;
        spend: string;
        revenue: string;
        ctr: string;
        cpa: string;
        roas: string;
    };
}

export default function AdsCommandCenter() {
    const { data: overview, isLoading: overviewLoading } = useQuery<AdsOverview>({
        queryKey: ["ads-overview"],
        queryFn: async () => {
            const res = await fetch("/api/ads/overview");
            if (!res.ok) throw new Error("Failed to fetch ads overview");
            return res.json();
        },
        refetchInterval: 30000,
    });

    const { data: topCreatives, isLoading: topLoading } = useQuery<AdCreative[]>({
        queryKey: ["ads-top-creatives"],
        queryFn: async () => {
            const res = await fetch("/api/ads/creatives/top?limit=3");
            if (!res.ok) throw new Error("Failed to fetch top creatives");
            return res.json();
        },
        refetchInterval: 60000,
    });

    const { data: bottomCreatives, isLoading: bottomLoading } = useQuery<AdCreative[]>({
        queryKey: ["ads-bottom-creatives"],
        queryFn: async () => {
            const res = await fetch("/api/ads/creatives/bottom?limit=3");
            if (!res.ok) throw new Error("Failed to fetch bottom creatives");
            return res.json();
        },
        refetchInterval: 60000,
    });

    if (overviewLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                        Cargando datos publicitarios...
                    </p>
                </div>
            </div>
        );
    }

    const pacingStatusConfig = {
        healthy: { color: "text-green-500", icon: CheckCircle, label: "Saludable" },
        warning: { color: "text-amber-500", icon: AlertTriangle, label: "Alerta" },
        critical: { color: "text-red-500", icon: AlertTriangle, label: "Crítico" },
    };

    const pacingConfig = overview ? pacingStatusConfig[overview.spendPacing.status] : pacingStatusConfig.healthy;
    const PacingIcon = pacingConfig.icon;

    const totalPlatforms = overview?.platformBreakdown.length || 0;
    const activePlatforms = overview?.platformBreakdown.filter(p => p.isActive).length || 0;

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold tracking-tight uppercase">
                        Ads Command Center
                    </h1>
                    <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                        Centro de comando publicitario
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {overview && (
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Última actualización</p>
                            <p className="text-xs text-muted-foreground/70 font-mono">
                                {new Date(overview.lastUpdated).toLocaleTimeString()}
                            </p>
                        </div>
                    )}
                    <Link href="/ads/settings">
                        <Button variant="outline" size="icon" className="rounded-sm h-11 w-11">
                            <Settings className="size-5" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Cards - Siguiendo el patrón de Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Blended ROAS */}
                <Card className="border-border bg-card/50 rounded-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Blended ROAS</span>
                            <TrendingUp className="size-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-display font-bold tracking-tight">
                                {overview?.blendedROAS.roas.toFixed(2) || "0.00"}x
                            </h3>
                            <p className="text-xs text-muted-foreground">Retorno Combinado</p>
                            <p className="text-xs text-primary">+{overview?.blendedROAS.totalRevenue.toFixed(0) || "0"} ingresos</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Spend */}
                <Card className="border-border bg-card/50 rounded-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Gasto Total</span>
                            <DollarSign className="size-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-display font-bold tracking-tight">
                                ${overview?.blendedROAS.totalSpend.toFixed(0) || "0"}
                            </h3>
                            <p className="text-xs text-muted-foreground">Inversión Publicitaria</p>
                            <p className="text-xs text-primary">{overview?.spendPacing.percentSpent.toFixed(0) || "0"}% del presupuesto</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Ritmo de Gasto */}
                <Card className="border-border bg-card/50 rounded-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Ritmo de Gasto</span>
                            <PacingIcon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-display font-bold tracking-tight">
                                {overview?.spendPacing.percentElapsed.toFixed(0) || "0"}%
                            </h3>
                            <p className="text-xs text-muted-foreground">Mes Transcurrido</p>
                            <p className={`text-xs ${pacingConfig.color}`}>{pacingConfig.label}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Plataformas Activas */}
                <Card className="border-border bg-card/50 rounded-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Plataformas</span>
                            <BarChart3 className="size-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-display font-bold tracking-tight">
                                {activePlatforms}/{totalPlatforms}
                            </h3>
                            <p className="text-xs text-muted-foreground">Activas</p>
                            <p className="text-xs text-primary">{overview?.platformBreakdown.reduce((sum, p) => sum + p.activeCreatives, 0) || 0} anuncios</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Breakdown */}
            <Card className="border-border bg-card/50 rounded-sm">
                <CardContent className="p-3 sm:p-6">
                    <div className="mb-4">
                        <h2 className="text-base sm:text-lg font-display uppercase">Desglose por Plataforma</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {overview?.platformBreakdown.map((platform) => (
                            <div
                                key={platform.platformId}
                                className="p-4 rounded-sm border border-border hover:border-primary/50 transition-all"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-sm">{platform.displayName}</h3>
                                    {platform.isActive ? (
                                        <Badge variant="outline" className="text-green-500 border-green-500 text-xs rounded-sm">
                                            Activo
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground text-xs rounded-sm">
                                            Inactivo
                                        </Badge>
                                    )}
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ROAS</span>
                                        <span className="font-mono font-semibold text-primary">
                                            {platform.roas.toFixed(2)}x
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Gastado</span>
                                        <span className="font-mono">${platform.totalSpend.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Generado</span>
                                        <span className="font-mono">${platform.totalRevenue.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-border/50">
                                        <span className="text-muted-foreground">Ads Activos</span>
                                        <span className="font-mono">{platform.activeCreatives}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Top Performers & Underperformers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Top Performers */}
                <Card className="border-border bg-card/50 rounded-sm">
                    <CardContent className="p-3 sm:p-6">
                        <h2 className="text-base sm:text-lg font-display uppercase mb-4 flex items-center gap-2">
                            <span className="text-green-500">🏆</span> Top Performers
                        </h2>
                        <div className="space-y-3">
                            {topLoading ? (
                                <p className="text-muted-foreground text-sm text-center py-8">Cargando...</p>
                            ) : topCreatives && topCreatives.length > 0 ? (
                                topCreatives.map((creative, index) => (
                                    <div
                                        key={creative.id}
                                        className="p-3 rounded-sm border border-green-500/30 hover:border-green-500/50 transition-all"
                                    >
                                        <div className="flex gap-3">
                                            <div className="relative size-16 rounded-sm overflow-hidden flex-shrink-0 bg-muted">
                                                {creative.thumbnailUrl || creative.imageUrl ? (
                                                    <img
                                                        src={creative.thumbnailUrl || creative.imageUrl || ""}
                                                        alt={creative.headline || "Ad"}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <Target className="size-6" />
                                                    </div>
                                                )}
                                                <div className="absolute top-1 left-1 bg-background/90 rounded-sm size-5 flex items-center justify-center text-xs font-bold font-mono">
                                                    #{index + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-sm mb-1 truncate">{creative.headline || "Sin título"}</h3>
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div>
                                                        <p className="text-muted-foreground font-mono">CTR</p>
                                                        <p className="font-mono font-semibold">{creative.metrics.ctr}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground font-mono">CPA</p>
                                                        <p className="font-mono font-semibold">${creative.metrics.cpa}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground font-mono">ROAS</p>
                                                        <p className="font-mono font-semibold text-green-500">{creative.metrics.roas}x</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground text-sm">No hay datos de anuncios top disponibles</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Necesitan Atención */}
                <Card className="border-border bg-card/50 rounded-sm">
                    <CardContent className="p-3 sm:p-6">
                        <h2 className="text-base sm:text-lg font-display uppercase mb-4 flex items-center gap-2">
                            <span className="text-red-500">⚠️</span> Necesitan Atención
                        </h2>
                        <div className="space-y-3">
                            {bottomLoading ? (
                                <p className="text-muted-foreground text-sm text-center py-8">Cargando...</p>
                            ) : bottomCreatives && bottomCreatives.length > 0 ? (
                                bottomCreatives.map((creative, index) => (
                                    <div
                                        key={creative.id}
                                        className="p-3 rounded-sm border border-red-500/30 hover:border-red-500/50 transition-all"
                                    >
                                        <div className="flex gap-3">
                                            <div className="relative size-16 rounded-sm overflow-hidden flex-shrink-0 bg-muted">
                                                {creative.thumbnailUrl || creative.imageUrl ? (
                                                    <img
                                                        src={creative.thumbnailUrl || creative.imageUrl || ""}
                                                        alt={creative.headline || "Ad"}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <AlertTriangle className="size-6" />
                                                    </div>
                                                )}
                                                <div className="absolute top-1 left-1 bg-background/90 rounded-sm size-5 flex items-center justify-center text-xs font-bold font-mono">
                                                    #{index + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-sm mb-1 truncate">{creative.headline || "Sin título"}</h3>
                                                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                                                    <div>
                                                        <p className="text-muted-foreground font-mono">CTR</p>
                                                        <p className="font-mono font-semibold">{creative.metrics.ctr}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground font-mono">CPA</p>
                                                        <p className="font-mono font-semibold">${creative.metrics.cpa}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground font-mono">ROAS</p>
                                                        <p className="font-mono font-semibold text-red-500">{creative.metrics.roas}x</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        await fetch("/api/ads/request-review", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({
                                                                creativeId: creative.id,
                                                                reason: "Executive review requested",
                                                                requestedBy: "Executive Dashboard",
                                                            }),
                                                        });
                                                    }}
                                                    className="w-full px-2 py-1 text-xs bg-red-500/20 text-red-500 rounded-sm hover:bg-red-500/30 transition-colors font-mono uppercase"
                                                >
                                                    Solicitar Revisión
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground text-sm">No hay datos de anuncios con bajo rendimiento</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
