import { memo, useState, useEffect } from "react";
import { ArrowLeft, User, Globe, Bell, Eye, Lock, Plug, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Settings {
  // Profile
  name: string;
  email: string;
  role: string;
  clearance: string;
  initials: string;
  
  // System
  theme: string;
  language: string;
  timezone: string;
  
  // Notifications
  missionAlerts: boolean;
  telemetryAlerts: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  
  // Visualization
  refreshRate: string;
  units: string;
  chartAnimations: boolean;
  
  // API
  apiKey: string;
  webhookUrl: string;
}

const defaultSettings: Settings = {
  name: "Cmdr. Shepard",
  email: "shepard@cohete.space",
  role: "Mission Commander",
  clearance: "Level 5",
  initials: "CM",
  theme: "dark",
  language: "en",
  timezone: "UTC",
  missionAlerts: true,
  telemetryAlerts: true,
  systemAlerts: true,
  emailNotifications: false,
  refreshRate: "5",
  units: "metric",
  chartAnimations: true,
  apiKey: "sk_live_" + Math.random().toString(36).substring(2, 15),
  webhookUrl: "",
};

const Settings = memo(function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mission-control-settings");
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("mission-control-settings", JSON.stringify(settings));
    setHasChanges(false);
    toast({
      title: "Settings Saved",
      description: "Your configuration has been updated successfully",
    });
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleGenerateApiKey = () => {
    const newKey = "sk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    updateSetting("apiKey", newKey);
    toast({
      title: "New API Key Generated",
      description: "Your previous key has been invalidated",
    });
  };

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
                <h1 className="text-2xl font-display font-bold tracking-wide">SYSTEM CONFIGURATION</h1>
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                  Manage preferences and settings
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-save-settings"
            >
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Profile Section */}
          <Card className="border-border bg-card/50 rounded-sm lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-primary/10 border border-primary/20">
                  <User className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">User Profile</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase tracking-wider">
                    Personal information and credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-20 border-2 border-primary/20">
                  <AvatarFallback className="bg-muted text-2xl font-display font-bold">
                    {settings.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="initials" className="text-xs font-mono uppercase">Avatar Initials</Label>
                  <Input
                    id="initials"
                    value={settings.initials}
                    onChange={(e) => updateSetting("initials", e.target.value.toUpperCase().slice(0, 2))}
                    className="rounded-sm border-border bg-background mt-1 max-w-[100px]"
                    maxLength={2}
                    data-testid="input-initials"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-mono uppercase">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => updateSetting("name", e.target.value)}
                    className="rounded-sm border-border bg-background"
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-mono uppercase">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting("email", e.target.value)}
                    className="rounded-sm border-border bg-background"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-mono uppercase">Role / Position</Label>
                  <Input
                    id="role"
                    value={settings.role}
                    onChange={(e) => updateSetting("role", e.target.value)}
                    className="rounded-sm border-border bg-background"
                    data-testid="input-role"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clearance" className="text-xs font-mono uppercase">Clearance Level</Label>
                  <Select
                    value={settings.clearance}
                    onValueChange={(value) => updateSetting("clearance", value)}
                  >
                    <SelectTrigger className="rounded-sm border-border bg-background" data-testid="select-clearance">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Level 1">Level 1 - Basic</SelectItem>
                      <SelectItem value="Level 2">Level 2 - Standard</SelectItem>
                      <SelectItem value="Level 3">Level 3 - Advanced</SelectItem>
                      <SelectItem value="Level 4">Level 4 - Classified</SelectItem>
                      <SelectItem value="Level 5">Level 5 - Top Secret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Preferences */}
          <Card className="border-border bg-card/50 rounded-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-primary/10 border border-primary/20">
                  <Globe className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">System</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase tracking-wider">
                    Display preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-xs font-mono uppercase">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => updateSetting("theme", value)}
                >
                  <SelectTrigger className="rounded-sm border-border bg-background" data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-xs font-mono uppercase">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => updateSetting("language", value)}
                >
                  <SelectTrigger className="rounded-sm border-border bg-background" data-testid="select-language">
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
                <Label htmlFor="timezone" className="text-xs font-mono uppercase">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => updateSetting("timezone", value)}
                >
                  <SelectTrigger className="rounded-sm border-border bg-background" data-testid="select-timezone">
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
          <Card className="border-border bg-card/50 rounded-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-primary/10 border border-primary/20">
                  <Bell className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Notifications</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase tracking-wider">
                    Alert preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Mission Alerts</Label>
                  <p className="text-xs text-muted-foreground">Critical mission updates</p>
                </div>
                <Switch
                  checked={settings.missionAlerts}
                  onCheckedChange={(checked) => updateSetting("missionAlerts", checked)}
                  data-testid="switch-mission-alerts"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Telemetry Alerts</Label>
                  <p className="text-xs text-muted-foreground">Real-time data anomalies</p>
                </div>
                <Switch
                  checked={settings.telemetryAlerts}
                  onCheckedChange={(checked) => updateSetting("telemetryAlerts", checked)}
                  data-testid="switch-telemetry-alerts"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">System Alerts</Label>
                  <p className="text-xs text-muted-foreground">Infrastructure warnings</p>
                </div>
                <Switch
                  checked={settings.systemAlerts}
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
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                  data-testid="switch-email-notifications"
                />
              </div>
            </CardContent>
          </Card>

          {/* Visualization */}
          <Card className="border-border bg-card/50 rounded-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-primary/10 border border-primary/20">
                  <Eye className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Visualization</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase tracking-wider">
                    Dashboard display
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refresh-rate" className="text-xs font-mono uppercase">Data Refresh Rate</Label>
                <Select
                  value={settings.refreshRate}
                  onValueChange={(value) => updateSetting("refreshRate", value)}
                >
                  <SelectTrigger className="rounded-sm border-border bg-background" data-testid="select-refresh-rate">
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

              <div className="space-y-2">
                <Label htmlFor="units" className="text-xs font-mono uppercase">Measurement Units</Label>
                <Select
                  value={settings.units}
                  onValueChange={(value) => updateSetting("units", value)}
                >
                  <SelectTrigger className="rounded-sm border-border bg-background" data-testid="select-units">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (km, kg, °C)</SelectItem>
                    <SelectItem value="imperial">Imperial (mi, lb, °F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Chart Animations</Label>
                  <p className="text-xs text-muted-foreground">Smooth transitions</p>
                </div>
                <Switch
                  checked={settings.chartAnimations}
                  onCheckedChange={(checked) => updateSetting("chartAnimations", checked)}
                  data-testid="switch-chart-animations"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-border bg-card/50 rounded-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-primary/10 border border-primary/20">
                  <Lock className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Security</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase tracking-wider">
                    Authentication settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-sm bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Authentication system is not yet configured. Password management will be available once user authentication is implemented.
                </p>
                <Button
                  variant="outline"
                  className="rounded-sm w-full"
                  disabled
                  data-testid="button-change-password"
                >
                  <Lock className="size-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API & Integrations */}
          <Card className="border-border bg-card/50 rounded-sm lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-primary/10 border border-primary/20">
                  <Plug className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">API & Integrations</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase tracking-wider">
                    External connections and webhooks
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-xs font-mono uppercase">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    value={settings.apiKey}
                    readOnly
                    className="rounded-sm border-border bg-background font-mono text-sm"
                    data-testid="input-api-key"
                  />
                  <Button
                    onClick={handleGenerateApiKey}
                    variant="outline"
                    className="rounded-sm"
                    data-testid="button-regenerate-api-key"
                  >
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this key to authenticate API requests. Keep it secure.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="webhook-url" className="text-xs font-mono uppercase">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => updateSetting("webhookUrl", e.target.value)}
                  placeholder="https://your-domain.com/webhook"
                  className="rounded-sm border-border bg-background"
                  data-testid="input-webhook-url"
                />
                <p className="text-xs text-muted-foreground">
                  Receive real-time mission updates at this endpoint.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
});

export default Settings;
