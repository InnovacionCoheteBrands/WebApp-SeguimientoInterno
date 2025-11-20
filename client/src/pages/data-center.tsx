import { useMemo, memo, useState } from "react";
import { ArrowLeft, Database, HardDrive, AlertCircle, CheckCircle2, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDataHealth, createDataHealth, updateDataHealth, deleteDataHealth } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { InsertDataHealth, DataHealth } from "@shared/schema";

const DataCenter = memo(function DataCenter() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHealth, setEditingHealth] = useState<DataHealth | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const [formData, setFormData] = useState<Partial<InsertDataHealth>>({
    component: "",
    status: "Operational",
    storageUsed: null,
    storageTotal: null,
    replicationLag: null,
  });

  const createMutation = useMutation({
    mutationFn: createDataHealth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-health"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Data health entry created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertDataHealth> }) =>
      updateDataHealth(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-health"] });
      setIsDialogOpen(false);
      setEditingHealth(null);
      resetForm();
      toast({ title: "Success", description: "Data health entry updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDataHealth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-health"] });
      setDeleteId(null);
      toast({ title: "Success", description: "Data health entry deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      component: "",
      status: "Operational",
      storageUsed: null,
      storageTotal: null,
      replicationLag: null,
    });
    setEditingHealth(null);
  };

  const handleOpenDialog = (health?: DataHealth) => {
    if (health) {
      setEditingHealth(health);
      setFormData({
        component: health.component,
        status: health.status,
        storageUsed: health.storageUsed,
        storageTotal: health.storageTotal,
        replicationLag: health.replicationLag,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.component) {
      toast({ title: "Error", description: "Please enter a component name", variant: "destructive" });
      return;
    }

    if (editingHealth) {
      updateMutation.mutate({ id: editingHealth.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertDataHealth);
    }
  };

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
              <h1 className="text-3xl font-display font-bold tracking-tight">Data Center Administration</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                Manage System Health & Storage
              </p>
            </div>
          </div>
          <Button 
            onClick={() => handleOpenDialog()} 
            className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-new-health"
          >
            <Plus className="size-4 mr-2" />
            New Component
          </Button>
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(health)}
                        className="rounded-sm"
                        data-testid={`button-edit-health-${health.id}`}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(health.id)}
                        className="rounded-sm text-destructive hover:text-destructive"
                        data-testid={`button-delete-health-${health.id}`}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-sm">
          <DialogHeader>
            <DialogTitle>{editingHealth ? "Edit Component" : "New System Component"}</DialogTitle>
            <DialogDescription>
              {editingHealth ? "Update the system component health data" : "Add a new system component for monitoring"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="component">Component Name *</Label>
              <Input
                id="component"
                value={formData.component}
                onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                placeholder="e.g., Primary Database"
                data-testid="input-component"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as "Operational" | "Degraded" })}
              >
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operational">Operational</SelectItem>
                  <SelectItem value="Degraded">Degraded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storageUsed">Storage Used (GB)</Label>
                <Input
                  id="storageUsed"
                  type="number"
                  value={formData.storageUsed ?? ""}
                  onChange={(e) => setFormData({ ...formData, storageUsed: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Optional"
                  data-testid="input-storage-used"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageTotal">Storage Total (GB)</Label>
                <Input
                  id="storageTotal"
                  type="number"
                  value={formData.storageTotal ?? ""}
                  onChange={(e) => setFormData({ ...formData, storageTotal: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Optional"
                  data-testid="input-storage-total"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replicationLag">Replication Lag (ms)</Label>
              <Input
                id="replicationLag"
                type="number"
                value={formData.replicationLag ?? ""}
                onChange={(e) => setFormData({ ...formData, replicationLag: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Optional"
                data-testid="input-replication-lag"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-sm"
                data-testid="button-cancel-health"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-sm"
                disabled={createMutation.isPending}
                data-testid="button-submit-health"
              >
                {editingHealth ? "Update" : "Create"} Component
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this system component? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" data-testid="button-cancel-delete-health">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-health"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default DataCenter;
