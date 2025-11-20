import { ArrowLeft, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchMissions } from "@/lib/api";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function Analytics() {
  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: fetchMissions,
  });

  const statusData = [
    { name: "Active", count: missions.filter(m => m.status === "Active").length },
    { name: "Pending", count: missions.filter(m => m.status === "Pending").length },
    { name: "Completed", count: missions.filter(m => m.status === "Completed").length },
  ];

  const priorityData = [
    { name: "High", count: missions.filter(m => m.priority === "High").length },
    { name: "Medium", count: missions.filter(m => m.priority === "Medium").length },
    { name: "Low", count: missions.filter(m => m.priority === "Low").length },
  ];

  const avgProgress = missions.length > 0
    ? Math.round(missions.reduce((sum, m) => sum + m.progress, 0) / missions.length)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Total Missions</span>
                <BarChart3 className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight">{missions.length}</h3>
                <p className="text-xs text-muted-foreground">All Time</p>
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
                <h3 className="text-2xl font-display font-bold tracking-tight">{avgProgress}%</h3>
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
                <h3 className="text-2xl font-display font-bold tracking-tight">
                  {missions.length > 0 
                    ? Math.round((missions.filter(m => m.status === "Completed").length / missions.length) * 100)
                    : 0}%
                </h3>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
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
      </div>
    </div>
  );
}
