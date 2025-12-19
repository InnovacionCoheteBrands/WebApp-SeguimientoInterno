import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Users, Shield, Clock, Plus, Search, Filter,
  TrendingUp, TrendingDown, DollarSign, Briefcase, Zap,
  MoreVertical, Calendar, CheckCircle2, AlertCircle, XCircle, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { RoleCatalogDialog } from "@/components/role-catalog-dialog";
import {
  fetchTeam,
  fetchTeamAssignments,
  fetchCampaigns,
  fetchProjects,
  createTeam,
  updateTeam,
  deleteTeam,
  createTeamAssignment,
  deleteTeamAssignment,
  fetchAgencyRoles,
  createRecurringTransaction
} from "@/lib/api";
import type { InsertTeam, UpdateTeam, Team, InsertTeamAssignment, AgencyRole, InsertRecurringTransaction } from "@shared/schema";

export default function Personnel() {
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const [editingMember, setEditingMember] = useState<Team | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [assigningToMember, setAssigningToMember] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Data Fetching ---
  const { data: teamMembers = [] } = useQuery({ queryKey: ["team"], queryFn: fetchTeam });
  const { data: assignments = [] } = useQuery({ queryKey: ["team-assignments"], queryFn: fetchTeamAssignments });
  const { data: campaigns = [] } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const { data: roles = [] } = useQuery({ queryKey: ["agency-roles"], queryFn: fetchAgencyRoles });

  // --- Derived State & Logic ---
  const teamWithMetrics = useMemo(() => {
    return teamMembers.map((member) => {
      const memberAssignments = assignments.filter(a => a.teamId === member.id);

      const totalHoursAllocated = memberAssignments.reduce((acc, curr) => acc + (curr.hoursAllocated || 0), 0);
      const capacity = member.weeklyCapacity || 40;
      const utilizationRate = Math.min((totalHoursAllocated / capacity) * 100, 100);

      // Auto-determine status based on utilization
      let computedStatus = "Available";
      if (utilizationRate >= 95) computedStatus = "Saturated";
      else if (utilizationRate >= 75) computedStatus = "Ocupado"; // High load
      else if (member.status === "Vacaciones") computedStatus = "Vacaciones"; // Manual override possibility
      else computedStatus = "Available";

      return {
        ...member,
        status: computedStatus,
        assignments: memberAssignments,
        totalHoursAllocated,
        utilizationRate,
        efficiencyScore: utilizationRate // Simplified proxy for now
      };
    });
  }, [teamMembers, assignments]);

  const stats = useMemo(() => {
    const totalMembers = teamWithMetrics.length;
    const totalCapacity = teamWithMetrics.reduce((acc, m) => acc + (m.weeklyCapacity || 40), 0);
    const totalAllocated = teamWithMetrics.reduce((acc, m) => acc + m.totalHoursAllocated, 0);
    const avgUtilization = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

    // Financials (Mock/Derived)
    const totalBurnRate = teamWithMetrics.reduce((acc, m) => acc + (parseFloat(m.internalCostHour?.toString() || "0") * 40 * 4), 0); // Monthly approx
    const potentialRevenue = teamWithMetrics.reduce((acc, m) => acc + (parseFloat(m.billableRate?.toString() || "0") * m.totalHoursAllocated * 4), 0);

    return {
      efficiencyRate: avgUtilization.toFixed(1),
      totalCapacity,
      saturatedCount: teamWithMetrics.filter(m => m.utilizationRate >= 90).length,
      availableCount: teamWithMetrics.filter(m => m.utilizationRate < 50).length,
      potentialRevenue
    };
  }, [teamWithMetrics]);

  const filteredTeam = useMemo(() => {
    return teamWithMetrics.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.skills && member.skills.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = filterRole === "all" || member.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [teamWithMetrics, searchTerm, filterRole]);

  // --- Mutations ---
  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      // Handle Payroll Integration if selected
      if (formData.addToPayroll && formData.monthlySalary && parseFloat(formData.monthlySalary as string) > 0) {
        const transaction: InsertRecurringTransaction = {
          name: `Nomina: ${data.name}`,
          type: "Gasto",
          category: "Nómina",
          amount: formData.monthlySalary as string,
          frequency: "monthly",
          dayOfMonth: 1,
          isActive: true,
          nextExecutionDate: new Date(),
          description: `Recurring salary for ${data.name} (${data.role})`
        };
        createRecurringTransaction(transaction)
          .then(() => toast({ title: "Payroll Integrated", description: "Recurring expense created in Finance Hub." }))
          .catch(() => toast({ title: "Warning", description: "Team created but failed to add to payroll.", variant: "destructive" }));
      }

      setIsTeamDialogOpen(false);
      resetForm();
      toast({ title: "Talento Agregado", description: "El perfil ha sido creado exitosamente." });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTeam }) => updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      setIsTeamDialogOpen(false);
      setEditingMember(null);
      resetForm();
      toast({ title: "Perfil Actualizado", description: "Los datos del talento han sido guardados." });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      setDeleteId(null);
      toast({ title: "Perfil Eliminado", description: "El miembro ha sido removido del sistema." });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: createTeamAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-assignments"] });
      setIsAssignmentDialogOpen(false);
      setAssigningToMember(null);
      setAssignmentForm({ projectId: 0, hoursAllocated: 0 });
      toast({ title: "Asignación Creada", description: "Carga de trabajo actualizada." });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: deleteTeamAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-assignments"] });
      toast({ title: "Asignación Removida", description: "Capacidad liberada." });
    },
  });

  // --- Forms ---
  const [formData, setFormData] = useState<Partial<InsertTeam> & { addToPayroll?: boolean }>({
    name: "",
    role: "",
    department: "Junior",
    status: "Available",
    workHoursStart: "09:00",
    workHoursEnd: "18:00",
    weeklyCapacity: 40,
    internalCostHour: "0",
    billableRate: "0",
    monthlySalary: "0",
    skills: "",
    roleCatalogId: undefined,
    addToPayroll: false
  });

  const [assignmentForm, setAssignmentForm] = useState({
    projectId: 0,
    hoursAllocated: 10
  });

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      department: "Junior",
      status: "Available",
      workHoursStart: "09:00",
      workHoursEnd: "18:00",
      weeklyCapacity: 40,
      internalCostHour: "0",
      billableRate: "0",
      monthlySalary: "0",
      skills: "",
      roleCatalogId: undefined,
      addToPayroll: false
    });
    setEditingMember(null);
  };

  const handleOpenTeamDialog = (member?: Team) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        role: member.role,
        department: member.department,
        status: member.status,
        workHoursStart: member.workHoursStart,
        workHoursEnd: member.workHoursEnd,
        weeklyCapacity: member.weeklyCapacity || 40,
        internalCostHour: member.internalCostHour?.toString() || "0",
        billableRate: member.billableRate?.toString() || "0",
        monthlySalary: member.monthlySalary?.toString() || "0",
        skills: member.skills || "",
        roleCatalogId: member.roleCatalogId,
        addToPayroll: false
      });
    } else {
      resetForm();
    }
    setIsTeamDialogOpen(true);
  };

  // Smart Autofill from Catalog
  const handleRoleSelect = (catalogId: string) => {
    const roleId = parseInt(catalogId);
    const selectedRole = roles.find(r => r.id === roleId);
    if (selectedRole) {
      const activities = selectedRole.allowedActivities ? JSON.parse(selectedRole.allowedActivities as string) : [];
      setFormData(prev => ({
        ...prev,
        role: selectedRole.roleName,
        roleCatalogId: roleId,
        department: selectedRole.department,
        billableRate: selectedRole.defaultBillableRate?.toString() || "0",
        skills: activities.join(", ")
      }));
    }
  };

  // Auto-calculate Internal Cost
  useEffect(() => {
    const salary = parseFloat(formData.monthlySalary?.toString() || "0");
    const hours = formData.weeklyCapacity || 40;
    if (salary > 0 && hours > 0) {
      // 4.33 weeks per month average
      const costPerHour = (salary / (hours * 4.33)).toFixed(2);
      setFormData(prev => ({ ...prev, internalCostHour: costPerHour }));
    }
  }, [formData.monthlySalary, formData.weeklyCapacity]);

  const handleSubmitTeam = (e: React.FormEvent) => {
    e.preventDefault();
    // Exclude addToPayroll before sending to API
    const { addToPayroll, ...dataToSend } = formData;

    if (editingMember) {
      updateTeamMutation.mutate({ id: editingMember.id, data: dataToSend as UpdateTeam });
    } else {
      createTeamMutation.mutate(dataToSend as InsertTeam);
    }
  };

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningToMember || !assignmentForm.projectId) return;

    createAssignmentMutation.mutate({
      teamId: assigningToMember,
      projectId: assignmentForm.projectId,
      hoursAllocated: assignmentForm.hoursAllocated
    });
  };

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  // --- UI Components ---
  return (
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="rounded-sm border-border bg-card/50 hover:bg-muted">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Strategic Talent Hub</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-mono tracking-wider">
                  RESOURCE INTELLIGENCE
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">CAPACITY: {stats.totalCapacity}h / WEEK</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground hover:bg-muted hidden sm:flex"
              onClick={() => setIsCatalogOpen(true)}
            >
              <Settings className="size-4 mr-2" />
              Configure Agency
            </Button>
            <Button
              onClick={() => handleOpenTeamDialog()}
              className="bg-primary text-primary-foreground font-medium hover:bg-primary/90 rounded-sm"
            >
              <Plus className="size-4 mr-2" />
              Add Talent
            </Button>
          </div>
        </div>

        {/* Top Stats - Financial Tickers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border rounded-sm relative overflow-hidden group hover:border-muted-foreground/30 transition-colors">
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wilder">Efficiency Rate</p>
                <h3 className="text-2xl font-mono font-bold text-foreground mt-1">{stats.efficiencyRate}%</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="size-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-sm relative overflow-hidden group hover:border-muted-foreground/30 transition-colors">
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wilder">Saturated Resources</p>
                <h3 className="text-2xl font-mono font-bold text-foreground mt-1">{stats.saturatedCount}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="size-5 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-sm relative overflow-hidden group hover:border-muted-foreground/30 transition-colors">
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wilder">Available Capacity</p>
                <h3 className="text-2xl font-mono font-bold text-foreground mt-1">{stats.availableCount}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-sm relative overflow-hidden group hover:border-muted-foreground/30 transition-colors">
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wilder">Est. Revenue Potential</p>
                <h3 className="text-2xl font-mono font-bold text-foreground mt-1">${(stats.potentialRevenue / 1000).toFixed(1)}k</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="size-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Filters */}
        <Card className="bg-card/50 border-border rounded-sm">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Filter by Name, Skill (e.g. React, Copy)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border rounded-sm h-10 focus-visible:ring-primary/20"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-[200px] h-10 bg-background border-border rounded-sm">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Creative Director">Creative Director</SelectItem>
                <SelectItem value="Senior Strategist">Senior Strategist</SelectItem>
                <SelectItem value="Developer">Developer</SelectItem>
                <SelectItem value="Designer">Designer</SelectItem>
              </SelectContent>
            </Select>
            {/* Mobile Catalog Button */}
            <Button
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground hover:bg-muted sm:hidden w-full"
              onClick={() => setIsCatalogOpen(true)}
            >
              <Settings className="size-4 mr-2" />
              Configure Agency
            </Button>
          </CardContent>
        </Card>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeam.map((member) => (
            <Card
              key={member.id}
              className={`bg-card border-border hover:border-muted-foreground/30 transition-all group relative overflow-hidden rounded-sm
                  ${member.utilizationRate >= 95 ? 'hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]'}
                `}
            >
              {/* Status Indicator Line */}
              <div className={`absolute top-0 left-0 w-[4px] h-full bg-gradient-to-b from-transparent 
                   ${member.utilizationRate >= 95 ? 'via-red-500' :
                  member.utilizationRate >= 75 ? 'via-yellow-500' : 'via-green-500'}
                   to-transparent opacity-70 group-hover:opacity-100 transition-opacity
                `} />

              <CardContent className="p-5 pl-7 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-sm border border-border">
                      <AvatarFallback className="bg-muted text-muted-foreground font-mono">{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{member.name}</h4>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`rounded-sm text-[10px] font-mono
                         ${member.department === 'Director' ? 'border-primary/50 text-primary bg-primary/5' : 'border-border text-muted-foreground'}
                      `}>
                    {member.department}
                  </Badge>
                </div>

                {/* Burnout Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>UTILIZATION</span>
                    <span className={
                      member.utilizationRate >= 95 ? 'text-red-500 font-bold' :
                        member.utilizationRate < 50 ? 'text-green-500' : 'text-foreground'
                    }>{Math.round(member.utilizationRate)}%</span>
                  </div>
                  <Progress
                    value={member.utilizationRate}
                    className="h-1.5 bg-muted rounded-sm"
                    indicatorClassName={
                      member.utilizationRate >= 95 ? 'bg-red-500' :
                        member.utilizationRate >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }
                  />
                  <p className="text-[10px] text-muted-foreground/60 text-right">
                    {member.totalHoursAllocated}h / {member.weeklyCapacity}h
                  </p>
                </div>

                {/* Skills */}
                {member.skills && (
                  <div className="flex flex-wrap gap-1">
                    {member.skills.split(',').slice(0, 3).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-[9px] h-4 rounded-sm bg-muted text-muted-foreground hover:text-foreground border-0">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Financial Stats (Director/Lead View) */}
                <div className="pt-3 border-t border-border grid grid-cols-2 gap-2">
                  <div className="bg-background/50 p-2 rounded-sm border border-border/50">
                    <p className="text-[9px] text-muted-foreground uppercase">Cost/Hr</p>
                    <p className="text-xs font-mono text-foreground/80">${member.internalCostHour}</p>
                  </div>
                  <div className="bg-background/50 p-2 rounded-sm border border-border/50">
                    <p className="text-[9px] text-muted-foreground uppercase">Billable</p>
                    <p className="text-xs font-mono text-primary">${member.billableRate}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs border-border text-foreground/80 hover:bg-muted hover:text-foreground rounded-sm"
                    onClick={() => {
                      setAssigningToMember(member.id);
                      setIsAssignmentDialogOpen(true);
                    }}
                  >
                    Assign
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => handleOpenTeamDialog(member)}
                  >
                    <MoreVertical className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {filteredTeam.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-sm">
              <Users className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground">No matching talent found</p>
            </div>
          )}
        </div>

      </div>

      {/* --- DIALOGS --- */}

      {/* Team Member Dialog */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent className="sm:max-w-[600px] border-border bg-card text-foreground rounded-sm">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Edit Strategic Asset" : "Onboard New Talent"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure resource capacity, financial metrics, and skills.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTeam} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-muted-foreground">Master Service Role</Label>
                <Select
                  value={formData.roleCatalogId?.toString()}
                  onValueChange={handleRoleSelect}
                >
                  <SelectTrigger className="bg-background border-border rounded-sm">
                    <SelectValue placeholder="Select from Catalog (Recommended)" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.roleName} <span className="text-muted-foreground text-xs ml-2">(${role.defaultBillableRate}/hr)</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="bg-background border-border rounded-sm"
                  placeholder="e.g. Alex Chen"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Custom Role Title</Label>
                <Input
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="bg-background border-border rounded-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Seniority</Label>
                <Select value={formData.department} onValueChange={v => setFormData({ ...formData, department: v })}>
                  <SelectTrigger className="bg-background border-border rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Weekly Capacity (Hours)</Label>
                <Input
                  type="number"
                  value={formData.weeklyCapacity || ""}
                  onChange={e => setFormData({ ...formData, weeklyCapacity: parseInt(e.target.value) })}
                  className="bg-background border-border rounded-sm"
                />
              </div>
            </div>

            <div className="p-3 bg-muted/30 border border-border rounded-sm space-y-3">
              <h4 className="text-xs font-mono uppercase text-primary tracking-wider">Financial Intelligence</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Internal Cost / Hr</Label>
                  <Input
                    type="number"
                    value={formData.internalCostHour || ""}
                    onChange={e => setFormData({ ...formData, internalCostHour: e.target.value })}
                    className="bg-background border-border rounded-sm h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-2 text-green-500">
                  <Label className="text-xs text-green-700/70">Theoretical Margin</Label>
                  <div className="h-8 flex items-center gap-2 font-mono text-sm">
                    {(() => {
                      const cost = parseFloat(formData.internalCostHour as string || "0");
                      const rate = parseFloat(formData.billableRate as string || "0");
                      if (rate > 0 && cost > 0) {
                        const margin = ((rate - cost) / rate * 100).toFixed(1);
                        return <span className={Number(margin) > 50 ? 'text-green-500' : 'text-yellow-500'}>{margin}%</span>
                      }
                      return <span className="text-muted-foreground">--</span>
                    })()}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Billing Rate / Hr</Label>
                  <Input
                    type="number"
                    value={formData.billableRate || ""}
                    onChange={e => setFormData({ ...formData, billableRate: e.target.value })}
                    className="bg-background border-border rounded-sm h-8 text-xs font-mono text-green-500"
                  />
                </div>
                <div className="space-y-2 col-span-2 border-t border-border pt-2 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-muted-foreground">Add to Payroll</Label>
                    <p className="text-[10px] text-muted-foreground">Automatically create a monthly recurring expense.</p>
                  </div>
                  <Switch
                    checked={formData.addToPayroll}
                    onCheckedChange={(c) => setFormData({ ...formData, addToPayroll: c })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Monthly Salary</Label>
                <Input
                  type="number"
                  value={formData.monthlySalary || ""}
                  onChange={e => setFormData({ ...formData, monthlySalary: e.target.value })}
                  className="bg-background border-border rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs mt-8">
                  Calculated Internal Cost: <span className="text-foreground font-mono">${formData.internalCostHour}</span>/hr
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Skills (Comma separated)</Label>
              <Input
                value={formData.skills || ""}
                onChange={e => setFormData({ ...formData, skills: e.target.value })}
                className="bg-background border-border rounded-sm"
                placeholder="React, TypeScript, SEO, Copywriting..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Shift Start</Label>
                <Input type="time" value={formData.workHoursStart} onChange={e => setFormData({ ...formData, workHoursStart: e.target.value })} className="bg-background border-border rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Shift End</Label>
                <Input type="time" value={formData.workHoursEnd} onChange={e => setFormData({ ...formData, workHoursEnd: e.target.value })} className="bg-background border-border rounded-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Shift Start</Label>
                <Input type="time" value={formData.workHoursStart} onChange={e => setFormData({ ...formData, workHoursStart: e.target.value })} className="bg-background border-border rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Shift End</Label>
                <Input type="time" value={formData.workHoursEnd} onChange={e => setFormData({ ...formData, workHoursEnd: e.target.value })} className="bg-background border-border rounded-sm" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsTeamDialogOpen(false)} className="hover:bg-muted rounded-sm">Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm">
                {editingMember ? "Save Changes" : "Create Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[400px] border-border bg-card text-foreground rounded-sm">
          <DialogHeader>
            <DialogTitle>Assign Capacity</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Allocate hours to a specific project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Project Strategy</Label>
              <Select value={assignmentForm.projectId.toString()} onValueChange={v => setAssignmentForm({ ...assignmentForm, projectId: parseInt(v) })}>
                <SelectTrigger className="bg-background border-border rounded-sm">
                  <SelectValue placeholder="Select Project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.client?.companyName})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Weekly Allocation (Hours)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={assignmentForm.hoursAllocated}
                  onChange={e => setAssignmentForm({ ...assignmentForm, hoursAllocated: parseInt(e.target.value) })}
                  className="bg-background border-border rounded-sm"
                />
                <span className="text-xs text-muted-foreground font-mono">HRS/WK</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsAssignmentDialogOpen(false)} className="hover:bg-muted rounded-sm">Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm">Confirm Allocation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <RoleCatalogDialog open={isCatalogOpen} onOpenChange={setIsCatalogOpen} />
    </div>
  );
}
