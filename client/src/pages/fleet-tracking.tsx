import { useMemo } from "react";
import { Rocket, ArrowLeft, Globe, MapPin, Navigation, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchMissions, fetchFleetPositions } from "@/lib/api";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function FleetTracking() {
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
              <h1 className="text-3xl font-display font-bold tracking-tight">Fleet Tracking</h1>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                Real-time Mission Locations
              </p>
            </div>
          </div>
          <Badge variant="outline" className="rounded-sm font-mono font-normal text-primary border-primary/30 bg-primary/5">
            {fleetData.length} VESSELS
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fleetData.map(({ mission, position }) => (
            <Card key={mission.id} className="border-border bg-card/50 rounded-sm hover:border-primary/50 transition-colors" data-testid={`fleet-card-${mission.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
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
              <CardContent className="space-y-4">
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
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground">Position data unavailable</p>
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
    </div>
  );
}
