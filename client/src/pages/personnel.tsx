import { ArrowLeft, Users, Shield, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";

const personnelData = [
  { id: 1, name: "Commander Shepard", role: "Mission Director", clearance: "Level 5", status: "Active", initials: "CS" },
  { id: 2, name: "Lt. Anderson", role: "Tactical Officer", clearance: "Level 4", status: "Active", initials: "LA" },
  { id: 3, name: "Dr. Liara", role: "Research Lead", clearance: "Level 4", status: "Active", initials: "DL" },
  { id: 4, name: "Garrus Vakarian", role: "Security Chief", clearance: "Level 4", status: "On Duty", initials: "GV" },
  { id: 5, name: "Tali'Zorah", role: "Engineering Lead", clearance: "Level 3", status: "Active", initials: "TZ" },
  { id: 6, name: "Wrex", role: "Combat Specialist", clearance: "Level 3", status: "On Leave", initials: "WX" },
];

export default function Personnel() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Total Staff</span>
                <Users className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight">1,284</h3>
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
                <h3 className="text-2xl font-display font-bold tracking-tight">892</h3>
                <p className="text-xs text-muted-foreground">Current Shift</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Security</span>
                <Shield className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight">156</h3>
                <p className="text-xs text-muted-foreground">Security Staff</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Top Rated</span>
                <Award className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold tracking-tight">98%</h3>
                <p className="text-xs text-muted-foreground">Performance</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personnel List */}
        <Card className="border-border bg-card/50 rounded-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display">Key Personnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {personnelData.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-4 border border-border rounded-sm hover:bg-muted/30 transition-colors"
                  data-testid={`personnel-card-${person.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12 border-2 border-primary/20">
                      <AvatarFallback className="font-display font-bold bg-primary/10 text-primary">
                        {person.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{person.name}</p>
                      <p className="text-xs text-muted-foreground">{person.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-mono text-muted-foreground">{person.clearance}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`rounded-sm text-xs ${
                        person.status === "Active" || person.status === "On Duty"
                          ? "border-green-500 text-green-500"
                          : "border-yellow-500 text-yellow-500"
                      }`}
                    >
                      {person.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
