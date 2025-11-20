import { useState } from "react";
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
  X,
  CheckCircle2
} from "lucide-react";
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
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import logoUrl from "@assets/Logo Cohete Brands_1763657286156.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMissions, createMission, updateMission, deleteMission, fetchTelemetryData } from "@/lib/api";
import type { InsertMission } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const performanceData = [
  { name: "00:00", value: 40 },
  { name: "04:00", value: 30 },
  { name: "08:00", value: 65 },
  { name: "12:00", value: 85 },
  { name: "16:00", value: 55 },
  { name: "20:00", value: 70 },
  { name: "23:59", value: 60 },
];

export default function MissionControl() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newMission, setNewMission] = useState<InsertMission>({
    missionCode: "",
    name: "",
    status: "Pending",
    progress: 0,
    priority: "Medium",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: fetchMissions,
  });

  const createMissionMutation = useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast({
        title: "Mission Updated",
        description: "Mission status has been updated.",
      });
    },
  });

  const deleteMissionMutation = useMutation({
    mutationFn: deleteMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast({
        title: "Mission Deleted",
        description: "Mission has been removed from the system.",
      });
    },
  });

  const handleCreateMission = () => {
    if (!newMission.missionCode || !newMission.name) {
      toast({
        title: "Validation Error",
        description: "Mission code and name are required.",
        variant: "destructive",
      });
      return;
    }
    createMissionMutation.mutate(newMission);
  };

  const handleCompleteMission = (id: number) => {
    updateMissionMutation.mutate({
      id,
      data: { status: "Completed", progress: 100 },
    });
  };

  const activeMissions = missions.filter(m => m.status === "Active" || m.status === "Pending");
  const operationalCount = missions.filter(m => m.status === "Active").length;

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
          <NavButton icon={LayoutDashboard} label="Mission Control" active />
          <NavButton icon={Globe} label="Fleet Tracking" />
          <NavButton icon={Database} label="Data Center" />
          <NavButton icon={Users} label="Personnel" />
          <NavButton icon={Activity} label="Analytics" />
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-2">Systems</p>
            <NavButton icon={Cpu} label="Hardware" />
            <NavButton icon={ShieldAlert} label="Security" />
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded hover:bg-sidebar-accent cursor-pointer transition-colors">
            <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center">
              <span className="font-display font-bold">CM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Cmdr. Shepard</p>
              <p className="text-xs text-muted-foreground truncate">Level 5 Clearance</p>
            </div>
            <Settings className="size-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 border-r border-border bg-sidebar">
          <div className="p-6 flex items-center justify-center border-b border-border h-24">
             <img 
              src={logoUrl} 
              alt="Cohete Brands" 
              className="h-16 w-auto object-contain filter invert hue-rotate-180 brightness-110 contrast-125"
            />
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <NavButton icon={LayoutDashboard} label="Mission Control" active />
            <NavButton icon={Globe} label="Fleet Tracking" />
            <NavButton icon={Database} label="Data Center" />
            <NavButton icon={Users} label="Personnel" />
            <NavButton icon={Activity} label="Analytics" />
            <div className="pt-4 pb-2">
              <p className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-2">Systems</p>
              <NavButton icon={Cpu} label="Hardware" />
              <NavButton icon={ShieldAlert} label="Security" />
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div className="hidden md:flex items-center gap-2 text-muted-foreground bg-card border border-input rounded-sm px-3 py-1.5 w-64">
              <Search className="size-4" />
              <input 
                type="text" 
                placeholder="Search command..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50"
              />
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              SYSTEM OPTIMAL
            </div>
            <Button variant="outline" size="icon" className="rounded-sm border-border hover:bg-accent hover:text-accent-foreground">
              <Bell className="size-4" />
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="rounded-sm font-display font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,184,0,0.3)]"
                  data-testid="button-create-mission"
                >
                  <Plus className="size-4 mr-2" />
                  NEW MISSION
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Create New Mission</DialogTitle>
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
                      className="rounded-sm border-border bg-background"
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
                      className="rounded-sm border-border bg-background"
                      data-testid="input-mission-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-xs font-mono uppercase">Priority Level</Label>
                    <Select value={newMission.priority} onValueChange={(val) => setNewMission({ ...newMission, priority: val })}>
                      <SelectTrigger className="rounded-sm border-border bg-background" data-testid="select-priority">
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
                      <SelectTrigger className="rounded-sm border-border bg-background" data-testid="select-status">
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
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-sm" data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateMission}
                    className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
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
        <div className="p-6 space-y-6">
          
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard 
              title="Fleet Status" 
              value={`${operationalCount}/${missions.length}`} 
              label="Operational" 
              icon={Rocket} 
              trend={`+${operationalCount}`} 
              trendLabel="active missions" 
            />
            <StatusCard title="Active Personnel" value="1,284" label="On Duty" icon={Users} trend="+12%" trendLabel="vs last shift" />
            <StatusCard title="System Load" value="42%" label="Capacity Used" icon={Cpu} trend="-5%" trendLabel="optimized" success />
            <StatusCard title="Threat Level" value="LOW" label="Secure" icon={ShieldAlert} trend="0" trendLabel="incidents" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <Card className="lg:col-span-2 border-border bg-card/50 rounded-sm">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center justify-between">
                  <span>Trajectory Analysis</span>
                  <Badge variant="outline" className="rounded-sm font-mono font-normal text-primary border-primary/30 bg-primary/5">LIVE</Badge>
                </CardTitle>
                <CardDescription className="font-mono text-xs uppercase tracking-wider">Real-time telemetry data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
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
              <CardHeader>
                <CardTitle className="text-lg font-display">Active Missions</CardTitle>
                <CardDescription className="font-mono text-xs uppercase tracking-wider">Priority Queue</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8">Loading missions...</div>
                ) : activeMissions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="mb-2">No active missions</p>
                    <p className="text-xs">Create a new mission to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeMissions.slice(0, 4).map((mission) => (
                      <div key={mission.id} className="group flex items-start justify-between p-3 rounded-sm border border-transparent hover:border-border hover:bg-muted/30 transition-all" data-testid={`mission-card-${mission.id}`}>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
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
                        <div className="space-y-2">
                          <div className="w-24">
                            <div className="flex justify-between text-[10px] mb-1 font-mono text-muted-foreground">
                              <span>PROG</span>
                              <span data-testid={`mission-progress-${mission.id}`}>{mission.progress}%</span>
                            </div>
                            <Progress value={mission.progress} className="h-1 bg-muted" indicatorClassName={mission.progress === 100 ? "bg-green-500" : "bg-primary"} />
                          </div>
                          {mission.status !== "Completed" && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="w-full h-6 text-[10px] font-mono hover:bg-green-500/20 hover:text-green-400"
                              onClick={() => handleCompleteMission(mission.id)}
                              data-testid={`button-complete-${mission.id}`}
                            >
                              <CheckCircle2 className="size-3 mr-1" />
                              COMPLETE
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeMissions.length > 4 && (
                  <Button variant="outline" className="w-full mt-4 rounded-sm border-dashed border-border hover:bg-muted hover:text-primary font-mono text-xs uppercase">
                    View All Missions ({activeMissions.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoWidget title="Atmospheric Conditions" value="Stable" subtitle="Visibility 100%" />
            <InfoWidget title="Network Latency" value="24ms" subtitle="Starlink Node: Alpha" />
            <InfoWidget title="Power Reserves" value="98.4%" subtitle="Solar Array: Optimal" />
          </div>

        </div>
      </main>
    </div>
  );
}

function NavButton({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <Button 
      variant="ghost" 
      className={`w-full justify-start gap-3 px-4 py-2 h-10 rounded-sm transition-all duration-200 ${
        active 
          ? "bg-sidebar-accent text-primary border-r-2 border-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      <Icon className={`size-4 ${active ? "text-primary" : ""}`} />
      <span className="font-medium tracking-wide text-sm">{label}</span>
    </Button>
  );
}

function StatusCard({ title, value, label, icon: Icon, trend, trendLabel, success }: any) {
  return (
    <Card className="border-border bg-card/50 rounded-sm hover:border-primary/50 transition-colors group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">{title}</span>
          <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-display font-bold tracking-tight">{value}</h3>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <div className="mt-4 flex items-center text-xs font-mono">
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
