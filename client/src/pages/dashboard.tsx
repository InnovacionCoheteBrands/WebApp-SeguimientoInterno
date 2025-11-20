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
  ChevronRight,
  Command
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Mock Data
const performanceData = [
  { name: "00:00", value: 40 },
  { name: "04:00", value: 30 },
  { name: "08:00", value: 65 },
  { name: "12:00", value: 85 },
  { name: "16:00", value: 55 },
  { name: "20:00", value: 70 },
  { name: "23:59", value: 60 },
];

const activeMissions = [
  { id: "MSN-001", name: "Falcon Deployment", status: "Active", progress: 75, priority: "High" },
  { id: "MSN-002", name: "Lunar Orbit", status: "Pending", progress: 0, priority: "Medium" },
  { id: "MSN-003", name: "Starlink Mesh", status: "Active", progress: 32, priority: "High" },
  { id: "MSN-004", name: "Mars Rover Update", status: "Completed", progress: 100, priority: "Low" },
];

export default function MissionControl() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar/50 backdrop-blur-sm sticky top-0 h-screen z-30">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="size-8 rounded-sm bg-primary flex items-center justify-center text-primary-foreground">
            <Rocket className="size-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg tracking-wider leading-none">COHETE</h2>
            <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Brands OS</span>
          </div>
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
          <div className="p-6 flex items-center gap-3 border-b border-border">
            <div className="size-8 rounded-sm bg-primary flex items-center justify-center text-primary-foreground">
              <Rocket className="size-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg tracking-wider leading-none">COHETE</h2>
              <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Brands OS</span>
            </div>
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
            <Button className="rounded-sm font-display font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,184,0,0.3)]">
              INITIATE LAUNCH
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard title="Fleet Status" value="14/15" label="Operational" icon={Rocket} trend="+2" trendLabel="new deployments" />
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
                <div className="space-y-4">
                  {activeMissions.map((mission) => (
                    <div key={mission.id} className="group flex items-center justify-between p-3 rounded-sm border border-transparent hover:border-border hover:bg-muted/30 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-primary">{mission.id}</span>
                          <span className="font-medium text-sm">{mission.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={
                            mission.status === "Active" ? "text-green-400" : 
                            mission.status === "Pending" ? "text-yellow-400" : "text-blue-400"
                          }>● {mission.status}</span>
                          <span>•</span>
                          <span>{mission.priority} Priority</span>
                        </div>
                      </div>
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] mb-1 font-mono text-muted-foreground">
                          <span>PROG</span>
                          <span>{mission.progress}%</span>
                        </div>
                        <Progress value={mission.progress} className="h-1 bg-muted" indicatorClassName={mission.progress === 100 ? "bg-green-500" : "bg-primary"} />
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 rounded-sm border-dashed border-border hover:bg-muted hover:text-primary font-mono text-xs uppercase">
                  View All Missions
                </Button>
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
