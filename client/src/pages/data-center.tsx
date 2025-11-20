import { useMemo, memo } from "react";
import { ArrowLeft, Database, HardDrive, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchDataHealth } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const DataCenter = memo(function DataCenter() {
  const { data: healthData = [] } = useQuery({
    queryKey: ["data-health"],
    queryFn: fetchDataHealth,
  });

  const stats = useMemo(() => {
    const totalStorage = healthData.reduce((sum, h) => sum + (h.storageTotal || 0), 0);
    const usedStorage = healthData.reduce((sum, h) => sum + (h.storageUsed || 0), 0);
    const operational = healthData.filter(h => h.status === "Operational").length;
    const avgReplicationLag = healthData.filter(h => h.replicationLag !== null).length > 0
      ? Math.round(
          healthData
            .filter(h => h.replicationLag !== null)
            .reduce((sum, h) => sum + (h.replicationLag || 0), 0) / 
          healthData.filter(h => h.replicationLag !== null).length
        )
      : 0;

    return {
      totalStorage,
      usedStorage,
      storagePercent: totalStorage > 0 ? Math.round((usedStorage / totalStorage) * 100) : 0,
      operational,
      total: healthData.length,
      avgReplicationLag,
    };
  }, [healthData]);

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
              <h1 className="text-3xl font-display font-bold tracking-tight">Data Center</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                System Health & Storage
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Storage Used</span>
                <Database className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="storage-used">
                  {stats.usedStorage} GB
                </h3>
                <p className="text-xs text-muted-foreground">of {stats.totalStorage} GB total</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-mono">
                <span className={stats.storagePercent > 80 ? "text-yellow-400" : "text-green-400"}>
                  {stats.storagePercent}%
                </span>
                <span className="text-muted-foreground ml-2">capacity</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">System Health</span>
                <CheckCircle2 className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="systems-operational">
                  {stats.operational}/{stats.total}
                </h3>
                <p className="text-xs text-muted-foreground">Systems Operational</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-mono">
                <span className={stats.operational === stats.total ? "text-green-400" : "text-yellow-400"}>
                  {stats.total > 0 ? Math.round((stats.operational / stats.total) * 100) : 0}%
                </span>
                <span className="text-muted-foreground ml-2">uptime</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Replication</span>
                <Clock className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="replication-lag">
                  {stats.avgReplicationLag}ms
                </h3>
                <p className="text-xs text-muted-foreground">Avg Lag</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-mono">
                <span className={stats.avgReplicationLag < 50 ? "text-green-400" : "text-yellow-400"}>
                  {stats.avgReplicationLag < 50 ? "Excellent" : "Good"}
                </span>
                <span className="text-muted-foreground ml-2">performance</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Components</span>
                <HardDrive className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="total-components">
                  {stats.total}
                </h3>
                <p className="text-xs text-muted-foreground">Monitored Systems</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-mono">
                <span className="text-primary">Active</span>
                <span className="text-muted-foreground ml-2">monitoring</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card/50 rounded-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display">System Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthData.map((health) => (
                <div
                  key={health.id}
                  className="flex items-center justify-between p-4 border border-border rounded-sm hover:bg-muted/30 transition-colors"
                  data-testid={`health-card-${health.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-10 rounded-full bg-muted">
                      {health.status === "Operational" ? (
                        <CheckCircle2 className="size-5 text-green-500" />
                      ) : (
                        <AlertCircle className="size-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm" data-testid={`health-component-${health.id}`}>
                        {health.component}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {health.replicationLag !== null && (
                          <>
                            <span data-testid={`health-lag-${health.id}`}>Lag: {health.replicationLag}ms</span>
                            <span>•</span>
                          </>
                        )}
                        {health.lastBackup && (
                          <span data-testid={`health-backup-${health.id}`}>
                            Backup: {formatDistanceToNow(new Date(health.lastBackup), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {health.storageUsed !== null && health.storageTotal !== null && (
                        <>
                          <p className="font-mono text-sm font-bold" data-testid={`health-storage-${health.id}`}>
                            {health.storageUsed} / {health.storageTotal} GB
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((health.storageUsed / health.storageTotal) * 100)}% used
                          </p>
                        </>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`rounded-sm text-xs ${
                        health.status === "Operational"
                          ? "border-green-500 text-green-500"
                          : "border-yellow-500 text-yellow-500"
                      }`}
                      data-testid={`health-status-${health.id}`}
                    >
                      {health.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {healthData.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No health data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default DataCenter;
