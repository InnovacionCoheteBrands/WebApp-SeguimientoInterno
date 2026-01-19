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
            <div className="min-h-screen bg-background p-6">
                <Card className="max-w-md mx-auto">
                    <CardContent className="p-8 text-center">
                        <Building2 className="size-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Cliente no encontrado</p>
                        <Link href="/clientes">
                            <Button variant="outline">Volver a Clientes</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-3 sm:p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <Link href="/clientes">
                            <Button variant="outline" size="icon" className="rounded-sm h-11 w-11">
                                <ArrowLeft className="size-5" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                                    {client.companyName}
                                </h1>
                                <Badge
                                    variant="outline"
                                    className={`rounded-sm text-xs ${client.status === "Active"
                                            ? "text-green-500 border-green-500/30"
                                            : client.status === "Paused"
                                                ? "text-yellow-500 border-yellow-500/30"
                                                : "text-muted-foreground"
                                        }`}
                                >
                                    {client.status}
                                </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                                {client.industry}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start bg-muted/30 border border-border rounded-sm p-1 h-auto flex-wrap">
                        <TabsTrigger value="general" className="rounded-sm data-[state=active]:bg-background gap-2">
                            <Building2 className="size-4" />
                            <span className="hidden sm:inline">General</span>
                        </TabsTrigger>
                        <TabsTrigger value="contacts" className="rounded-sm data-[state=active]:bg-background gap-2">
                            <User className="size-4" />
                            <span className="hidden sm:inline">Contactos</span>
                        </TabsTrigger>
                        <TabsTrigger value="billing" className="rounded-sm data-[state=active]:bg-background gap-2">
                            <FileText className="size-4" />
                            <span className="hidden sm:inline">Facturación</span>
                        </TabsTrigger>
                        <TabsTrigger value="assets" className="rounded-sm data-[state=active]:bg-background gap-2">
                            <Globe className="size-4" />
                            <span className="hidden sm:inline">D&H</span>
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="rounded-sm data-[state=active]:bg-background gap-2">
                            <FolderOpen className="size-4" />
                            <span className="hidden sm:inline">Documentos</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="rounded-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Presupuesto Mensual</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">${client.monthlyBudget.toLocaleString()}</p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Gasto Actual</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">${client.currentSpend.toLocaleString()}</p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Health Score</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <p className={`text-2xl font-bold ${client.healthScore >= 80 ? "text-green-500" :
                                                client.healthScore >= 50 ? "text-yellow-500" : "text-red-500"
                                            }`}>
                                            {client.healthScore}%
                                        </p>
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${client.healthScore >= 80 ? "bg-green-500" :
                                                        client.healthScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                                                    }`}
                                                style={{ width: `${client.healthScore}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {client.nextMilestone && (
                                <Card className="rounded-sm md:col-span-2 lg:col-span-3">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Próximo Hito</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-lg">{client.nextMilestone}</p>
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
