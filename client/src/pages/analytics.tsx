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
    <div className="min-h-screen bg-[#030303] text-zinc-100 p-3 sm:p-8 font-sans selection:bg-primary/30">
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Intelligence Header */}
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
                  <Activity className="size-5" />
                </div>
                <h1 className="text-4xl font-display italic tracking-tight text-white">Marketing Analytics</h1>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.4em] pl-1 opacity-60">High-Performance Performance Monitoring Node</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Live Stream Connected</span>
          </div>
        </div>

        {/* Strategic KPIs Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-400/30 to-transparent" />
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="size-12 rounded-2xl bg-zinc-500/10 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-500/20 transition-all duration-500">
                    <BarChart3 className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-display font-bold italic tracking-tighter text-white">{analytics?.totalCampaigns || 0}</p>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Total Campaigns</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="size-12 rounded-2xl bg-blue-500/10 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-all duration-500">
                    <Activity className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-display font-bold italic tracking-tighter text-white">{analytics?.activeCampaigns || 0}</p>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Active Deployments</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="size-12 rounded-2xl bg-primary/10 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all duration-500">
                    <TrendingUp className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-display font-bold italic tracking-tighter text-white">{analytics?.averageProgress || 0}%</p>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Average Velocity</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="size-12 rounded-2xl bg-emerald-500/10 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-500">
                    <Target className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-display font-bold italic tracking-tighter text-white">{successRate}%</p>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Objective Yield</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualization Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Distribution */}
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden group/viz">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-display italic text-white tracking-tight">Status Distribution</CardTitle>
                  <CardDescription className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Pipeline Allocation Matrix</CardDescription>
                </div>
                <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <PieChart className="size-4 text-zinc-500 group-hover/viz:text-primary transition-colors" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(var(--primary), 1)" />
                        <stop offset="100%" stopColor="rgba(var(--primary), 0.1)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                      dy={10}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{
                        backgroundColor: '#030303',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}
                      itemStyle={{ color: 'rgba(var(--primary), 1)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#barGradient)" 
                      radius={[12, 12, 0, 0]} 
                      isAnimationActive={settings?.chartAnimations ?? true}
                      className="drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Priority Matrix */}
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden group/viz">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-display italic text-white tracking-tight">Priority Spectrum</CardTitle>
                  <CardDescription className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Resource Criticality Analysis</CardDescription>
                </div>
                <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Target className="size-4 text-zinc-500 group-hover/viz:text-emerald-400 transition-colors" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <defs>
                      <linearGradient id="priorityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b98122" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                      dy={10}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{
                        backgroundColor: '#030303',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#priorityGradient)" 
                      radius={[12, 12, 0, 0]} 
                      isAnimationActive={settings?.chartAnimations ?? true} 
                      className="drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Channel Analytics */}
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden group/viz">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-display italic text-white tracking-tight">Channel Stream</CardTitle>
                  <CardDescription className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Acquisition Node Performance</CardDescription>
                </div>
                <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Activity className="size-4 text-zinc-500 group-hover/viz:text-blue-400 transition-colors" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData}>
                    <defs>
                      <linearGradient id="channelGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#60a5fa22" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                      dy={10}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{
                        backgroundColor: '#030303',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#channelGradient)" 
                      radius={[12, 12, 0, 0]} 
                      isAnimationActive={settings?.chartAnimations ?? true} 
                      className="drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Stream */}
          <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/10 ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden group/viz">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-display italic text-white tracking-tight">Performance Flow</CardTitle>
                  <CardDescription className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Real-time Activity Oscilloscope</CardDescription>
                </div>
                <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <TrendingUp className="size-4 text-zinc-500 group-hover/viz:text-primary transition-colors" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentActivity}>
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={8}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                      dy={10}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="var(--font-mono)"
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#030303',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="rgba(var(--primary), 1)" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#030303', stroke: 'rgba(var(--primary), 1)', strokeWidth: 2 }} 
                      activeDot={{ r: 6, fill: 'rgba(var(--primary), 1)', stroke: '#030303', strokeWidth: 2 }}
                      isAnimationActive={settings?.chartAnimations ?? true} 
                      filter="url(#glow)"
                    />
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
