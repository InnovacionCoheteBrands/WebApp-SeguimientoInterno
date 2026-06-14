import { memo, useState, useEffect } from "react";
import { ArrowLeft, Globe, Bell, Eye, Plug, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { NormalizedSystemSettings, ThemeSetting, LanguageSetting } from "@/lib/system-settings";
import { DEFAULT_SYSTEM_SETTINGS, NO_API_KEY_SUMMARY, normalizeSystemSettings } from "@/lib/system-settings";
import { regenerateSystemApiKey, saveSystemSettings } from "@/lib/api";

type Settings = NormalizedSystemSettings;

const defaultSettings: Settings = {
  ...DEFAULT_SYSTEM_SETTINGS,
  apiKey: NO_API_KEY_SUMMARY,
  webhookUrl: "",
};

const Settings = memo(function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  const { setLanguage, t } = useLanguage();
  const { themeColor, setThemeColor, presetOptions } = useThemeColor();
  const [localSettings, setLocalSettings] = useState<Settings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // SEC-004: State for robust API key regeneration confirmation
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [latestGeneratedApiKey, setLatestGeneratedApiKey] = useState<string | null>(null);

  // Fetch settings from API (shared cache)
  const { data: serverSettings, isLoading } = useSystemSettings();

  // Sync local state with server state on load
  // Note: Theme and Language contexts are synced via their own providers (ThemeProvider/LanguageProvider)
  // that listen to the shared useSystemSettings cache, so we only update localSettings here
  useEffect(() => {
    if (serverSettings) {
      setLocalSettings(serverSettings);
    }
  }, [serverSettings]);

  // Mutation for saving settings
  const saveMutation = useMutation({
    mutationFn: async (newSettings: Settings) => saveSystemSettings({
      theme: newSettings.theme,
      language: newSettings.language,
      timezone: newSettings.timezone,
      campaignAlerts: newSettings.campaignAlerts,
      analyticsAlerts: newSettings.analyticsAlerts,
      systemAlerts: newSettings.systemAlerts,
      emailNotifications: newSettings.emailNotifications,
      refreshRate: newSettings.refreshRate,
      chartAnimations: newSettings.chartAnimations,
    }),
    onSuccess: (data) => {
      const normalized = normalizeSystemSettings(data);
      queryClient.setQueryData(["/api/settings"], normalized);
      // Explicitly update theme and language contexts to ensure immediate UI update
      setTheme(normalized.theme as any);
      setLanguage(normalized.language as any);
      setHasChanges(false);
      toast({
        title: "Configuracion guardada",
        description: "Los cambios se aplicaron correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No fue posible guardar la configuracion. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  });

  // Mutation for regenerating API Key
  const regenerateKeyMutation = useMutation({
    mutationFn: regenerateSystemApiKey,
    onSuccess: (data) => {
      setLocalSettings(prev => ({ ...prev, apiKey: data.apiKey }));
      setLatestGeneratedApiKey(data.newApiKey);
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Nueva API key generada",
        description: "La clave anterior se invalido. Copia la nueva clave ahora.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No fue posible generar la API key.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    saveMutation.mutate(localSettings);
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);

    // Apply strict settings immediately for better UX
    if (key === 'theme') setTheme(value as any);
    if (key === 'language') setLanguage(value as any);
  };

  // SEC-004: Robust confirmation for API key regeneration
  const handleGenerateApiKey = () => {
    setShowRegenerateDialog(true);
    setConfirmText("");
  };

  const confirmRegenerateApiKey = () => {
    if (confirmText === "REGENERAR") {
      regenerateKeyMutation.mutate();
      setShowRegenerateDialog(false);
      setConfirmText("");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Cargando configuracion...</div>;
  }

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 p-3 sm:p-8 font-sans selection:bg-primary/30">
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Intel Header & Configuration Nexus */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="outline" size="icon" className="size-12 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group-back">
                <ArrowLeft className="size-5 text-zinc-400 group-hover:text-white" />
              </Button>
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-white/10 text-primary">
                  <Plug className="size-5" />
                </div>
                <h1 className="text-4xl font-display italic tracking-tight text-white">Configuracion del sistema</h1>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.4em] pl-1 opacity-60">Centro global de preferencias y parametros</p>
            </div>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            className="h-12 px-8 rounded-2xl bg-primary text-black font-mono font-bold text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary),0.2)]"
            data-testid="button-save-settings"
          >
            <Save className="size-4 mr-2" />
            {saveMutation.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Visual Architecture */}
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-primary/10 border border-white/10 text-primary">
                  <Globe className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-display italic text-white tracking-tight">Entorno general</CardTitle>
                  <CardDescription className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mt-1">Parametros base de experiencia y visualizacion</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <Label htmlFor="theme" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Modo de interfaz</Label>
                <Select
                  value={localSettings.theme}
                  onValueChange={(value) => updateSetting("theme", value as ThemeSetting)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-mono text-xs focus:ring-primary/20" data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-zinc-300 font-mono text-xs">
                    <SelectItem value="dark" className="focus:bg-primary/10 focus:text-primary">Oscuro</SelectItem>
                    <SelectItem value="light" className="focus:bg-primary/10 focus:text-primary">Claro</SelectItem>
                    <SelectItem value="system" className="focus:bg-primary/10 focus:text-primary">Seguir sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Color de acento</Label>
                  <span className="text-[10px] font-mono text-primary font-bold">
                    {presetOptions.find((option) => option.value === themeColor)?.label || "RAW_HEX"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {presetOptions.map((option) => {
                    const isActive = option.value === themeColor;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={isActive}
                        aria-label={option.label}
                        onClick={() => setThemeColor(option.value)}
                        style={{ backgroundColor: `hsl(${option.value})` }}
                        className={[
                          "size-10 rounded-2xl border border-white/10 transition-all duration-300",
                          "ring-offset-2 ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          isActive ? "ring-2 ring-primary scale-110 shadow-[0_0_15px_rgba(var(--primary),0.3)]" : "opacity-60 hover:opacity-100 hover:scale-105"
                        ].join(" ")}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="language" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Idioma</Label>
                <Select
                  value={localSettings.language}
                  onValueChange={(value) => updateSetting("language", value as LanguageSetting)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-mono text-xs focus:ring-primary/20" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-zinc-300 font-mono text-xs">
                    <SelectItem value="en" className="focus:bg-primary/10 focus:text-primary">Ingles (EE. UU.)</SelectItem>
                    <SelectItem value="es" className="focus:bg-primary/10 focus:text-primary">Espanol (Mexico)</SelectItem>
                    <SelectItem value="fr" className="focus:bg-primary/10 focus:text-primary">Frances</SelectItem>
                    <SelectItem value="de" className="focus:bg-primary/10 focus:text-primary">Aleman</SelectItem>
                    <SelectItem value="ja" className="focus:bg-primary/10 focus:text-primary">Japones</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label htmlFor="timezone" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Zona horaria</Label>
                <Select
                  value={localSettings.timezone}
                  onValueChange={(value) => updateSetting("timezone", value)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-mono text-xs focus:ring-primary/20" data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-zinc-300 font-mono text-xs">
                    <SelectItem value="UTC" className="focus:bg-primary/10 focus:text-primary">UTC</SelectItem>
                    <SelectItem value="America/New_York" className="focus:bg-primary/10 focus:text-primary">Nueva York</SelectItem>
                    <SelectItem value="America/Los_Angeles" className="focus:bg-primary/10 focus:text-primary">Los Angeles</SelectItem>
                    <SelectItem value="Europe/Paris" className="focus:bg-primary/10 focus:text-primary">Paris</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Intelligence Alerts */}
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/10 text-blue-400">
                  <Bell className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-display italic text-white tracking-tight">Alertas</CardTitle>
                  <CardDescription className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mt-1">Configuracion de avisos y seguimiento en tiempo real</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {[
                { label: "Alertas de campanas", sub: "Actualizaciones operativas clave", key: "campaignAlerts" },
                { label: "Alertas analiticas", sub: "Cambios y anomalias en datos", key: "analyticsAlerts" },
                { label: "Alertas del sistema", sub: "Eventos relevantes de integridad", key: "systemAlerts" },
                { label: "Notificaciones por correo", sub: "Avisos enviados por email", key: "emailNotifications" },
              ].map((item, idx) => (
                <div key={item.key} className="space-y-6">
                  <div className="flex items-center justify-between group/item">
                    <div className="space-y-1">
                      <Label className="text-xs font-mono font-bold text-white tracking-wide">{item.label}</Label>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{item.sub}</p>
                    </div>
                    <Switch
                      checked={localSettings[item.key as keyof Settings] as boolean}
                      onCheckedChange={(checked) => updateSetting(item.key as keyof Settings, checked)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  {idx < 3 && <Separator className="bg-white/5" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data Dynamics */}
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-400">
                  <Eye className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-display italic text-white tracking-tight">Rendimiento visual</CardTitle>
                  <CardDescription className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mt-1">Frecuencia y animaciones de la interfaz</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <Label htmlFor="refresh-rate" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Frecuencia de actualizacion</Label>
                <Select
                  value={localSettings.refreshRate}
                  onValueChange={(value) => updateSetting("refreshRate", value)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-mono text-xs focus:ring-primary/20" data-testid="select-refresh-rate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-zinc-300 font-mono text-xs">
                    <SelectItem value="1" className="focus:bg-primary/10 focus:text-primary">1 segundo</SelectItem>
                    <SelectItem value="5" className="focus:bg-primary/10 focus:text-primary">5 segundos</SelectItem>
                    <SelectItem value="10" className="focus:bg-primary/10 focus:text-primary">10 segundos</SelectItem>
                    <SelectItem value="30" className="focus:bg-primary/10 focus:text-primary">30 segundos</SelectItem>
                    <SelectItem value="60" className="focus:bg-primary/10 focus:text-primary">60 segundos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="space-y-1">
                  <Label className="text-sm font-mono font-bold text-white tracking-wide">Animaciones</Label>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Transiciones fluidas</p>
                </div>
                <Switch
                  checked={localSettings.chartAnimations}
                  onCheckedChange={(checked) => updateSetting("chartAnimations", checked)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Encryption & Protocols */}
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden lg:col-span-3">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/10 text-orange-400">
                  <Plug className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-display italic text-white tracking-tight">API key y webhooks</CardTitle>
                  <CardDescription className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 mt-1">Gestion de credenciales y conexiones seguras</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <Label htmlFor="api-key" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">API key principal</Label>
                  <div className="flex gap-3">
                    <Input
                      id="api-key"
                      value={localSettings.apiKey.masked ?? ""}
                      readOnly
                      placeholder="SIN_CLAVE_GENERADA"
                      className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-mono text-xs focus:ring-primary/20 blur-[2px] hover:blur-none transition-all duration-300"
                      data-testid="input-api-key"
                    />
                    <Button
                      onClick={handleGenerateApiKey}
                      disabled={regenerateKeyMutation.isPending}
                      className="h-12 px-8 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 font-mono text-[10px] uppercase tracking-widest font-bold"
                      data-testid="button-regenerate-api-key"
                    >
                      {regenerateKeyMutation.isPending ? "GENERANDO..." : "REGENERAR"}
                    </Button>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">
                    Usa esta clave para autenticar integraciones externas. Mantenla resguardada.
                  </p>
                  {latestGeneratedApiKey && (
                    <div className="space-y-2">
                      <Label htmlFor="api-key-once" className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest pl-1">Vista temporal de la API key</Label>
                      <Input
                        id="api-key-once"
                        value={latestGeneratedApiKey}
                        readOnly
                        className="h-12 rounded-xl bg-emerald-500/10 border-emerald-500/30 text-emerald-200 font-mono text-xs focus:ring-emerald-500/20"
                        data-testid="input-api-key-once"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <Label htmlFor="webhook-url" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Webhook remoto</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    value={localSettings.webhookUrl || ""}
                    onChange={(e) => updateSetting("webhookUrl", e.target.value)}
                    placeholder="https://nexus.cohete.io/gatekeeper"
                    className="h-12 rounded-xl opacity-30 cursor-not-allowed bg-white/5 border-white/10 font-mono text-xs"
                    data-testid="input-webhook-url"
                    disabled
                  />
                  <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-[9px] font-mono text-amber-500/80 uppercase tracking-widest">
                      Integracion en desarrollo: el relay de webhooks sigue en modo sandbox.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* SEC-004: Robust confirmation dialog for API key regeneration */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-rose-500 font-display italic text-2xl">
              <AlertTriangle className="size-6" />
              Regenerar API key?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-6 pt-4">
              <p className="text-zinc-400 font-mono text-xs leading-relaxed">
                <strong className="text-rose-400">IMPORTANTE:</strong> Esta operacion invalida de inmediato la clave actual.
                Todas las integraciones activas que la usan dejaran de funcionar hasta actualizarla.
              </p>
              <div className="space-y-3">
                <Label htmlFor="confirm-regenerate" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">
                  Escribe <code className="bg-rose-500/10 px-2 py-1 rounded text-rose-400 font-bold uppercase">REGENERAR</code> para confirmar:
                </Label>
                <Input
                  id="confirm-regenerate"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="CONFIRMAR_ACCION"
                  className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-mono text-xs uppercase"
                  data-testid="input-confirm-regenerate"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel onClick={() => setConfirmText("")} className="h-12 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 font-mono text-[10px] uppercase tracking-widest">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRegenerateApiKey}
              disabled={confirmText !== "REGENERAR" || regenerateKeyMutation.isPending}
              className="h-12 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-mono text-[10px] uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(225,29,72,0.3)] border-none"
              data-testid="button-confirm-regenerate"
            >
              {regenerateKeyMutation.isPending ? "Generando..." : "Confirmar regeneracion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
});

export default Settings;
