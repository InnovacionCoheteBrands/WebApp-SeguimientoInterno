import { memo, useState } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Building2, User, FileText, Globe, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { fetchClientAccounts, type ClientAccount } from "@/lib/api";

// Tab Components
import { ContactsTab } from "@/components/clients/contacts-tab";
import { BillingProfilesTab } from "@/components/clients/billing-profiles-tab";
import { DigitalAssetsTab } from "@/components/clients/digital-assets-tab";
import { DocumentsTab } from "@/components/clients/documents-tab";

const ClientDetail = memo(function ClientDetail() {
    const [, params] = useRoute("/clientes/:id");
    const clientId = params?.id ? parseInt(params.id) : null;

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ["client-accounts"],
        queryFn: fetchClientAccounts,
    });

    const client = clients.find((c) => c.id === clientId);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen bg-zinc-950 p-6 flex items-center justify-center">
                <Card className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl border-white/10 rounded-[2rem]">
                    <CardContent className="p-12 text-center space-y-6">
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 w-fit mx-auto">
                            <Building2 className="size-12 text-zinc-500" />
                        </div>
                        <div>
                            <p className="text-zinc-100 font-display text-lg uppercase tracking-tight">Entidad no localizada</p>
                            <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest mt-2">Invalid Asset Reference</p>
                        </div>
                        <Link href="/clientes">
                            <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 font-mono text-[10px] uppercase tracking-widest">
                                Re-Sync Repository
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-foreground p-4 sm:p-8 font-sans selection:bg-primary/30">
            <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                        <Link href="/clientes">
                            <Button variant="outline" size="icon" className="group rounded-2xl h-14 w-14 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                                <ArrowLeft className="size-6 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
                            </Button>
                        </Link>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-white italic">
                                    {client.companyName}
                                </h1>
                                <Badge
                                    className={`rounded-full px-4 h-6 text-[9px] font-mono uppercase tracking-widest border border-white/10 ${client.status === "Active"
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : client.status === "Paused"
                                                ? "bg-amber-500/10 text-amber-400"
                                                : "bg-zinc-500/10 text-zinc-400"
                                        }`}
                                >
                                    {client.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.2em] opacity-60">
                                    {client.industry}
                                </p>
                                <span className="text-white/10 text-[10px]">•</span>
                                <p className="text-[10px] font-mono text-primary/70 uppercase tracking-widest">Client Identity: #{client.id}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start bg-zinc-950/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-1.5 h-auto flex-wrap mb-8">
                        <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-primary gap-3 px-6 py-2.5 transition-all font-mono text-[10px] uppercase tracking-widest">
                            <Building2 className="size-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="contacts" className="rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-primary gap-3 px-6 py-2.5 transition-all font-mono text-[10px] uppercase tracking-widest">
                            <User className="size-4" />
                            Contactos
                        </TabsTrigger>
                        <TabsTrigger value="billing" className="rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-primary gap-3 px-6 py-2.5 transition-all font-mono text-[10px] uppercase tracking-widest">
                            <FileText className="size-4" />
                            Facturación
                        </TabsTrigger>
                        <TabsTrigger value="assets" className="rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-primary gap-3 px-6 py-2.5 transition-all font-mono text-[10px] uppercase tracking-widest">
                            <Globe className="size-4" />
                            Assets Digitales
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="rounded-xl data-[state=active]:bg-white/5 data-[state=active]:text-primary gap-3 px-6 py-2.5 transition-all font-mono text-[10px] uppercase tracking-widest">
                            <FolderOpen className="size-4" />
                            Documentos
                        </TabsTrigger>
                    </TabsList>
                    {/* General Tab */}
                    <TabsContent value="general" className="mt-0 outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 rounded-[2rem] overflow-hidden group relative">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                                <CardHeader className="p-8 pb-3">
                                    <CardTitle className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-50">Presupuesto Mensual</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <p className="text-3xl font-bold font-mono text-zinc-100 tabular-nums italic">${client.monthlyBudget.toLocaleString()}</p>
                                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-2 opacity-40">Allocated Monthly Liquidity</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 rounded-[2rem] overflow-hidden group relative">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                                <CardHeader className="p-8 pb-3">
                                    <CardTitle className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-50">Gasto Acumulado</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <p className="text-3xl font-bold font-mono text-amber-400 tabular-nums italic">${client.currentSpend.toLocaleString()}</p>
                                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-2 opacity-40">Current Fiscal Consumption</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 rounded-[2rem] overflow-hidden group relative">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                                <CardHeader className="p-8 pb-3">
                                    <CardTitle className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-50">Operational Health</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between">
                                            <p className={`text-4xl font-bold font-mono italic tabular-nums leading-none ${client.healthScore >= 80 ? "text-emerald-400" :
                                                    client.healthScore >= 50 ? "text-amber-400" : "text-red-400"
                                                }`}>
                                                {client.healthScore}%
                                            </p>
                                            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-40">Entity stability</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={`h-full transition-all duration-1000 ${client.healthScore >= 80 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" :
                                                        client.healthScore >= 50 ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                                    }`}
                                                style={{ width: `${client.healthScore}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {client.nextMilestone && (
                                <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 rounded-[2rem] md:col-span-2 lg:col-span-3 overflow-hidden group relative">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                                    <CardHeader className="p-8 pb-3">
                                        <CardTitle className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-50">Upcoming Strategic Milestone</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0">
                                        <p className="text-xl font-display text-zinc-100 italic">"{client.nextMilestone}"</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>


                    {/* Contacts Tab */}
                    <TabsContent value="contacts" className="mt-4">
                        <ContactsTab clientId={clientId!} />
                    </TabsContent>

                    {/* Billing Tab */}
                    <TabsContent value="billing" className="mt-4">
                        <BillingProfilesTab clientId={clientId!} />
                    </TabsContent>

                    {/* Digital Assets Tab */}
                    <TabsContent value="assets" className="mt-4">
                        <DigitalAssetsTab clientId={clientId!} />
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="mt-4">
                        <DocumentsTab clientId={clientId!} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
});

export default ClientDetail;
