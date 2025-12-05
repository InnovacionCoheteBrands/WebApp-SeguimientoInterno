import { useMemo, memo, useState } from "react";
import { ArrowLeft, Users, Shield, Clock, UserCheck, Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchTeam, 
  fetchTeamAssignments, 
  fetchCampaigns, 
  createTeam, 
  updateTeam, 
  deleteTeam,
  createTeamAssignment,
  deleteTeamAssignment
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { InsertTeam, UpdateTeam, Team, InsertTeamAssignment, Campaign } from "@shared/schema";

const Personnel = memo(function Personnel() {
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Team | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [assigningToMember, setAssigningToMember] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeam,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["team-assignments"],
    queryFn: fetchTeamAssignments,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });

  const stats = useMemo(() => {
    const available = teamMembers.filter(m => m.status === "Disponible").length;
    const seniorLevel = teamMembers.filter(m => 
      m.department === "Senior" || 
      m.department === "Lead" ||
      m.department === "Director"
    ).length;
    
    return {
      total: teamMembers.length,
      available,
      seniorLevel,
      assigned: new Set(assignments.map(a => a.teamId)).size,
    };
  }, [teamMembers, assignments]);

  const teamWithAssignments = useMemo(() => {
    return teamMembers.map((member) => {
      const memberAssignments = assignments.filter(a => a.teamId === member.id);
      const assignedCampaigns = memberAssignments
        .map(a => ({
          assignment: a,
          campaign: campaigns.find(c => c.id === a.campaignId)
        }))
        .filter(item => item.campaign);
      
      return {
        ...member,
        assignments: memberAssignments,
        assignedCampaigns: assignedCampaigns.length,
        campaignNames: assignedCampaigns.map(item => item.campaign?.campaignCode).join(", "),
      };
    });
  }, [teamMembers, assignments, campaigns]);

  const [formData, setFormData] = useState<Partial<InsertTeam>>({
    name: "",
    role: "",
    department: "Junior",
    status: "Disponible",
    workHoursStart: "09:00",
    workHoursEnd: "18:00",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    campaignId: 0,
  });

  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      setIsTeamDialogOpen(false);
      resetForm();
      toast({ title: "Éxito", description: "Miembro creado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTeam }) => updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      setIsTeamDialogOpen(false);
      setEditingMember(null);
      resetForm();
      toast({ title: "Éxito", description: "Miembro actualizado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      setDeleteId(null);
      toast({ title: "Éxito", description: "Miembro eliminado exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: createTeamAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-assignments"] });
      setIsAssignmentDialogOpen(false);
      setAssigningToMember(null);
      setAssignmentForm({ campaignId: 0 });
      toast({ title: "Éxito", description: "Asignación creada exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: deleteTeamAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-assignments"] });
      toast({ title: "Éxito", description: "Asignación eliminada exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      department: "Junior",
      status: "Disponible",
      workHoursStart: "09:00",
      workHoursEnd: "18:00",
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
      });
    } else {
      resetForm();
    }
    setIsTeamDialogOpen(true);
  };

  const handleSubmitTeam = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.role || !formData.department) {
      toast({ title: "Error", description: "Por favor completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    if (editingMember) {
      updateTeamMutation.mutate({ id: editingMember.id, data: formData as UpdateTeam });
    } else {
      createTeamMutation.mutate(formData as InsertTeam);
    }
  };

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assigningToMember || !assignmentForm.campaignId) {
      toast({ title: "Error", description: "Por favor completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    createAssignmentMutation.mutate({
      teamId: assigningToMember,
      campaignId: assignmentForm.campaignId,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disponible":
        return "border-green-500 text-green-500";
      case "Ocupado":
        return "border-yellow-500 text-yellow-500";
      case "Vacaciones":
        return "border-blue-500 text-blue-500";
      default:
        return "border-gray-500 text-gray-500";
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
              <h1 className="text-3xl font-display font-bold tracking-tight">Gestión de Equipo</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                Administrar Equipo y Asignaciones
              </p>
            </div>
          </div>
          <Button 
            onClick={() => handleOpenTeamDialog()} 
            className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-new-personnel"
          >
            <Plus className="size-4 mr-2" />
            Nuevo Miembro
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Miembros</span>
                <Users className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="personnel-total">
                  {stats.total}
                </h3>
                <p className="text-xs text-muted-foreground">Total de Miembros</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Disponibles</span>
                <Clock className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="personnel-on-duty">
                  {stats.available}
                </h3>
                <p className="text-xs text-muted-foreground">Miembros Disponibles</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Nivel Senior+</span>
                <Shield className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="personnel-security">
                  {stats.seniorLevel}
                </h3>
                <p className="text-xs text-muted-foreground">Senior, Lead, Director</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Asignados</span>
                <UserCheck className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="personnel-assigned">
                  {stats.assigned}
                </h3>
                <p className="text-xs text-muted-foreground">En Campañas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card/50 rounded-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display">Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamWithAssignments.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start justify-between p-4 border border-border rounded-sm hover:bg-muted/30 transition-colors"
                  data-testid={`personnel-card-${member.id}`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="size-12 border-2 border-primary/20">
                      <AvatarFallback className="font-display font-bold bg-primary/10 text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-sm" data-testid={`personnel-name-${member.id}`}>{member.name}</p>
                          <p className="text-xs text-muted-foreground" data-testid={`personnel-role-${member.id}`}>{member.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono text-muted-foreground mb-1" data-testid={`personnel-clearance-${member.id}`}>
                            {member.department}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground" data-testid={`personnel-shift-${member.id}`}>
                            {member.workHoursStart} - {member.workHoursEnd}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`rounded-sm text-xs ${getStatusColor(member.status)}`}
                          data-testid={`personnel-status-${member.id}`}
                        >
                          {member.status}
                        </Badge>
                      </div>
                      
                      {member.assignments.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-mono text-muted-foreground">Campañas Asignadas:</p>
                          {member.assignments.map((assignment) => {
                            const campaign = campaigns.find(c => c.id === assignment.campaignId);
                            return campaign ? (
                              <div key={assignment.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
                                <p className="text-xs text-primary font-mono">
                                  {campaign.campaignCode}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                                  className="h-6 px-2"
                                  data-testid={`button-delete-assignment-${assignment.id}`}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssigningToMember(member.id);
                            setIsAssignmentDialogOpen(true);
                          }}
                          className="rounded-sm"
                          data-testid={`button-assign-mission-${member.id}`}
                        >
                          <UserPlus className="size-3 mr-1" />
                          Asignar a Campaña
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTeamDialog(member)}
                          className="rounded-sm"
                          data-testid={`button-edit-personnel-${member.id}`}
                        >
                          <Pencil className="size-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(member.id)}
                          className="rounded-sm text-destructive hover:text-destructive"
                          data-testid={`button-delete-personnel-${member.id}`}
                        >
                          <Trash2 className="size-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {teamMembers.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No hay miembros del equipo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-sm">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Editar Miembro" : "Nuevo Miembro"}</DialogTitle>
            <DialogDescription>
              {editingMember ? "Actualizar detalles del miembro" : "Agregar un nuevo miembro al equipo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTeam} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej., Ana García"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger id="role" data-testid="input-role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Creative Director">Creative Director</SelectItem>
                  <SelectItem value="Copywriter">Copywriter</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="Social Media Manager">Social Media Manager</SelectItem>
                  <SelectItem value="SEO Specialist">SEO Specialist</SelectItem>
                  <SelectItem value="Account Manager">Account Manager</SelectItem>
                  <SelectItem value="Strategist">Strategist</SelectItem>
                  <SelectItem value="Data Analyst">Data Analyst</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Nivel *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger id="department" data-testid="select-clearance">
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
                <Label htmlFor="status">Estado *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="Ocupado">Ocupado</SelectItem>
                    <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workHoursStart">Hora de Inicio *</Label>
                <Input
                  id="workHoursStart"
                  type="time"
                  value={formData.workHoursStart}
                  onChange={(e) => setFormData({ ...formData, workHoursStart: e.target.value })}
                  data-testid="input-shift-start"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workHoursEnd">Hora de Fin *</Label>
                <Input
                  id="workHoursEnd"
                  type="time"
                  value={formData.workHoursEnd}
                  onChange={(e) => setFormData({ ...formData, workHoursEnd: e.target.value })}
                  data-testid="input-shift-end"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTeamDialogOpen(false)}
                className="rounded-sm"
                data-testid="button-cancel-personnel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-sm"
                disabled={createTeamMutation.isPending || updateTeamMutation.isPending}
                data-testid="button-submit-personnel"
              >
                {editingMember ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-sm">
          <DialogHeader>
            <DialogTitle>Asignar a Campaña</DialogTitle>
            <DialogDescription>
              Crear una nueva asignación de campaña para este miembro
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaña *</Label>
              <Select
                value={assignmentForm.campaignId.toString()}
                onValueChange={(value) => setAssignmentForm({ ...assignmentForm, campaignId: parseInt(value) })}
              >
                <SelectTrigger id="campaignId" data-testid="select-campaign">
                  <SelectValue placeholder="Selecciona una campaña" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.campaignCode} - {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssignmentDialogOpen(false)}
                className="rounded-sm"
                data-testid="button-cancel-assignment"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-sm"
                disabled={createAssignmentMutation.isPending}
                data-testid="button-submit-assignment"
              >
                Asignar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al miembro del equipo y todas sus asignaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteTeamMutation.mutate(deleteId)}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default Personnel;
