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
        <div className="min-h-screen bg-[#030303] text-foreground p-4 sm:p-8 font-sans selection:bg-primary/30">
            <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                        <div className="p-3.5 bg-emerald-500/10 border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <Globe className="size-8 text-emerald-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h1 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-white italic">Asset Infrastructure</h1>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                                Digital Assets & Hosting Protocol
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-950/40 backdrop-blur-xl p-1.5 rounded-[1.2rem] border border-white/10">
                        {[30, 60, 90].map((days) => (
                            <Button
                                key={days}
                                variant={daysFilter === days ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setDaysFilter(days)}
                                className={`text-[10px] font-mono uppercase tracking-widest h-9 px-5 rounded-xl transition-all ${
                                    daysFilter === days 
                                    ? "bg-white/10 text-primary border border-white/10" 
                                    : "text-muted-foreground hover:bg-white/5"
                                }`}
                            >
                                {days} Días
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group hover:bg-zinc-900/40 transition-all duration-500">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className="size-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                <AlertTriangle className="size-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Vencimiento &lt; 30D</p>
                                <p className="text-3xl font-display font-bold text-white italic tabular-nums">
                                    {expiringAssets.filter(a => a.expirationDate && getDaysRemaining(a.expirationDate.toString()) <= 30).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group hover:bg-zinc-900/40 transition-all duration-500">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className="size-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                                <Calendar className="size-6 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Vencimiento &lt; 60D</p>
                                <p className="text-3xl font-display font-bold text-white italic tabular-nums">
                                    {expiringAssets.filter(a => {
                                        if (!a.expirationDate) return false;
                                        const days = getDaysRemaining(a.expirationDate.toString());
                                        return days > 30 && days <= 60;
                                    }).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group hover:bg-zinc-900/40 transition-all duration-500">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className="size-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                <RefreshCw className="size-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Auto-Renovación</p>
                                <p className="text-3xl font-display font-bold text-white italic tabular-nums">
                                    {expiringAssets.filter(a => a.autoRenew).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group hover:bg-zinc-900/40 transition-all duration-500">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                        <CardContent className="p-8 flex items-center gap-6">
                            <div className="size-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                                <Layers className="size-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Infraestructura Total</p>
                                <p className="text-3xl font-display font-bold text-white italic tabular-nums">{expiringAssets.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Alert List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-display uppercase tracking-tight text-white italic flex items-center gap-3">
                            <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                            Strategic Critical Status
                        </h2>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-40 italic">Active expiration monitoring protocol enabled</span>
                    </div>

                    {isLoading ? (
                        <div className="grid gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-white/5 animate-pulse rounded-[2rem] border border-white/5" />
                            ))}
                        </div>
                    ) : expiringAssets.length === 0 ? (
                        <Card className="bg-zinc-950/20 border border-dashed border-white/10 rounded-[2.5rem]">
                            <CardContent className="p-20 text-center space-y-4">
                                <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 w-fit mx-auto">
                                    <Shield className="size-10 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-display text-white italic">Operational Integrity Validated</h3>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest max-w-md mx-auto opacity-60">No immediate expiration threats detected within the selected cycle. All protocols are current.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {expiringAssets.map((asset: any) => { // Using any for joined query result typing
                                if (!asset.expirationDate) return null;
                                const days = getDaysRemaining(asset.expirationDate);
                                const isUrgent = days <= 30;

                                return (
                                    <Card
                                        key={asset.id}
                                        className="bg-zinc-950/40 backdrop-blur-md border-white/10 rounded-[2rem] relative overflow-hidden group hover:bg-zinc-900/40 transition-all duration-300"
                                    >
                                        <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${isUrgent ? 'via-red-500/30' : 'via-yellow-500/30'} to-transparent`} />
                                        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <Badge
                                                        className={`h-6 rounded-full px-4 text-[9px] font-mono font-bold uppercase tracking-widest border border-white/10 ${isUrgent ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}
                                                    >
                                                        {days < 0 ? `CRITICAL: EXPIRED ${Math.abs(days)}D` : `DUE IN ${days} DAYS`}
                                                    </Badge>
                                                    <div className="flex items-center gap-2 px-3 h-6 rounded-full bg-white/5 border border-white/5 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                                                        <Calendar className="size-3 opacity-40" />
                                                        {format(new Date(asset.expirationDate), "dd . MMM . yyyy")}
                                                    </div>
                                                    {asset.autoRenew && (
                                                        <Badge className="h-6 rounded-full px-4 text-[9px] font-mono uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            Auto-Sync Active
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner`}>
                                                        {getIcon(asset.type)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-display font-medium text-white italic tracking-tight">{asset.name}</h3>
                                                        <div className="flex items-center gap-3 mt-1.5 opacity-60">
                                                            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                                                                <Layers className="size-3 opacity-40" />
                                                                {asset.clientName}
                                                            </div>
                                                            <span className="text-white/10 text-[10px]">•</span>
                                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{asset.provider}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                                                <Link href={`/clientes/${asset.clientId}`}>
                                                    <Button variant="outline" size="sm" className="h-10 rounded-full px-6 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-mono text-[10px] uppercase tracking-widest text-zinc-300">
                                                        Override System
                                                        <ExternalLink className="size-3 ml-2.5 opacity-50" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default DigitalAssetsPage;
