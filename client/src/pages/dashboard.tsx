import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { 
  LayoutDashboard, 
  Rocket, 
  Activity, 
  Users, 
  Settings, 
  Bell, 
  Search,
  Menu,
  Globe,
  Database,
  Cpu,
  ShieldAlert,
  Plus,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  Download,
  FileJson,
  FileText
} from "lucide-react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
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
  DialogTrigger,
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import logoUrl from "@assets/Logo Cohete Brands_1763657286156.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchMissions, createMission, updateMission, deleteMission, fetchTelemetryData } from "@/lib/api";
import type { InsertMission, Mission } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useWebSocket } from "@/hooks/use-websocket";
import { exportToCSV, exportToJSON } from "@/lib/export";

export default function MissionControl() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [commandOpen, setCommandOpen] = useState(false);
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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar/50 backdrop-blur-sm sticky top-0 h-screen z-30">
        <div className="p-6 flex items-center justify-center border-b border-border h-24">
          <img 
            src={logoUrl} 
            alt="Cohete Brands" 
            className="h-16 w-auto object-contain filter invert hue-rotate-180 brightness-110 contrast-125"
          />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavButton icon={LayoutDashboard} label="Mission Control" active href="/" />
          <NavButton icon={Globe} label="Fleet Tracking" href="/fleet-tracking" />
          <NavButton icon={Database} label="Data Center" href="/data-center" />
          <NavButton icon={Users} label="Personnel" href="/personnel" />
          <NavButton icon={Activity} label="Analytics" href="/analytics" />
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-2">Systems</p>
            <NavButton icon={Cpu} label="Hardware" />
            <NavButton icon={ShieldAlert} label="Security" />
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Link href="/profile" className="flex-1">
              <div className="flex items-center gap-3 p-2 rounded hover:bg-sidebar-accent cursor-pointer transition-colors" data-testid="button-user-profile">
                <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center">
                  <span className="font-display font-bold">CM</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Cmdr. Shepard</p>
                  <p className="text-xs text-muted-foreground truncate">Level 5 Clearance</p>
                </div>
              </div>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="rounded-sm shrink-0 h-11 w-11" data-testid="button-settings">
                <Settings className="size-5" />
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar - Hidden, replaced with bottom navigation */}
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetContent side="left" className="hidden w-64 p-0 border-r border-border bg-sidebar flex flex-col">
          <div className="p-6 flex items-center justify-center border-b border-border h-24">
             <img 
              src={logoUrl} 
              alt="Cohete Brands" 
              className="h-16 w-auto object-contain filter invert hue-rotate-180 brightness-110 contrast-125"
            />
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <NavButton icon={LayoutDashboard} label="Mission Control" active href="/" />
            <NavButton icon={Globe} label="Fleet Tracking" href="/fleet-tracking" />
            <NavButton icon={Database} label="Data Center" href="/data-center" />
            <NavButton icon={Users} label="Personnel" href="/personnel" />
            <NavButton icon={Activity} label="Analytics" href="/analytics" />
            <div className="pt-4 pb-2">
              <p className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-2">Systems</p>
              <NavButton icon={Cpu} label="Hardware" />
              <NavButton icon={ShieldAlert} label="Security" />
            </div>
          </nav>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex-1">
                <div className="flex items-center gap-3 p-2 rounded hover:bg-sidebar-accent cursor-pointer transition-colors" data-testid="button-user-profile-mobile">
                  <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center">
                    <span className="font-display font-bold">CM</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Cmdr. Shepard</p>
                    <p className="text-xs text-muted-foreground truncate">Level 5 Clearance</p>
                  </div>
                </div>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="rounded-sm shrink-0 h-11 w-11" data-testid="button-settings-mobile">
                  <Settings className="size-5" />
                </Button>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-0">
        
        {/* Top Bar */}
        <header className="h-14 sm:h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-11 w-11" 
              onClick={() => setCommandOpen(true)}
              data-testid="button-search-mobile"
            >
              <Search className="size-5" />
            </Button>
            <div className="hidden md:flex items-center gap-2 text-muted-foreground bg-card border border-input rounded-sm px-3 py-1.5 w-64 cursor-pointer" onClick={() => setCommandOpen(true)}>
              <Search className="size-4" />
              <input 
                type="text" 
                placeholder="Search command..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50 pointer-events-none"
                readOnly
              />
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              SYSTEM OPTIMAL
            </div>
            <Button variant="outline" size="icon" className="rounded-sm border-border hover:bg-accent hover:text-accent-foreground h-11 w-11" data-testid="button-notifications">
              <Bell className="size-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-sm border-border hover:bg-accent hover:text-accent-foreground h-11 w-11" data-testid="button-export">
                  <Download className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    exportToCSV(missions);
                    toast({
                      title: "Export Successful",
                      description: "Missions exported as CSV",
                    });
                  }}
                  data-testid="export-csv"
                >
                  <FileText className="size-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    exportToJSON(missions);
                    toast({
                      title: "Export Successful",
                      description: "Missions exported as JSON",
                    });
                  }}
                  data-testid="export-json"
                >
                  <FileJson className="size-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="rounded-sm font-display font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,184,0,0.3)] h-11 min-w-11 px-3 sm:px-4"
                  data-testid="button-create-mission"
                >
                  <Plus className="size-5 sm:size-4 sm:mr-2" />
                  <span className="hidden sm:inline">NEW MISSION</span>
                </Button>
              </DialogTrigger>
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
          </div>
        </header>

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
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg font-display flex items-center justify-between">
                  <span>Trajectory Analysis</span>
                  <Badge variant="outline" className="rounded-sm font-mono font-normal text-primary border-primary/30 bg-primary/5 text-xs">LIVE</Badge>
                </CardTitle>
                <CardDescription className="font-mono text-xs uppercase tracking-wider">Real-time telemetry data</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="h-[250px] sm:h-[300px] w-full">
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
                          createdAt={mission.createdAt}
                          updatedAt={mission.updatedAt}
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
      </main>

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

      {/* Command Menu */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search missions..." data-testid="input-search-command" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Missions">
            {missions.map((mission) => (
              <CommandItem
                key={mission.id}
                onSelect={() => {
                  setSelectedMission(mission);
                  setCommandOpen(false);
                  openProgressDialog(mission);
                }}
                data-testid={`command-mission-${mission.id}`}
              >
                <Rocket className="mr-2 h-4 w-4" />
                <span className="font-mono text-xs mr-2">{mission.missionCode}</span>
                <span>{mission.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                setCommandOpen(false);
                setCreateDialogOpen(true);
              }}
              data-testid="command-new-mission"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Mission</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Floating Action Button */}
      <MobileFAB onClick={() => setCreateDialogOpen(true)} />
    </div>
  );
}

function NavButton({ icon: Icon, label, active = false, href }: { icon: any, label: string, active?: boolean, href?: string }) {
  const content = (
    <>
      <Icon className={`size-4 ${active ? "text-primary" : ""}`} />
      <span className="font-medium tracking-wide text-sm">{label}</span>
    </>
  );

  const className = `w-full justify-start gap-3 px-4 py-2 h-11 rounded-sm transition-all duration-200 ${
    active 
      ? "bg-sidebar-accent text-primary border-r-2 border-primary" 
      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
  }`;

  if (href) {
    return (
      <Link href={href}>
        <Button variant="ghost" className={className}>
          {content}
        </Button>
      </Link>
    );
  }

  return (
    <Button variant="ghost" className={className}>
      {content}
    </Button>
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
