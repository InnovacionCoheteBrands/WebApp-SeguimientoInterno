import { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { MoreVertical, TrendingUp, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface CompactMissionCardProps {
  id: number;
  missionCode: string;
  name: string;
  status: string;
  priority: string;
  progress: number;
  createdAt?: string;
  updatedAt?: string;
  onMenuClick: () => void;
}

export const CompactMissionCard = memo(({ 
  id, 
  missionCode, 
  name, 
  status, 
  priority, 
  progress,
  createdAt,
  updatedAt,
  onMenuClick 
}: CompactMissionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const statusColors: Record<string, string> = {
    Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Active: "bg-green-500/20 text-green-400 border-green-500/30",
    Completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const priorityColors: Record<string, string> = {
    Low: "bg-gray-500/20 text-gray-400",
    Medium: "bg-yellow-500/20 text-yellow-400",
    High: "bg-red-500/20 text-red-400",
  };

  // Calculate circular progress arc
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card className="border-border bg-card/50 rounded-sm overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 min-w-0 text-left touch-manipulation"
            data-testid={`button-expand-${id}`}
          >
            <div className="flex items-center gap-1">
              <p className="text-[10px] uppercase tracking-widest text-primary font-display font-bold truncate">
                {missionCode}
              </p>
              {expanded ? (
                <ChevronUp className="size-3 text-primary shrink-0" />
              ) : (
                <ChevronDown className="size-3 text-primary shrink-0" />
              )}
            </div>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 -mr-2"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick();
            }}
            data-testid={`button-menu-${id}`}
          >
            <MoreVertical className="size-5" />
          </Button>
        </div>

        <h3 className="text-sm font-semibold mb-2 line-clamp-2 min-h-[2.5rem]">
          {name}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <Badge 
            variant="outline" 
            className={cn("text-[10px] px-1.5 py-0", statusColors[status])}
          >
            {status}
          </Badge>
          <Badge 
            variant="outline" 
            className={cn("text-[10px] px-1.5 py-0", priorityColors[priority])}
          >
            {priority}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative size-16">
              <svg className="size-16 -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="text-primary transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-display font-bold">{progress}%</span>
              </div>
            </div>
          </div>
          
          {progress > 0 && (
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp className="size-3" />
              <span className="text-[10px] font-mono font-bold">ACTIVE</span>
            </div>
          )}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                  Progress
                </span>
                <span className="text-xs font-display font-bold text-primary">
                  {progress}%
                </span>
              </div>
              <ProgressBar value={progress} className="h-1.5" />
            </div>
            
            {(createdAt || updatedAt) && (
              <div className="space-y-1">
                {updatedAt && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="size-3" />
                    <span className="font-mono">
                      Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
                {createdAt && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="size-3" />
                    <span className="font-mono">
                      Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CompactMissionCard.displayName = "CompactMissionCard";
