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
  fetchPersonnel, 
  fetchPersonnelAssignments, 
  fetchMissions, 
  createPersonnel, 
  updatePersonnel, 
  deletePersonnel,
  createPersonnelAssignment,
  deletePersonnelAssignment
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { InsertPersonnel, UpdatePersonnel, Personnel as PersonnelType, InsertPersonnelAssignment } from "@shared/schema";

const Personnel = memo(function Personnel() {
  const [isPersonnelDialogOpen, setIsPersonnelDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<PersonnelType | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [assigningToPersonnel, setAssigningToPersonnel] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allPersonnel = [] } = useQuery({
    queryKey: ["personnel"],
    queryFn: fetchPersonnel,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["personnel-assignments"],
    queryFn: fetchPersonnelAssignments,
  });

  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: fetchMissions,
  });

  const stats = useMemo(() => {
    const onDuty = allPersonnel.filter(p => p.status === "On Duty").length;
    const securityCount = allPersonnel.filter(p => 
      p.role.toLowerCase().includes("security") || 
      p.role.toLowerCase().includes("tactical") ||
      p.clearance === "Level 5"
    ).length;
    
    return {
      total: allPersonnel.length,
      onDuty,
      security: securityCount,
      assigned: new Set(assignments.map(a => a.personnelId)).size,
    };
  }, [allPersonnel, assignments]);

  const personnelWithAssignments = useMemo(() => {
    return allPersonnel.map((person) => {
      const personAssignments = assignments.filter(a => a.personnelId === person.id);
      const assignedMissions = personAssignments
        .map(a => ({
          assignment: a,
          mission: missions.find(m => m.id === a.missionId)
        }))
        .filter(item => item.mission);
      
      return {
        ...person,
        assignments: personAssignments,
        assignedMissions: assignedMissions.length,
        missionNames: assignedMissions.map(item => item.mission?.missionCode).join(", "),
      };
    });
  }, [allPersonnel, assignments, missions]);

  const [formData, setFormData] = useState<Partial<InsertPersonnel>>({
    name: "",
    role: "",
    clearance: "Level 1",
    status: "On Duty",
    shiftStart: "08:00",
    shiftEnd: "16:00",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    missionId: 0,
    role: "",
  });

  const createPersonnelMutation = useMutation({
    mutationFn: createPersonnel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
      setIsPersonnelDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Personnel created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePersonnelMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePersonnel }) => updatePersonnel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
      setIsPersonnelDialogOpen(false);
      setEditingPersonnel(null);
      resetForm();
      toast({ title: "Success", description: "Personnel updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePersonnelMutation = useMutation({
    mutationFn: deletePersonnel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
      setDeleteId(null);
      toast({ title: "Success", description: "Personnel deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: createPersonnelAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel-assignments"] });
      setIsAssignmentDialogOpen(false);
      setAssigningToPersonnel(null);
      setAssignmentForm({ missionId: 0, role: "" });
      toast({ title: "Success", description: "Assignment created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: deletePersonnelAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel-assignments"] });
      toast({ title: "Success", description: "Assignment removed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      clearance: "Level 1",
      status: "On Duty",
      shiftStart: "08:00",
      shiftEnd: "16:00",
    });
    setEditingPersonnel(null);
  };

  const handleOpenPersonnelDialog = (person?: PersonnelType) => {
    if (person) {
      setEditingPersonnel(person);
      setFormData({
        name: person.name,
        role: person.role,
        clearance: person.clearance,
        status: person.status,
        shiftStart: person.shiftStart,
        shiftEnd: person.shiftEnd,
      });
    } else {
      resetForm();
    }
    setIsPersonnelDialogOpen(true);
  };

  const handleSubmitPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.role) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (editingPersonnel) {
      updatePersonnelMutation.mutate({ id: editingPersonnel.id, data: formData as UpdatePersonnel });
    } else {
      createPersonnelMutation.mutate(formData as InsertPersonnel);
    }
  };

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assigningToPersonnel || !assignmentForm.missionId || !assignmentForm.role) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    createAssignmentMutation.mutate({
      personnelId: assigningToPersonnel,
      missionId: assignmentForm.missionId,
      role: assignmentForm.role,
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
              <h1 className="text-3xl font-display font-bold tracking-tight">Personnel Administration</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                Manage Staff & Assignments
              </p>
            </div>
          </div>
          <Button 
            onClick={() => handleOpenPersonnelDialog()} 
            className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-new-personnel"
          >
            <Plus className="size-4 mr-2" />
            New Personnel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Total Staff</span>
                <Users className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="personnel-total">
                  {stats.total}
                </h3>
                <p className="text-xs text-muted-foreground">Active Personnel</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">On Duty</span>
                <Clock className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="personnel-on-duty">
                  {stats.onDuty}
                </h3>
                <p className="text-xs text-muted-foreground">Current Shift</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">High Clearance</span>
                <Shield className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="personnel-security">
                  {stats.security}
                </h3>
                <p className="text-xs text-muted-foreground">Level 4-5 Clearance</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Assigned</span>
                <UserCheck className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight" data-testid="personnel-assigned">
                  {stats.assigned}
                </h3>
                <p className="text-xs text-muted-foreground">On Missions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card/50 rounded-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display">Personnel Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {personnelWithAssignments.map((person) => (
                <div
                  key={person.id}
                  className="flex items-start justify-between p-4 border border-border rounded-sm hover:bg-muted/30 transition-colors"
                  data-testid={`personnel-card-${person.id}`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="size-12 border-2 border-primary/20">
                      <AvatarFallback className="font-display font-bold bg-primary/10 text-primary">
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-sm" data-testid={`personnel-name-${person.id}`}>{person.name}</p>
                          <p className="text-xs text-muted-foreground" data-testid={`personnel-role-${person.id}`}>{person.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono text-muted-foreground mb-1" data-testid={`personnel-clearance-${person.id}`}>
                            {person.clearance}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground" data-testid={`personnel-shift-${person.id}`}>
                            {person.shiftStart} - {person.shiftEnd}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`rounded-sm text-xs ${
                            person.status === "On Duty"
                              ? "border-green-500 text-green-500"
                              : "border-yellow-500 text-yellow-500"
                          }`}
                          data-testid={`personnel-status-${person.id}`}
                        >
                          {person.status}
                        </Badge>
                      </div>
                      
                      {person.assignments.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-mono text-muted-foreground">Mission Assignments:</p>
                          {person.assignments.map((assignment) => {
                            const mission = missions.find(m => m.id === assignment.missionId);
                            return mission ? (
                              <div key={assignment.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
                                <p className="text-xs text-primary font-mono">
                                  {mission.missionCode} - {assignment.role}
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
                            setAssigningToPersonnel(person.id);
                            setIsAssignmentDialogOpen(true);
                          }}
                          className="rounded-sm"
                          data-testid={`button-assign-mission-${person.id}`}
                        >
                          <UserPlus className="size-3 mr-1" />
                          Assign to Mission
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPersonnelDialog(person)}
                          className="rounded-sm"
                          data-testid={`button-edit-personnel-${person.id}`}
                        >
                          <Pencil className="size-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(person.id)}
                          className="rounded-sm text-destructive hover:text-destructive"
                          data-testid={`button-delete-personnel-${person.id}`}
                        >
                          <Trash2 className="size-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {allPersonnel.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No personnel records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPersonnelDialogOpen} onOpenChange={setIsPersonnelDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-sm">
          <DialogHeader>
            <DialogTitle>{editingPersonnel ? "Edit Personnel" : "New Personnel"}</DialogTitle>
            <DialogDescription>
              {editingPersonnel ? "Update personnel details" : "Add a new personnel member"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPersonnel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Smith"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Flight Director"
                data-testid="input-role"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clearance">Clearance Level *</Label>
                <Select
                  value={formData.clearance}
                  onValueChange={(value) => setFormData({ ...formData, clearance: value })}
                >
                  <SelectTrigger id="clearance" data-testid="select-clearance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Level 1">Level 1</SelectItem>
                    <SelectItem value="Level 2">Level 2</SelectItem>
                    <SelectItem value="Level 3">Level 3</SelectItem>
                    <SelectItem value="Level 4">Level 4</SelectItem>
                    <SelectItem value="Level 5">Level 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as "On Duty" | "Off Duty" })}
                >
                  <SelectTrigger id="status" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On Duty">On Duty</SelectItem>
                    <SelectItem value="Off Duty">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shiftStart">Shift Start *</Label>
                <Input
                  id="shiftStart"
                  type="time"
                  value={formData.shiftStart}
                  onChange={(e) => setFormData({ ...formData, shiftStart: e.target.value })}
                  data-testid="input-shift-start"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiftEnd">Shift End *</Label>
                <Input
                  id="shiftEnd"
                  type="time"
                  value={formData.shiftEnd}
                  onChange={(e) => setFormData({ ...formData, shiftEnd: e.target.value })}
                  data-testid="input-shift-end"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPersonnelDialogOpen(false)}
                className="rounded-sm"
                data-testid="button-cancel-personnel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-sm"
                disabled={createPersonnelMutation.isPending || updatePersonnelMutation.isPending}
                data-testid="button-submit-personnel"
              >
                {editingPersonnel ? "Update" : "Create"} Personnel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-sm">
          <DialogHeader>
            <DialogTitle>Assign to Mission</DialogTitle>
            <DialogDescription>
              Create a new mission assignment for this personnel
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mission">Mission *</Label>
              <Select
                value={assignmentForm.missionId.toString()}
                onValueChange={(value) => setAssignmentForm({ ...assignmentForm, missionId: parseInt(value) })}
              >
                <SelectTrigger id="mission" data-testid="select-assignment-mission">
                  <SelectValue placeholder="Select a mission" />
                </SelectTrigger>
                <SelectContent>
                  {missions.map((mission) => (
                    <SelectItem key={mission.id} value={mission.id.toString()}>
                      {mission.missionCode} - {mission.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment-role">Role in Mission *</Label>
              <Input
                id="assignment-role"
                value={assignmentForm.role}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, role: e.target.value })}
                placeholder="e.g., Mission Commander"
                data-testid="input-assignment-role"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAssignmentDialogOpen(false);
                  setAssigningToPersonnel(null);
                  setAssignmentForm({ missionId: 0, role: "" });
                }}
                className="rounded-sm"
                data-testid="button-cancel-assignment"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-sm"
                disabled={createAssignmentMutation.isPending}
                data-testid="button-submit-assignment"
              >
                Assign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Personnel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this personnel? This action cannot be undone and will remove all associated mission assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" data-testid="button-cancel-delete-personnel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deletePersonnelMutation.mutate(deleteId)}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-personnel"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default Personnel;
