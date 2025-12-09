import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Link2,
    Unlink,
    Settings,
    Target,
    DollarSign,
    TrendingUp,
    CheckCircle,
    XCircle,
    RefreshCw,
    Key,
    Shield,
    Zap,
    AlertCircle,
    Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlatformConnection {
    id: number;
    platformId: number;
    platformName: string;
    displayName: string;
    connectionType: "oauth" | "api_key";
    isActive: boolean;
    lastSyncAt: string | null;
    createdAt: string;
    apiKeyName?: string;
}

interface AccountMapping {
    id: number;
    platformAccountId: string;
    platformAccountName: string;
    internalClientName: string;
    isActive: boolean;
}

interface ClientKPI {
    id: number;
    clientName: string;
    targetROAS: string | null;
    targetCPA: string | null;
    monthlyBudgetCap: string | null;
}

export default function AdsSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedClient, setSelectedClient] = useState("");
    const [kpiForm, setKpiForm] = useState({
        targetROAS: "",
        targetCPA: "",
        monthlyBudgetCap: "",
    });
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string>("");
    const [connectionMethod, setConnectionMethod] = useState<"oauth" | "api_key">("oauth");
    const [apiKeyForm, setApiKeyForm] = useState({
        apiKey: "",
        apiSecret: "",
        apiKeyName: "",
    });

    // Fetch platform connections
    const { data: connections = [] } = useQuery<PlatformConnection[]>({
        queryKey: ["platform-connections"],
        queryFn: async () => {
            const res = await fetch("/api/ads/integrations/connections");
            if (!res.ok) return [];
            return res.json();
        },
    });

    // Fetch account mappings
    const { data: mappings = [] } = useQuery<AccountMapping[]>({
        queryKey: ["account-mappings"],
        queryFn: async () => {
            const res = await fetch("/api/ads/integrations/mappings");
            if (!res.ok) return [];
            return res.json();
        },
    });

    // Fetch client KPIs
    const { data: clientKPIs = [] } = useQuery<ClientKPI[]>({
        queryKey: ["client-kpis"],
        queryFn: async () => {
            const res = await fetch("/api/ads/integrations/kpis");
            if (!res.ok) return [];
            return res.json();
        },
    });

    const handleOAuthConnect = async (platform: string) => {
        // Will redirect to OAuth flow
        window.location.href = `/api/ads/integrations/oauth/init?platform=${platform}`;
    };

    const handleApiKeyConnect = async () => {
        try {
            await fetch("/api/ads/integrations/api-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: selectedPlatform,
                    ...apiKeyForm,
                }),
            });
            queryClient.invalidateQueries({ queryKey: ["platform-connections"] });
            toast({ title: "API Key conectada exitosamente" });
            setConnectionDialogOpen(false);
            setApiKeyForm({ apiKey: "", apiSecret: "", apiKeyName: "" });
        } catch (error) {
            toast({ title: "Error al conectar API Key", variant: "destructive" });
        }
    };

    const handleDisconnect = async (connectionId: number) => {
        try {
            await fetch(`/api/ads/integrations/connections/${connectionId}`, {
                method: "DELETE",
            });
            queryClient.invalidateQueries({ queryKey: ["platform-connections"] });
            toast({ title: "Plataforma desconectada exitosamente" });
        } catch (error) {
            toast({ title: "Error al desconectar", variant: "destructive" });
        }
    };

    const handleSaveKPIs = async () => {
        if (!selectedClient) {
            toast({ title: "Selecciona un cliente", variant: "destructive" });
            return;
        }

        try {
            await fetch(`/api/ads/integrations/kpis/${selectedClient}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(kpiForm),
            });
            queryClient.invalidateQueries({ queryKey: ["client-kpis"] });
            toast({ title: "KPIs actualizados exitosamente" });
        } catch (error) {
            toast({ title: "Error al guardar KPIs", variant: "destructive" });
        }
    };

    const platforms = [
        { id: "meta", name: "Meta", displayName: "Facebook & Instagram", icon: "📘" },
        { id: "google", name: "Google", displayName: "Google Ads", icon: "🔍" },
        { id: "tiktok", name: "TikTok", displayName: "TikTok Ads", icon: "🎵" },
    ];

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-bold tracking-tight uppercase">
                    Configuración de Ads
                </h1>
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                    Gestión de Conexiones e Integraciones
                </p>
            </div>

            {/* Platform Connections Hub */}
            <Card className="border-border bg-card shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50" />
                <CardHeader className="p-3 sm:p-6 pb-2">
                    <CardTitle className="text-base sm:text-lg font-display uppercase tracking-tight flex items-center gap-2">
                        <Zap className="size-4 text-primary" />
                        Conexiones de Plataformas
                    </CardTitle>
                    <CardDescription className="font-mono text-xs uppercase tracking-wider">
                        OAuth o API Key - Elige tu método preferido
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {platforms.map((platform) => {
                            const connection = connections.find(c => c.platformName.toLowerCase() === platform.id);
                            const isConnected = connection?.isActive;

                            return (
                                <div
                                    key={platform.id}
                                    className="p-4 rounded-sm border border-border bg-card hover:border-primary/50 transition-all shadow-sm relative overflow-hidden group/item"
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${isConnected ? 'bg-green-500' : 'bg-gray-500'} opacity-70 group-hover/item:opacity-100 transition-opacity`} />
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-2xl">{platform.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm">{platform.displayName}</h3>
                                            {isConnected ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-green-500 border-green-500 text-xs rounded-sm">
                                                        <CheckCircle className="size-3 mr-1" />
                                                        Conectado
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs rounded-sm">
                                                        {connection.connectionType === "oauth" ? "OAuth" : "API Key"}
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground text-xs rounded-sm">
                                                    <XCircle className="size-3 mr-1" />
                                                    Desconectado
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {connection && connection.lastSyncAt && (
                                        <p className="text-xs text-muted-foreground mb-3 font-mono">
                                            Última sync: {new Date(connection.lastSyncAt).toLocaleString()}
                                        </p>
                                    )}

                                    {connection?.connectionType === "api_key" && connection.apiKeyName && (
                                        <p className="text-xs text-muted-foreground mb-3 font-mono">
                                            Key: {connection.apiKeyName}
                                        </p>
                                    )}

                                    {isConnected && connection ? (
                                        <div className="space-y-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full rounded-sm text-xs font-mono uppercase"
                                                onClick={() => {
                                                    toast({ title: `Sincronizando ${platform.displayName}...` });
                                                }}
                                            >
                                                <RefreshCw className="size-3 mr-2" />
                                                Sincronizar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full rounded-sm text-xs font-mono uppercase text-destructive hover:text-destructive"
                                                onClick={() => handleDisconnect(connection.id)}
                                            >
                                                <Unlink className="size-3 mr-2" />
                                                Desconectar
                                            </Button>
                                        </div>
                                    ) : (
                                        <Dialog open={connectionDialogOpen && selectedPlatform === platform.id} onOpenChange={(open) => {
                                            setConnectionDialogOpen(open);
                                            if (open) setSelectedPlatform(platform.id);
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    className="w-full rounded-sm text-xs font-mono uppercase"
                                                >
                                                    <Link2 className="size-3 mr-2" />
                                                    Conectar
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle className="font-display uppercase">
                                                        Conectar {platform.displayName}
                                                    </DialogTitle>
                                                    <DialogDescription className="font-mono text-xs uppercase tracking-wider">
                                                        Elige tu método de autenticación preferido
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <Tabs value={connectionMethod} onValueChange={(v) => setConnectionMethod(v as "oauth" | "api_key")}>
                                                    <TabsList className="grid w-full grid-cols-2">
                                                        <TabsTrigger value="oauth">OAuth (Recomendado)</TabsTrigger>
                                                        <TabsTrigger value="api_key">API Key</TabsTrigger>
                                                    </TabsList>

                                                    <TabsContent value="oauth" className="space-y-4">
                                                        <div className="space-y-3">
                                                            <h3 className="font-semibold text-sm">✅ Ventajas</h3>
                                                            <ul className="space-y-2 text-sm text-muted-foreground">
                                                                <li className="flex items-start gap-2">
                                                                    <Shield className="size-4 text-green-500 mt-0.5" />
                                                                    <span><strong>Más seguro:</strong> No compartimos credenciales, solo un token autorizado</span>
                                                                </li>
                                                                <li className="flex items-start gap-2">
                                                                    <Zap className="size-4 text-green-500 mt-0.5" />
                                                                    <span><strong>Más rápido:</strong> Un solo clic para conectar, sin copiar/pegar</span>
                                                                </li>
                                                                <li className="flex items-start gap-2">
                                                                    <RefreshCw className="size-4 text-green-500 mt-0.5" />
                                                                    <span><strong>Auto-renovable:</strong> Los tokens se renuevan automáticamente</span>
                                                                </li>
                                                                <li className="flex items-start gap-2">
                                                                    <CheckCircle className="size-4 text-green-500 mt-0.5" />
                                                                    <span><strong>Permisos granulares:</strong> Controlas exactamente qué puede hacer la app</span>
                                                                </li>
                                                            </ul>

                                                            <h3 className="font-semibold text-sm mt-4">⚠️ Desventajas</h3>
                                                            <ul className="space-y-2 text-sm text-muted-foreground">
                                                                <li className="flex items-start gap-2">
                                                                    <AlertCircle className="size-4 text-amber-500 mt-0.5" />
                                                                    <span><strong>Requiere redirección:</strong> Te lleva a la página de {platform.displayName}</span>
                                                                </li>
                                                                <li className="flex items-start gap-2">
                                                                    <AlertCircle className="size-4 text-amber-500 mt-0.5" />
                                                                    <span><strong>Puede expirar:</strong> Aunque se auto-renueva, hay escenarios donde puede fallar</span>
                                                                </li>
                                                            </ul>
                                                        </div>

                                                        <DialogFooter>
                                                            <Button onClick={() => handleOAuthConnect(platform.id)} className="rounded-sm font-mono uppercase">
                                                                <Link2 className="size-4 mr-2" />
                                                                Conectar con OAuth
                                                            </Button>
                                                        </DialogFooter>
                                                    </TabsContent>

                                                    <TabsContent value="api_key" className="space-y-4">
                                                        <div className="space-y-3 mb-4">
                                                            <h3 className="font-semibold text-sm">✅ Ventajas</h3>
                                                            <ul className="space-y-2 text-sm text-muted-foreground">
                                                                <li className="flex items-start gap-2">
                                                                    <Key className="size-4 text-green-500 mt-0.5" />
                                                                    <span><strong>Control total:</strong> Tú generas y manejas la API Key</span>
                                                                </li>
                                                                <li className="flex items-start gap-2">
                                                                    <Shield className="size-4 text-green-500 mt-0.5" />
                                                                    <span><strong>No expira:</strong> Las API Keys son válidas indefinidamente</span>
                                                                </li>
                                                                <li className="flex items-start gap-2">
                                                                    <CheckCircle className="size-4 text-green-500 mt-0.5" />
                                                                    <span><strong>Sin redireciones:</strong> Todo se hace en esta misma página</span>
                                                                </li>
                                                            </ul>

                                                            <h3 className="font-semibold text-sm mt-4">⚠️ Desventajas</h3>
                                                            <ul className="space-y-2 text-sm text-muted-foreground">
                                                                <li className="flex items-start gap-2">
                                                                    <AlertCircle className="size-4 text-red-500 mt-0.5" />
                                                                    <span><strong>Menos seguro:</strong> Si la key se filtra, tiene acceso total</span>
                                                                </li>
                                                                <li className="flex items-start gap-2">
                                                                    <AlertCircle className="size-4 text-red-500 mt-0.5" />
                                                                    <span><strong>Más manual:</strong> Debes generarla en {platform.displayName} y copiarla aquí</span>
                                                                </li>
                                                                <li className="flex items-start gap-2">
                                                                    <AlertCircle className="size-4 text-red-500 mt-0.5" />
                                                                    <span><strong>Revocación manual:</strong> Si quieres desconectar, debes eliminarla en ambos lados</span>
                                                                </li>
                                                            </ul>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-3">
                                                                <div className="flex items-start gap-2">
                                                                    <Info className="size-4 text-blue-500 mt-0.5" />
                                                                    <p className="text-xs text-muted-foreground">
                                                                        <strong>¿Dónde obtener tu API Key?</strong> Ve a la configuración de {platform.displayName} → API & Tokens → Genera una nueva API Key
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-mono uppercase">Nombre de la Key (opcional)</Label>
                                                                <Input
                                                                    placeholder="Ej: Production Key - Nov 2024"
                                                                    value={apiKeyForm.apiKeyName}
                                                                    onChange={(e) => setApiKeyForm({ ...apiKeyForm, apiKeyName: e.target.value })}
                                                                    className="rounded-sm border-border h-11"
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-mono uppercase">API Key *</Label>
                                                                <Input
                                                                    type="password"
                                                                    placeholder="sk_live_..."
                                                                    value={apiKeyForm.apiKey}
                                                                    onChange={(e) => setApiKeyForm({ ...apiKeyForm, apiKey: e.target.value })}
                                                                    className="rounded-sm border-border h-11 font-mono"
                                                                />
                                                            </div>

                                                            {platform.id === "google" && (
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-mono uppercase">API Secret (Google Ads)</Label>
                                                                    <Input
                                                                        type="password"
                                                                        placeholder="Secret para Google Ads"
                                                                        value={apiKeyForm.apiSecret}
                                                                        onChange={(e) => setApiKeyForm({ ...apiKeyForm, apiSecret: e.target.value })}
                                                                        className="rounded-sm border-border h-11 font-mono"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <DialogFooter>
                                                            <Button
                                                                onClick={handleApiKeyConnect}
                                                                disabled={!apiKeyForm.apiKey}
                                                                className="rounded-sm font-mono uppercase"
                                                            >
                                                                <Key className="size-4 mr-2" />
                                                                Conectar con API Key
                                                            </Button>
                                                        </DialogFooter>
                                                    </TabsContent>
                                                </Tabs>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Account Mapping */}
            <Card className="border-border bg-card shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-50" />
                <CardHeader className="p-3 sm:p-6 pb-2">
                    <CardTitle className="text-base sm:text-lg font-display uppercase tracking-tight flex items-center gap-2">
                        <Link2 className="size-4 text-blue-500" />
                        Mapeo de Cuentas
                    </CardTitle>
                    <CardDescription className="font-mono text-xs uppercase tracking-wider">
                        Asignar Cuentas Publicitarias a Clientes Internos
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                    {mappings.length > 0 ? (
                        <div className="space-y-3">
                            {mappings.map((mapping) => (
                                <div
                                    key={mapping.id}
                                    className="flex items-center justify-between p-3 rounded-sm border border-border"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{mapping.platformAccountName || mapping.platformAccountId}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            ID: {mapping.platformAccountId}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">→</span>
                                        <Badge variant="outline" className="rounded-sm">
                                            {mapping.internalClientName}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground text-sm">
                                No hay mapeos de cuentas configurados
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Conecta una plataforma para comenzar
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Client KPI Configuration */}
            <Card className="border-border bg-card shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0 opacity-50" />
                <CardHeader className="p-3 sm:p-6 pb-2">
                    <CardTitle className="text-base sm:text-lg font-display uppercase tracking-tight flex items-center gap-2">
                        <Target className="size-4 text-orange-500" />
                        Configuración de KPIs por Cliente
                    </CardTitle>
                    <CardDescription className="font-mono text-xs uppercase tracking-wider">
                        Target ROAS, CPA y Presupuesto Mensual
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* KPI Form */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase">Cliente</Label>
                                <Select value={selectedClient} onValueChange={(val) => {
                                    setSelectedClient(val);
                                    const kpi = clientKPIs.find(k => k.clientName === val);
                                    if (kpi) {
                                        setKpiForm({
                                            targetROAS: kpi.targetROAS || "",
                                            targetCPA: kpi.targetCPA || "",
                                            monthlyBudgetCap: kpi.monthlyBudgetCap || "",
                                        });
                                    }
                                }}>
                                    <SelectTrigger className="rounded-sm border-border h-11">
                                        <SelectValue placeholder="Selecciona un cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from(new Set(mappings.map(m => m.internalClientName))).map((client) => (
                                            <SelectItem key={client} value={client}>
                                                {client}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase flex items-center gap-2">
                                    <TrendingUp className="size-3" />
                                    Target ROAS
                                </Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="4.00"
                                    value={kpiForm.targetROAS}
                                    onChange={(e) => setKpiForm({ ...kpiForm, targetROAS: e.target.value })}
                                    className="rounded-sm border-border h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase flex items-center gap-2">
                                    <Target className="size-3" />
                                    Target CPA
                                </Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="15.00"
                                    value={kpiForm.targetCPA}
                                    onChange={(e) => setKpiForm({ ...kpiForm, targetCPA: e.target.value })}
                                    className="rounded-sm border-border h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase flex items-center gap-2">
                                    <DollarSign className="size-3" />
                                    Presupuesto Mensual Cap
                                </Label>
                                <Input
                                    type="number"
                                    step="100"
                                    placeholder="50000.00"
                                    value={kpiForm.monthlyBudgetCap}
                                    onChange={(e) => setKpiForm({ ...kpiForm, monthlyBudgetCap: e.target.value })}
                                    className="rounded-sm border-border h-11"
                                />
                            </div>

                            <Button
                                onClick={handleSaveKPIs}
                                className="w-full rounded-sm h-11 font-mono uppercase"
                            >
                                <Settings className="size-4 mr-2" />
                                Guardar Configuración
                            </Button>
                        </div>

                        {/* KPI Summary */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 font-mono uppercase">KPIs Configurados</h3>
                            <div className="space-y-2">
                                {clientKPIs.map((kpi) => (
                                    <div
                                        key={kpi.id}
                                        className="p-3 rounded-sm border border-border"
                                    >
                                        <p className="font-semibold text-sm mb-2">{kpi.clientName}</p>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <p className="text-muted-foreground font-mono">ROAS</p>
                                                <p className="font-mono font-semibold">{kpi.targetROAS || "—"}x</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground font-mono">CPA</p>
                                                <p className="font-mono font-semibold">${kpi.targetCPA || "—"}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground font-mono">Budget</p>
                                                <p className="font-mono font-semibold">${kpi.monthlyBudgetCap || "—"}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
