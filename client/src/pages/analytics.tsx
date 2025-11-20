import { useMemo } from "react";
import { ArrowLeft, TrendingUp, BarChart3, PieChart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics } from "@/lib/api";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart } from "recharts";

export default function Analytics() {
  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  });

  const statusData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: "Active", count: analytics.activeMissions },
      { name: "Pending", count: analytics.totalMissions - analytics.activeMissions - analytics.completedMissions },
      { name: "Completed", count: analytics.completedMissions },
    ];
  }, [analytics]);

  const priorityData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: "Critical", count: analytics.priorityBreakdown.critical },
      { name: "High", count: analytics.priorityBreakdown.high },
      { name: "Medium", count: analytics.priorityBreakdown.medium },
      { name: "Low", count: analytics.priorityBreakdown.low },
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
    if (!analytics || analytics.totalMissions === 0) return 0;
    return Math.round((analytics.completedMissions / analytics.totalMissions) * 100);
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
              <h1 className="text-3xl font-display font-bold tracking-tight">Analytics</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                Mission Performance Insights
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Total Missions</span>
                <BarChart3 className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="analytics-total">
                  {analytics?.totalMissions || 0}
                </h3>
                <p className="text-xs text-muted-foreground">All Time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Active</span>
                <Activity className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="analytics-active">
                  {analytics?.activeMissions || 0}
                </h3>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Avg Progress</span>
                <TrendingUp className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="analytics-progress">
                  {analytics?.averageProgress || 0}%
                </h3>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Success Rate</span>
                <PieChart className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="analytics-success">
                  {successRate}%
                </h3>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border bg-card/50 rounded-sm">
            <CardHeader>
              <CardTitle className="text-lg font-display">Missions by Status</CardTitle>
              <CardDescription className="font-mono text-xs uppercase tracking-wider">Distribution Analysis</CardDescription>
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
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardHeader>
              <CardTitle className="text-lg font-display">Missions by Priority</CardTitle>
              <CardDescription className="font-mono text-xs uppercase tracking-wider">Priority Breakdown</CardDescription>
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
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card/50 rounded-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display">Recent Activity</CardTitle>
            <CardDescription className="font-mono text-xs uppercase tracking-wider">Last 10 Data Points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
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
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
