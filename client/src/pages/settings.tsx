import { memo, useState, useEffect } from "react";
import { ArrowLeft, Globe, Bell, Eye, Plug, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { NormalizedSystemSettings, ThemeSetting, LanguageSetting } from "@/lib/system-settings";
import { DEFAULT_SYSTEM_SETTINGS, normalizeSystemSettings } from "@/lib/system-settings";

type Settings = NormalizedSystemSettings;

const defaultSettings: Settings = {
  ...DEFAULT_SYSTEM_SETTINGS,
  apiKey: "",
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
    mutationFn: async (newSettings: Settings) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            theme: newSettings.theme,
            language: newSettings.language,
            timezone: newSettings.timezone,
            campaignAlerts: newSettings.campaignAlerts,
            analyticsAlerts: newSettings.analyticsAlerts,
            systemAlerts: newSettings.systemAlerts,
            emailNotifications: newSettings.emailNotifications,
            refreshRate: newSettings.refreshRate,
            chartAnimations: newSettings.chartAnimations,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: (data) => {
      const normalized = normalizeSystemSettings(data);
      queryClient.setQueryData(["/api/settings"], normalized);
      // Explicitly update theme and language contexts to ensure immediate UI update
      setTheme(normalized.theme as any);
      setLanguage(normalized.language as any);
      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "Your configuration has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for regenerating API Key
  const regenerateKeyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/api-key", { method: "POST" });
      if (!res.ok) throw new Error("Failed to regenerate key");
      return res.json();
    },
    onSuccess: (data) => {
      setLocalSettings(prev => ({ ...prev, apiKey: data.apiKey }));
      setHasChanges(true); // User might want to verify before navigating away, or we could auto-save. 
      // Actually, generating a key is a server action that updates DB immediately usually.
      // Let's assume it updates backend immediately.
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "New API Key Generated",
        description: "Your previous key has been invalidated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate API Key",
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

  const handleGenerateApiKey = () => {
    if (confirm("Are you sure? This will invalidate your existing API Key.")) {
      regenerateKeyMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-sm" data-testid="button-back">
                  <ArrowLeft className="size-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-wide">{t("system_configuration")}</h1>
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                  {t("settings_description") || "Application preferences and settings"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-save-settings"
            >
              <Save className="size-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : t("save_changes")}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* System Preferences */}
          <Card className="shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50" />
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-primary/10 border border-primary/20">
                  <Globe className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display uppercase tracking-tight">System</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                    Display preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-xs font-mono uppercase text-muted-foreground">Theme</Label>
                <Select
                  value={localSettings.theme}
                  onValueChange={(value) => updateSetting("theme", value as ThemeSetting)}
                >
                  <SelectTrigger className="rounded-sm" data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="system">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-mono uppercase text-muted-foreground">Appearance</Label>
                    <p className="text-xs text-muted-foreground">Acentos</p>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    {presetOptions.find((option) => option.value === themeColor)?.label || "Custom"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
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
                          "size-10 rounded-full border border-border transition",
                          "ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          isActive ? "ring-2 ring-primary" : "ring-0"
                        ].join(" ")}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-xs font-mono uppercase text-muted-foreground">Language</Label>
                <Select
                  value={localSettings.language}
                  onValueChange={(value) => updateSetting("language", value as LanguageSetting)}
                >
                  <SelectTrigger className="rounded-sm" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-xs font-mono uppercase text-muted-foreground">Timezone</Label>
                <Select
                  value={localSettings.timezone}
                  onValueChange={(value) => updateSetting("timezone", value)}
                >
                  <SelectTrigger className="rounded-sm" data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC (Universal)</SelectItem>
                    <SelectItem value="America/New_York">EST (New York)</SelectItem>
                    <SelectItem value="America/Los_Angeles">PST (Los Angeles)</SelectItem>
                    <SelectItem value="Europe/London">GMT (London)</SelectItem>
                    <SelectItem value="Europe/Paris">CET (Paris)</SelectItem>
                    <SelectItem value="Asia/Tokyo">JST (Tokyo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-50" />
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-blue-500/10 border border-blue-500/20">
                  <Bell className="size-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display uppercase tracking-tight">Notifications</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                    Alert preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Campaign Alerts</Label>
                  <p className="text-xs text-muted-foreground">Critical campaign updates</p>
                </div>
                <Switch
                  checked={localSettings.campaignAlerts}
                  onCheckedChange={(checked) => updateSetting("campaignAlerts", checked)}
                  data-testid="switch-campaign-alerts"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Analytics Alerts</Label>
                  <p className="text-xs text-muted-foreground">Real-time analytics anomalies</p>
                </div>
                <Switch
                  checked={localSettings.analyticsAlerts}
                  onCheckedChange={(checked) => updateSetting("analyticsAlerts", checked)}
                  data-testid="switch-analytics-alerts"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">System Alerts</Label>
                  <p className="text-xs text-muted-foreground">Infrastructure warnings</p>
                </div>
                <Switch
                  checked={localSettings.systemAlerts}
                  onCheckedChange={(checked) => updateSetting("systemAlerts", checked)}
                  data-testid="switch-system-alerts"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive alerts via email</p>
                </div>
                <Switch
                  checked={localSettings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                  data-testid="switch-email-notifications"
                />
              </div>
            </CardContent>
          </Card>

          {/* Visualization */}
          <Card className="shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0 opacity-50" />
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-green-500/10 border border-green-500/20">
                  <Eye className="size-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display uppercase tracking-tight">Visualization</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                    Dashboard display
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refresh-rate" className="text-xs font-mono uppercase text-muted-foreground">Data Refresh Rate</Label>
                <Select
                  value={localSettings.refreshRate}
                  onValueChange={(value) => updateSetting("refreshRate", value)}
                >
                  <SelectTrigger className="rounded-sm" data-testid="select-refresh-rate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 second</SelectItem>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Chart Animations</Label>
                  <p className="text-xs text-muted-foreground">Smooth transitions</p>
                </div>
                <Switch
                  checked={localSettings.chartAnimations}
                  onCheckedChange={(checked) => updateSetting("chartAnimations", checked)}
                  data-testid="switch-chart-animations"
                />
              </div>
            </CardContent>
          </Card>

          {/* API & Integrations */}
          <Card className="shadow-sm relative overflow-hidden group lg:col-span-3">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0 opacity-50" />
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-orange-500/10 border border-orange-500/20">
                  <Plug className="size-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display uppercase tracking-tight">API & Integrations</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                    External connections and webhooks
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-xs font-mono uppercase text-muted-foreground">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="api-key"
                      value={localSettings.apiKey || ""}
                      readOnly
                      placeholder="No API Key generated"
                      className="rounded-sm font-mono text-sm"
                      data-testid="input-api-key"
                    />
                    <Button
                      onClick={handleGenerateApiKey}
                      disabled={regenerateKeyMutation.isPending}
                      variant="outline"
                      className="rounded-sm"
                      data-testid="button-regenerate-api-key"
                    >
                      {regenerateKeyMutation.isPending ? "Generating..." : "Regenerate"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this key to authenticate API requests. Keep it secure.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-url" className="text-xs font-mono uppercase text-muted-foreground">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    value={localSettings.webhookUrl || ""}
                    onChange={(e) => updateSetting("webhookUrl", e.target.value)}
                    placeholder="https://your-domain.com/webhook"
                    className="rounded-sm opacity-50 cursor-not-allowed"
                    data-testid="input-webhook-url"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                    Coming Soon: Webhook integration is currently in development.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
});

export default Settings;
