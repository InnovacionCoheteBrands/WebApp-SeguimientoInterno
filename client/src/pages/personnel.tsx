import { useMemo, memo } from "react";
import { ArrowLeft, Users, Shield, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchPersonnel, fetchPersonnelAssignments, fetchMissions } from "@/lib/api";

const Personnel = memo(function Personnel() {
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
        .map(a => missions.find(m => m.id === a.missionId))
        .filter(Boolean);
      
      return {
        ...person,
        assignedMissions: assignedMissions.length,
        missionNames: assignedMissions.map(m => m?.missionCode).join(", "),
      };
    });
  }, [allPersonnel, assignments, missions]);

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
              <h1 className="text-3xl font-display font-bold tracking-tight">Personnel</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                Mission Control Staff
              </p>
            </div>
          </div>
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
                  className="flex items-center justify-between p-4 border border-border rounded-sm hover:bg-muted/30 transition-colors"
                  data-testid={`personnel-card-${person.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12 border-2 border-primary/20">
                      <AvatarFallback className="font-display font-bold bg-primary/10 text-primary">
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium text-sm" data-testid={`personnel-name-${person.id}`}>{person.name}</p>
                      <p className="text-xs text-muted-foreground" data-testid={`personnel-role-${person.id}`}>{person.role}</p>
                      {person.assignedMissions > 0 && (
                        <p className="text-xs text-primary font-mono" data-testid={`personnel-missions-${person.id}`}>
                          {person.missionNames}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
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
    </div>
  );
});

export default Personnel;
