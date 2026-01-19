import { memo, useState } from "react";
import { Link } from "wouter";
import { Globe, Server, Shield, Mail, AlertTriangle, ExternalLink, Calendar, Plus, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchExpiringDigitalAssets, fetchDigitalAssetsByClient } from "@/lib/api";
import type { DigitalAsset } from "@shared/schema";
import { format, differenceInDays } from "date-fns";
import { MobileFAB } from "@/components/mobile-fab";

// Reuse the component logic but for a global view
const DigitalAssetsPage = memo(function DigitalAssetsPage() {
    const [daysFilter, setDaysFilter] = useState(60);

    // Fetch expiring assets
    const { data: expiringAssets = [], isLoading } = useQuery({
        queryKey: ["digital-assets", "expiring", daysFilter],
        queryFn: () => fetchExpiringDigitalAssets(daysFilter),
    });

    const getIcon = (type: string) => {
        switch (type) {
            case "domain": return <Globe className="size-5 text-blue-500" />;
            case "hosting": return <Server className="size-5 text-purple-500" />;
            case "ssl": return <Shield className="size-5 text-green-500" />;
            case "email": return <Mail className="size-5 text-orange-500" />;
            default: return <Globe className="size-5" />;
        }
    };

    const getDaysRemaining = (date: string) => {
        return differenceInDays(new Date(date), new Date());
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-3 sm:p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="p-2 bg-primary/10 rounded-sm">
                            <Globe className="size-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Digital & Hosting</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                                Monitor de Vencimientos y Activos
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-sm border border-border">
                        <Button
                            variant={daysFilter === 30 ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setDaysFilter(30)}
                            className="text-xs h-8 rounded-sm"
                        >
                            30 Días
                        </Button>
                        <Button
                            variant={daysFilter === 60 ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setDaysFilter(60)}
                            className="text-xs h-8 rounded-sm"
                        >
                            60 Días
                        </Button>
                        <Button
                            variant={daysFilter === 90 ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setDaysFilter(90)}
                            className="text-xs h-8 rounded-sm"
                        >
                            90 Días
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="rounded-sm border-l-4 border-l-red-500 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="size-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-mono uppercase">Vencen en 30 días</p>
                                <p className="text-2xl font-bold">
                                    {expiringAssets.filter(a => a.expirationDate && getDaysRemaining(a.expirationDate.toString()) <= 30).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm border-l-4 border-l-yellow-500 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="size-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <Calendar className="size-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-mono uppercase">Vencen en 60 días</p>
                                <p className="text-2xl font-bold">
                                    {expiringAssets.filter(a => {
                                        if (!a.expirationDate) return false;
                                        const days = getDaysRemaining(a.expirationDate.toString());
                                        return days > 30 && days <= 60;
                                    }).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm border-l-4 border-l-blue-500 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <RefreshCw className="size-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-mono uppercase">Auto-Renovación</p>
                                <p className="text-2xl font-bold">
                                    {expiringAssets.filter(a => a.autoRenew).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm border-l-4 border-l-purple-500 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Layers className="size-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-mono uppercase">Total en Riesgo</p>
                                <p className="text-2xl font-bold">{expiringAssets.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Alert List */}
                <div className="grid gap-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="size-5 text-foreground" />
                        Próximos Vencimientos
                    </h2>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-muted/40 animate-pulse rounded-sm" />
                            ))}
                        </div>
                    ) : expiringAssets.length === 0 ? (
                        <Card className="rounded-sm bg-muted/20 border-border border-dashed">
                            <CardContent className="p-8 text-center">
                                <Shield className="size-10 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-medium">¡Todo en órden!</h3>
                                <p className="text-muted-foreground">No hay activos próximos a vencer en los siguientes {daysFilter} días.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        expiringAssets.map((asset: any) => { // Using any for joined query result typing
                            if (!asset.expirationDate) return null;
                            const days = getDaysRemaining(asset.expirationDate);
                            const isUrgent = days <= 30;

                            return (
                                <Card
                                    key={asset.id}
                                    className={`rounded-sm border-l-4 transition-all hover:shadow-md ${isUrgent ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/20" : "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
                                        }`}
                                >
                                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className={`text-xs ${isUrgent ? 'text-red-500 border-red-200' : 'text-yellow-600 border-yellow-200'}`}>
                                                    {days < 0 ? `Venció hace ${Math.abs(days)} días` : `Vence en ${days} días`}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="size-3" />
                                                    {format(new Date(asset.expirationDate), "dd MMM yyyy")}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {getIcon(asset.type)}
                                                <h3 className="text-lg font-bold">{asset.name}</h3>
                                            </div>

                                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground pl-8">
                                                <span className="flex items-center gap-1">
                                                    <Layers className="size-3" />
                                                    {asset.clientName}
                                                </span>
                                                <span>{asset.provider}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pl-8 sm:pl-0">
                                            <Link href={`/clientes/${asset.clientId}`}>
                                                <Button variant="outline" size="sm" className="rounded-sm w-full sm:w-auto bg-background">
                                                    Gestionar
                                                    <ExternalLink className="size-3 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
});

export default DigitalAssetsPage;
