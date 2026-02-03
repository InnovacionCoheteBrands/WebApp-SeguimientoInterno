import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, FileText, Globe, FolderOpen } from "lucide-react";
import { ContactsTab } from "@/components/clients/contacts-tab";
import { BillingProfilesTab } from "@/components/clients/billing-profiles-tab";
import { DigitalAssetsTab } from "@/components/clients/digital-assets-tab";
import { DocumentsTab } from "@/components/clients/documents-tab";
import type { ClientAccount } from "@/lib/api";

interface ClientDrawerProps {
    client: ClientAccount | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClientDrawer({ client, open, onOpenChange }: ClientDrawerProps) {
    if (!client) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0" side="right">
                <div className="p-6">
                    <SheetHeader className="mb-6">
                        <div className="flex items-center gap-3">
                            <SheetTitle className="text-2xl font-bold">{client.companyName}</SheetTitle>
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
                        <SheetDescription className="flex items-center gap-2">
                            <Building2 className="size-4" />
                            {client.industry}
                            {client.sector && <span> • {client.sector}</span>}
                        </SheetDescription>
                    </SheetHeader>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="w-full justify-start bg-muted/30 border border-border rounded-sm p-1 h-auto flex-wrap mb-4">
                            <TabsTrigger value="general" className="rounded-sm data-[state=active]:bg-background gap-2">
                                <Building2 className="size-4" />
                                <span className="hidden sm:inline">General</span>
                            </TabsTrigger>
                            <TabsTrigger value="contacts" className="rounded-sm data-[state=active]:bg-background gap-2">
                                <User className="size-4" />
                                <span className="hidden sm:inline">Contactos</span>
                            </TabsTrigger>
                            <TabsTrigger value="assets" className="rounded-sm data-[state=active]:bg-background gap-2">
                                <Globe className="size-4" />
                                <span className="hidden sm:inline">D&H</span>
                            </TabsTrigger>
                            <TabsTrigger value="billing" className="rounded-sm data-[state=active]:bg-background gap-2">
                                <FileText className="size-4" />
                                <span className="hidden sm:inline">Facturación</span>
                            </TabsTrigger>
                            <TabsTrigger value="documents" className="rounded-sm data-[state=active]:bg-background gap-2">
                                <FolderOpen className="size-4" />
                                <span className="hidden sm:inline">Documentos</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            </div>

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
                                <Card className="rounded-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Próximo Hito</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-lg">{client.nextMilestone}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="contacts">
                            <ContactsTab clientId={client.id} />
                        </TabsContent>

                        <TabsContent value="assets">
                            <DigitalAssetsTab clientId={client.id} />
                        </TabsContent>

                        <TabsContent value="billing">
                            <BillingProfilesTab clientId={client.id} />
                        </TabsContent>

                        <TabsContent value="documents">
                            <DocumentsTab clientId={client.id} />
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
