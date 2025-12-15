import { useMemo, memo } from "react";
import { ArrowLeft, TrendingUp, Target, BarChart3, PieChart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics } from "@/lib/api";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart } from "recharts";
import { useSystemSettings } from "@/hooks/use-system-settings";

const Analytics = memo(function Analytics() {
  const { data: settings } = useSystemSettings();
  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  });

  const statusData = useMemo(() => {
    if (!analytics) return [];
    const planning = Math.max(0, analytics.totalCampaigns - analytics.activeCampaigns - analytics.completedCampaigns);
    return [
      { name: "Activas", count: analytics.activeCampaigns },
      { name: "Planificación", count: planning },
      { name: "Completadas", count: analytics.completedCampaigns },
    ];
  }, [analytics]);

  const priorityData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: "Crítica", count: analytics.priorityBreakdown.critical },
      { name: "Alta", count: analytics.priorityBreakdown.high },
      { name: "Media", count: analytics.priorityBreakdown.medium },
      { name: "Baja", count: analytics.priorityBreakdown.low },
    ];
  }, [analytics]);

  const channelData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: "Meta", count: analytics.channelBreakdown.meta },
      { name: "Google Ads", count: analytics.channelBreakdown.googleAds },
      { name: "LinkedIn", count: analytics.channelBreakdown.linkedin },
      { name: "Email", count: analytics.channelBreakdown.email },
      { name: "Otros", count: analytics.channelBreakdown.other },
    ];
  }, [analytics]);

  const recentActivity = useMemo(() => {
    if (!analytics) return [];
    return analytics.recentActivity.slice(-10).map((item) => ({
      time: item.name,
      value: item.value,
    }));
  }, [analytics]);

  const successRate = useMemo(() => {
    if (!analytics || analytics.totalCampaigns === 0) return 0;
    return Math.round((analytics.completedCampaigns / analytics.totalCampaigns) * 100);
  }, [analytics]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="rounded-sm" data-testid="button-back">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">KPIs de Marketing</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                Análisis de Rendimiento
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card status="default" className="bg-zinc-900 border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-zinc-500 tracking-wider">Total de Campañas</span>
                <BarChart3 className="size-4 text-zinc-500 group-hover:text-amber-500 transition-colors" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-medium tracking-tight text-foreground" data-testid="analytics-total">
                  {analytics?.totalCampaigns || 0}
                </h3>
                <p className="text-xs text-zinc-500">Todas las Campañas</p>
              </div>
            </CardContent>
          </Card>

          <Card status="info" className="bg-zinc-900 border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-zinc-500 tracking-wider">Campañas Activas</span>
                <Activity className="size-4 text-zinc-500 group-hover:text-blue-500 transition-colors" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-medium tracking-tight text-foreground" data-testid="analytics-active">
                  {analytics?.activeCampaigns || 0}
                </h3>
                <p className="text-xs text-zinc-500">En Progreso</p>
              </div>
            </CardContent>
          </Card>

          <Card status="warning" className="bg-zinc-900 border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-zinc-500 tracking-wider">Progreso Promedio</span>
                <TrendingUp className="size-4 text-zinc-500 group-hover:text-orange-500 transition-colors" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-medium tracking-tight text-foreground" data-testid="analytics-progress">
                  {analytics?.averageProgress || 0}%
                </h3>
                <p className="text-xs text-zinc-500">Tasa de Completado</p>
              </div>
            </CardContent>
          </Card>

          <Card status="success" className="bg-zinc-900 border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-zinc-500 tracking-wider">Tasa de Finalización</span>
                <Target className="size-4 text-zinc-500 group-hover:text-green-500 transition-colors" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-medium tracking-tight text-foreground" data-testid="analytics-success">
                  {successRate}%
                </h3>
                <p className="text-xs text-zinc-500">Completadas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-zinc-800 bg-zinc-900/50 rounded-sm">
            <CardHeader>
              <CardTitle className="text-lg font-display">Campañas por Estado</CardTitle>
              <CardDescription className="font-mono text-xs uppercase tracking-wider">Análisis de Distribución</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} isAnimationActive={settings?.chartAnimations ?? true} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50 rounded-sm">
            <CardHeader>
              <CardTitle className="text-lg font-display">Campañas por Prioridad</CardTitle>
              <CardDescription className="font-mono text-xs uppercase tracking-wider">Desglose por Prioridad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} isAnimationActive={settings?.chartAnimations ?? true} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-zinc-800 bg-zinc-900/50 rounded-sm">
            <CardHeader>
              <CardTitle className="text-lg font-display">Campañas por Canal</CardTitle>
              <CardDescription className="font-mono text-xs uppercase tracking-wider">Distribución de Canales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} isAnimationActive={settings?.chartAnimations ?? true} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50 rounded-sm">
            <CardHeader>
              <CardTitle className="text-lg font-display">Rendimiento Reciente</CardTitle>
              <CardDescription className="font-mono text-xs uppercase tracking-wider">Últimos 10 Puntos de Datos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={settings?.chartAnimations ?? true} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

export default Analytics;
