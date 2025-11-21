import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Rocket, 
  Activity, 
  Users, 
  Cpu,
  ShieldAlert,
  Plus,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp
} from "lucide-react";
import { MobileFAB } from "@/components/mobile-fab";
import { MetricsCarousel } from "@/components/metrics-carousel";
import { CompactMissionCard } from "@/components/compact-mission-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMissions, createMission, updateMission, deleteMission } from "@/lib/api";
import type { InsertMission, Mission } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useWebSocket } from "@/hooks/use-websocket";

export default function MissionControl() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [editMission, setEditMission] = useState<Partial<InsertMission>>({});
  const [progressValue, setProgressValue] = useState(0);
  const [telemetryData, setTelemetryData] = useState<Array<{name: string, value: number}>>([
    { name: "00:00", value: 40 },
    { name: "04:00", value: 30 },
    { name: "08:00", value: 65 },
    { name: "12:00", value: 85 },
    { name: "16:00", value: 55 },
    { name: "20:00", value: 70 },
    { name: "23:59", value: 60 },
  ]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  const [newMission, setNewMission] = useState<InsertMission>({
    missionCode: "",
    name: "",
    status: "Pending",
    progress: 0,
    priority: "Medium",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isConnected, lastMessage } = useWebSocket("/ws");

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: fetchMissions,
  });

  const createMissionMutation = useMutation({
    mutationFn: createMission,
    onSuccess: async (newMission) => {
      queryClient.setQueryData(["missions"], (oldMissions: Mission[] = []) => {
        return [...oldMissions, newMission];
      });
      setCreateDialogOpen(false);
      setNewMission({
        missionCode: "",
        name: "",
        status: "Pending",
        progress: 0,
        priority: "Medium",
      });
      toast({
        title: "Mission Created",
        description: "New mission has been successfully registered.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create mission. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMissionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateMission(id, data),
    onSuccess: async (updatedMission) => {
      queryClient.setQueryData(["missions"], (oldMissions: Mission[] = []) => {
        return oldMissions.map((mission) =>
          mission.id === updatedMission.id ? updatedMission : mission
        );
      });
      setEditDialogOpen(false);
      setProgressDialogOpen(false);
      toast({
        title: "Mission Updated",
        description: "Mission has been successfully updated.",
      });
    },
  });

  const deleteMissionMutation = useMutation({
    mutationFn: deleteMission,
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(["missions"], (oldMissions: Mission[] = []) => {
        return oldMissions.filter((mission) => mission.id !== variables);
      });
      setDeleteDialogOpen(false);
      toast({
        title: "Mission Deleted",
        description: "Mission has been removed from the system.",
      });
    },
  });

  const handleCreateMission = useCallback(() => {
    if (!newMission.missionCode || !newMission.name) {
      toast({
        title: "Validation Error",
        description: "Mission code and name are required.",
        variant: "destructive",
      });
      return;
    }
    createMissionMutation.mutate(newMission);
  }, [newMission, createMissionMutation, toast]);

  const handleEditMission = useCallback(() => {
    if (!selectedMission) return;
    updateMissionMutation.mutate({
      id: selectedMission.id,
      data: editMission,
    });
  }, [selectedMission, editMission, updateMissionMutation]);

  const handleUpdateProgress = useCallback(() => {
    if (!selectedMission) return;
    updateMissionMutation.mutate({
      id: selectedMission.id,
      data: { progress: progressValue },
    });
  }, [selectedMission, progressValue, updateMissionMutation]);

  const handleDeleteMission = useCallback(() => {
    if (!selectedMission) return;
    deleteMissionMutation.mutate(selectedMission.id);
  }, [selectedMission, deleteMissionMutation]);

  const openEditDialog = useCallback((mission: Mission) => {
    setSelectedMission(mission);
    setEditMission({
      missionCode: mission.missionCode,
      name: mission.name,
      priority: mission.priority,
      status: mission.status,
    });
    setEditDialogOpen(true);
  }, []);

  const openProgressDialog = useCallback((mission: Mission) => {
    setSelectedMission(mission);
    setProgressValue(mission.progress);
    setProgressDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((mission: Mission) => {
    setSelectedMission(mission);
    setDeleteDialogOpen(true);
  }, []);

  const handleCompleteMission = useCallback((id: number) => {
    updateMissionMutation.mutate({
      id,
      data: { status: "Completed", progress: 100 },
    });
  }, [updateMissionMutation]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === "telemetry") {
        setTelemetryData((prev) => {
          const newData = [...prev, {
            name: lastMessage.data.name,
            value: lastMessage.data.value
          }];
          return newData.slice(-24);
        });
      } else if (lastMessage.type === "mission_update") {
        queryClient.invalidateQueries({ queryKey: ["missions"] });
      } else if (lastMessage.type === "metrics_update") {
        setSystemMetrics(lastMessage.data);
      }
    }
  }, [lastMessage, queryClient]);


  const activeMissions = useMemo(() => {
    let filtered = missions.filter(m => m.status === "Active" || m.status === "Pending");
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(m => m.status === statusFilter);
    }
    
    if (priorityFilter !== "all") {
      filtered = filtered.filter(m => m.priority === priorityFilter);
    }
    
    return filtered;
  }, [missions, statusFilter, priorityFilter]);

  const operationalCount = useMemo(() => 
    missions.filter(m => m.status === "Active").length,
    [missions]
  );

  return (
    <>
      {/* Dashboard Content */}
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Mobile Metrics Carousel */}
          <MetricsCarousel
            fleetStatus={{ operational: operationalCount, total: missions.length }}
            personnel={{ active: systemMetrics?.activePersonnel?.value ? parseInt(systemMetrics.activePersonnel.value.replace(/,/g, '')) : 1284, trend: systemMetrics?.activePersonnel?.trend || "+12%" }}
            systemLoad={{ percent: systemMetrics?.systemLoad?.value ? parseInt(systemMetrics.systemLoad.value) : 42, status: systemMetrics?.systemLoad?.trendLabel || "optimized" }}
            threatLevel={{ level: systemMetrics?.threatLevel?.value || "LOW", incidents: systemMetrics?.threatLevel?.trend ? parseInt(systemMetrics.threatLevel.trend) : 0 }}
          />

          {/* Status Overview - Desktop */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatusCard 
              title="Fleet Status" 
              value={systemMetrics?.fleetStatus?.value || `${operationalCount}/${missions.length}`} 
              label={systemMetrics?.fleetStatus?.label || "Operational"} 
              icon={Rocket} 
              trend={systemMetrics?.fleetStatus?.trend || `+${operationalCount}`} 
              trendLabel={systemMetrics?.fleetStatus?.trendLabel || "active missions"} 
            />
            <StatusCard 
              title="Active Personnel" 
              value={systemMetrics?.activePersonnel?.value || "1,284"} 
              label={systemMetrics?.activePersonnel?.label || "On Duty"} 
              icon={Users} 
              trend={systemMetrics?.activePersonnel?.trend || "+12%"} 
              trendLabel={systemMetrics?.activePersonnel?.trendLabel || "vs last shift"} 
            />
            <StatusCard 
              title="System Load" 
              value={systemMetrics?.systemLoad?.value || "42%"} 
              label={systemMetrics?.systemLoad?.label || "Capacity Used"} 
              icon={Cpu} 
              trend={systemMetrics?.systemLoad?.trend || "-5%"} 
              trendLabel={systemMetrics?.systemLoad?.trendLabel || "optimized"} 
              success={systemMetrics?.systemLoad?.success !== undefined ? systemMetrics.systemLoad.success : true} 
            />
            <StatusCard 
              title="Threat Level" 
              value={systemMetrics?.threatLevel?.value || "LOW"} 
              label={systemMetrics?.threatLevel?.label || "Secure"} 
              icon={ShieldAlert} 
              trend={systemMetrics?.threatLevel?.trend || "0"} 
              trendLabel={systemMetrics?.threatLevel?.trendLabel || "incidents"} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Chart */}
            <Card className="lg:col-span-2 border-border bg-card/50 rounded-sm">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-base sm:text-lg font-display flex items-center justify-between">
                  <span>Trajectory Analysis</span>
                  <Badge variant="outline" className="rounded-sm font-mono font-normal text-primary border-primary/30 bg-primary/5 text-xs">LIVE</Badge>
                </CardTitle>
                <CardDescription className="font-mono text-xs uppercase tracking-wider">Real-time telemetry data</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="h-[320px] sm:h-[380px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetryData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(43 100% 50%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(43 100% 50%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
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
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '2px',
                          fontFamily: 'var(--font-mono)'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Active Missions List */}
            <Card className="border-border bg-card/50 rounded-sm flex flex-col">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-display">Active Missions</CardTitle>
                    <CardDescription className="font-mono text-xs uppercase tracking-wider">Priority Queue</CardDescription>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="flex-1 sm:w-[100px] h-11 text-xs rounded-sm border-border" data-testid="select-status-filter">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="flex-1 sm:w-[100px] h-11 text-xs rounded-sm border-border" data-testid="select-priority-filter">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4 sm:p-6 pt-0">
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8">Loading missions...</div>
                ) : activeMissions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="mb-2">No active missions</p>
                    <p className="text-xs">Create a new mission to get started</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Grid - 2 Columns */}
                    <div className="grid grid-cols-2 gap-3 md:hidden">
                      {activeMissions.slice(0, 6).map((mission) => (
                        <CompactMissionCard
                          key={mission.id}
                          id={mission.id}
                          missionCode={mission.missionCode}
                          name={mission.name}
                          status={mission.status}
                          priority={mission.priority}
                          progress={mission.progress}
                          createdAt={mission.createdAt ? new Date(mission.createdAt).toISOString() : ""}
                          updatedAt={mission.updatedAt ? new Date(mission.updatedAt).toISOString() : ""}
                          onMenuClick={() => {
                            setSelectedMission(mission);
                            // Open a dropdown menu or action sheet
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Desktop List */}
                    <div className="hidden md:block space-y-3 sm:space-y-4">
                      {activeMissions.slice(0, 4).map((mission) => (
                        <div key={mission.id} className="group flex flex-col sm:flex-row items-start justify-between p-3 rounded-sm border border-transparent hover:border-border hover:bg-muted/30 transition-all gap-3" data-testid={`mission-card-${mission.id}`}>
                        <div className="space-y-1 flex-1 w-full sm:w-auto">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-primary" data-testid={`mission-code-${mission.id}`}>{mission.missionCode}</span>
                            <span className="font-medium text-sm" data-testid={`mission-name-${mission.id}`}>{mission.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={
                              mission.status === "Active" ? "text-green-400" : 
                              mission.status === "Pending" ? "text-yellow-400" : "text-blue-400"
                            } data-testid={`mission-status-${mission.id}`}>● {mission.status}</span>
                            <span>•</span>
                            <span data-testid={`mission-priority-${mission.id}`}>{mission.priority} Priority</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="flex-1 sm:w-24">
                            <div className="flex justify-between text-[10px] mb-1 font-mono text-muted-foreground">
                              <span>PROG</span>
                              <span data-testid={`mission-progress-${mission.id}`}>{mission.progress}%</span>
                            </div>
                            <Progress value={mission.progress} className="h-1 bg-muted" indicatorClassName={mission.progress === 100 ? "bg-green-500" : "bg-primary"} />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-11 w-11" data-testid={`button-menu-${mission.id}`}>
                                <MoreVertical className="size-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border">
                              <DropdownMenuItem onClick={() => openEditDialog(mission)} data-testid={`menu-edit-${mission.id}`}>
                                <Edit className="size-3 mr-2" />
                                Edit Mission
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openProgressDialog(mission)} data-testid={`menu-progress-${mission.id}`}>
                                <TrendingUp className="size-3 mr-2" />
                                Update Progress
                              </DropdownMenuItem>
                              {mission.status !== "Completed" && (
                                <DropdownMenuItem onClick={() => handleCompleteMission(mission.id)} data-testid={`menu-complete-${mission.id}`}>
                                  <CheckCircle2 className="size-3 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(mission)}
                                className="text-destructive focus:text-destructive"
                                data-testid={`menu-delete-${mission.id}`}
                              >
                                <Trash2 className="size-3 mr-2" />
                                Delete Mission
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    </div>
                  </>
                )}
                {activeMissions.length > 4 && (
                  <Button variant="outline" className="w-full mt-4 rounded-sm border-dashed border-border hover:bg-muted hover:text-primary font-mono text-xs uppercase h-11">
                    View All Missions ({activeMissions.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
            <InfoWidget title="Atmospheric Conditions" value="Stable" subtitle="Visibility 100%" />
            <InfoWidget title="Network Latency" value="24ms" subtitle="Starlink Node: Alpha" />
            <InfoWidget title="Power Reserves" value="98.4%" subtitle="Solar Array: Optimal" />
          </div>

        </div>

      {/* Create Mission Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg sm:text-xl">Create New Mission</DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase tracking-wider">
              Initialize mission parameters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mission-code" className="text-xs font-mono uppercase">Mission Code</Label>
              <Input
                id="mission-code"
                placeholder="MSN-XXX"
                value={newMission.missionCode}
                onChange={(e) => setNewMission({ ...newMission, missionCode: e.target.value })}
                className="rounded-sm border-border bg-background h-11"
                data-testid="input-mission-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission-name" className="text-xs font-mono uppercase">Mission Name</Label>
              <Input
                id="mission-name"
                placeholder="Enter mission name"
                value={newMission.name}
                onChange={(e) => setNewMission({ ...newMission, name: e.target.value })}
                className="rounded-sm border-border bg-background h-11"
                data-testid="input-mission-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-xs font-mono uppercase">Priority Level</Label>
              <Select value={newMission.priority} onValueChange={(val) => setNewMission({ ...newMission, priority: val })}>
                <SelectTrigger className="rounded-sm border-border bg-background h-11" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-mono uppercase">Status</Label>
              <Select value={newMission.status} onValueChange={(val) => setNewMission({ ...newMission, status: val })}>
                <SelectTrigger className="rounded-sm border-border bg-background h-11" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-sm h-11" data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMission}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              disabled={createMissionMutation.isPending}
              data-testid="button-submit-mission"
            >
              {createMissionMutation.isPending ? "Creating..." : "Create Mission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mission Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Mission</DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase tracking-wider">
              Update mission parameters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase">Mission Code</Label>
              <Input
                value={editMission.missionCode || ""}
                onChange={(e) => setEditMission({ ...editMission, missionCode: e.target.value })}
                className="rounded-sm border-border bg-background h-11"
                data-testid="input-edit-code"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase">Mission Name</Label>
              <Input
                value={editMission.name || ""}
                onChange={(e) => setEditMission({ ...editMission, name: e.target.value })}
                className="rounded-sm border-border bg-background h-11"
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase">Priority</Label>
              <Select value={editMission.priority} onValueChange={(val) => setEditMission({ ...editMission, priority: val })}>
                <SelectTrigger className="rounded-sm border-border bg-background h-11" data-testid="select-edit-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase">Status</Label>
              <Select value={editMission.status} onValueChange={(val) => setEditMission({ ...editMission, status: val })}>
                <SelectTrigger className="rounded-sm border-border bg-background h-11" data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-sm h-11">
              Cancel
            </Button>
            <Button 
              onClick={handleEditMission}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              disabled={updateMissionMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateMissionMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Update Mission Progress</DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase tracking-wider">
              Adjust completion percentage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <Label className="text-xs font-mono uppercase">Progress</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={progressValue}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setProgressValue(val);
                    }}
                    className="w-20 rounded-sm border-border bg-background text-center font-display font-bold h-11"
                    data-testid="input-progress"
                  />
                  <span className="text-xl font-display font-bold text-primary">%</span>
                </div>
              </div>
              <Slider
                value={[progressValue]}
                onValueChange={(val) => setProgressValue(val[0])}
                max={100}
                step={5}
                className="w-full"
                data-testid="slider-progress"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressDialogOpen(false)} className="rounded-sm h-11">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProgress}
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              disabled={updateMissionMutation.isPending}
              data-testid="button-save-progress"
            >
              {updateMissionMutation.isPending ? "Updating..." : "Update Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Confirm Mission Deletion</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              Are you sure you want to delete mission <span className="text-primary font-bold">{selectedMission?.missionCode}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMission}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMissionMutation.isPending ? "Deleting..." : "Delete Mission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Action Button */}
      <MobileFAB onClick={() => setCreateDialogOpen(true)} />
    </>
  );
}


function StatusCard({ title, value, label, icon: Icon, trend, trendLabel, success }: any) {
  return (
    <Card className="border-border bg-card/50 rounded-sm hover:border-primary/50 transition-colors group">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-[10px] sm:text-xs font-mono uppercase text-muted-foreground tracking-wider">{title}</span>
          <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-display font-bold tracking-tight">{value}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
        </div>
        <div className="mt-3 sm:mt-4 flex items-center text-[10px] sm:text-xs font-mono">
          <span className={`${success || trend.startsWith("+") ? "text-green-400" : "text-primary"}`}>{trend}</span>
          <span className="text-muted-foreground ml-2">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoWidget({ title, value, subtitle }: any) {
  return (
    <div className="border border-border bg-card/30 p-4 rounded-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">{title}</p>
        <p className="font-display font-semibold text-lg">{value}</p>
      </div>
      <div className="text-right">
        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden mb-1">
           <div className="h-full bg-primary w-[70%] animate-pulse"></div>
        </div>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
