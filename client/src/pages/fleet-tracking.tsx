import { useMemo, memo, useState } from "react";
import { Rocket, ArrowLeft, Globe, MapPin, Navigation, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMissions, fetchFleetPositions, createFleetPosition, updateFleetPosition, deleteFleetPosition } from "@/lib/api";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { InsertFleetPosition, FleetPosition } from "@shared/schema";

const FleetTracking = memo(function FleetTracking() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<FleetPosition | null>(null);
  const [deleteMissionId, setDeleteMissionId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: fetchMissions,
  });

  const { data: fleetPositions = [] } = useQuery({
    queryKey: ["fleet-positions"],
    queryFn: fetchFleetPositions,
  });

  const fleetData = useMemo(() => {
    return missions.map((mission) => {
      const position = fleetPositions.find((p) => p.missionId === mission.id);
      return {
        mission,
        position,
      };
    });
  }, [missions, fleetPositions]);

  const [formData, setFormData] = useState<Partial<InsertFleetPosition>>({
    missionId: 0,
    sector: "",
    coordinates: "",
    velocity: 0,
    distance: 0,
    status: "Active",
  });

  const createMutation = useMutation({
    mutationFn: createFleetPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-positions"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Fleet position created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ missionId, data }: { missionId: number; data: Partial<InsertFleetPosition> }) =>
      updateFleetPosition(missionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-positions"] });
      setIsDialogOpen(false);
      setEditingPosition(null);
      resetForm();
      toast({ title: "Success", description: "Fleet position updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFleetPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-positions"] });
      setDeleteMissionId(null);
      toast({ title: "Success", description: "Fleet position deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      missionId: 0,
      sector: "",
      coordinates: "",
      velocity: 0,
      distance: 0,
      status: "Active",
    });
    setEditingPosition(null);
  };

  const handleOpenDialog = (position?: FleetPosition) => {
    if (position) {
      setEditingPosition(position);
      setFormData({
        missionId: position.missionId,
        sector: position.sector,
        coordinates: position.coordinates,
        velocity: position.velocity,
        distance: position.distance,
        status: position.status,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.missionId || !formData.sector || !formData.coordinates) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (editingPosition) {
      updateMutation.mutate({ 
        missionId: editingPosition.missionId, 
        data: formData 
      });
    } else {
      createMutation.mutate(formData as InsertFleetPosition);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link href="/">
              <Button variant="outline" size="icon" className="rounded-sm h-11 w-11" data-testid="button-back">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Fleet Administration</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                Manage Fleet Positions & Tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Badge variant="outline" className="rounded-sm font-mono font-normal text-primary border-primary/30 bg-primary/5 text-xs sm:text-sm">
              {fleetData.length} VESSELS
            </Badge>
            <Button 
              onClick={() => handleOpenDialog()} 
              className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-3 sm:px-4 flex-1 sm:flex-initial"
              data-testid="button-new-fleet"
            >
              <Plus className="size-5 sm:size-4 sm:mr-2" />
              <span className="hidden sm:inline">New Position</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {fleetData.map(({ mission, position }) => (
            <Card key={mission.id} className="border-border bg-card/50 rounded-sm hover:border-primary/50 transition-colors" data-testid={`fleet-card-${mission.id}`}>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg font-display flex items-center gap-2">
                    <Rocket className="size-4" />
                    {mission.missionCode}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`rounded-sm text-xs ${
                      position?.status === "Active"
                        ? "border-green-500 text-green-500"
                        : position?.status === "Standby"
                        ? "border-yellow-500 text-yellow-500"
                        : "border-gray-500 text-gray-500"
                    }`}
                    data-testid={`fleet-status-${mission.id}`}
                  >
                    {position?.status || "Unknown"}
                  </Badge>
                </div>
                <CardDescription className="font-medium text-foreground/80">{mission.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                {position ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="size-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground" data-testid={`fleet-sector-${mission.id}`}>
                          {position.sector}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Navigation className="size-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground" data-testid={`fleet-velocity-${mission.id}`}>
                          {position.velocity.toLocaleString()} km/h
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="size-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground" data-testid={`fleet-distance-${mission.id}`}>
                          {position.distance.toLocaleString()} km away
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground" data-testid={`fleet-lastcontact-${mission.id}`}>
                          Last contact {formatDistanceToNow(new Date(position.lastContact), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between text-xs mb-1 font-mono text-muted-foreground">
                        <span>COORDINATES</span>
                      </div>
                      <p className="font-mono text-xs text-primary" data-testid={`fleet-coordinates-${mission.id}`}>
                        {position.coordinates}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(position)}
                        className="flex-1 rounded-sm h-11"
                        data-testid={`button-edit-fleet-${mission.id}`}
                      >
                        <Pencil className="size-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteMissionId(mission.id)}
                        className="flex-1 rounded-sm text-destructive hover:text-destructive h-11"
                        data-testid={`button-delete-fleet-${mission.id}`}
                      >
                        <Trash2 className="size-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">Position data unavailable</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, missionId: mission.id });
                        setIsDialogOpen(true);
                      }}
                      className="rounded-sm h-11"
                      data-testid={`button-create-fleet-${mission.id}`}
                    >
                      <Plus className="size-4 mr-1" />
                      Add Position
                    </Button>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs mb-1 font-mono text-muted-foreground">
                    <span>MISSION PROGRESS</span>
                    <span data-testid={`fleet-progress-${mission.id}`}>{mission.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${mission.progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {fleetData.length === 0 && (
          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No fleet vessels currently tracked</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-sm">
          <DialogHeader>
            <DialogTitle>{editingPosition ? "Edit Fleet Position" : "New Fleet Position"}</DialogTitle>
            <DialogDescription>
              {editingPosition ? "Update the fleet position details" : "Add a new fleet position for a mission"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mission">Mission *</Label>
              <Select
                value={formData.missionId?.toString()}
                onValueChange={(value) => setFormData({ ...formData, missionId: parseInt(value) })}
                disabled={!!editingPosition}
              >
                <SelectTrigger id="mission" className="h-11" data-testid="select-mission">
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
              <Label htmlFor="sector">Sector *</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                placeholder="e.g., Alpha-7"
                className="h-11"
                data-testid="input-sector"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinates">Coordinates *</Label>
              <Input
                id="coordinates"
                value={formData.coordinates}
                onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                placeholder="e.g., 45.2°N, 122.3°W"
                className="h-11"
                data-testid="input-coordinates"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="velocity">Velocity (km/h) *</Label>
                <Input
                  id="velocity"
                  type="number"
                  value={formData.velocity}
                  onChange={(e) => setFormData({ ...formData, velocity: parseFloat(e.target.value) || 0 })}
                  className="h-11"
                  data-testid="input-velocity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km) *</Label>
                <Input
                  id="distance"
                  type="number"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
                  className="h-11"
                  data-testid="input-distance"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as "Active" | "Standby" | "Docked" })}
              >
                <SelectTrigger id="status" className="h-11" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Standby">Standby</SelectItem>
                  <SelectItem value="Docked">Docked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-sm h-11"
                data-testid="button-cancel-fleet"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-sm h-11"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-fleet"
              >
                {editingPosition ? "Update" : "Create"} Position
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteMissionId !== null} onOpenChange={() => setDeleteMissionId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fleet Position</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fleet position? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" data-testid="button-cancel-delete-fleet">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMissionId && deleteMutation.mutate(deleteMissionId)}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-fleet"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default FleetTracking;
