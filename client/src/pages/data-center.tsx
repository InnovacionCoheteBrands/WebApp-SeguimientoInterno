import { ArrowLeft, Database, HardDrive, Cpu, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchMissions } from "@/lib/api";

export default function DataCenter() {
  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: fetchMissions,
  });

  const totalMissions = missions.length;
  const activeMissions = missions.filter(m => m.status === "Active").length;
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
              <h1 className="text-3xl font-display font-bold tracking-tight">Data Center</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                System Metrics & Storage
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Database Size</span>
                <Database className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight">2.4 TB</h3>
                <p className="text-xs text-muted-foreground">Storage Used</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-mono">
                <span className="text-green-400">+120 GB</span>
                <span className="text-muted-foreground ml-2">this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Processing</span>
                <Cpu className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight">{avgProgress}%</h3>
                <p className="text-xs text-muted-foreground">Avg Completion</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-mono">
                <span className="text-primary">Active</span>
                <span className="text-muted-foreground ml-2">{activeMissions} missions</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Throughput</span>
                <Activity className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight">8.5k</h3>
                <p className="text-xs text-muted-foreground">Ops/Sec</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-mono">
                <span className="text-green-400">+15%</span>
                <span className="text-muted-foreground ml-2">optimized</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Total Records</span>
                <HardDrive className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight">{totalMissions}</h3>
                <p className="text-xs text-muted-foreground">Missions Stored</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-mono">
                <span className="text-primary">All Time</span>
                <span className="text-muted-foreground ml-2">records</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mission Statistics */}
        <Card className="border-border bg-card/50 rounded-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display">Mission Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {missions.slice(0, 10).map((mission) => (
                <div key={mission.id} className="flex items-center justify-between p-3 border border-border rounded-sm hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary">{mission.missionCode}</span>
                      <span className="font-medium text-sm">{mission.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="rounded-sm text-xs">
                        {mission.priority} Priority
                      </Badge>
                      <span>•</span>
                      <span>{mission.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold">{mission.progress}%</p>
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
