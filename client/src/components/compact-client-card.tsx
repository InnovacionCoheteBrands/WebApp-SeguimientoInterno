import { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, DollarSign, TrendingUp, Clock, ChevronDown, ChevronUp, Pencil, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface CompactClientCardProps {
  campaignId: number;
  campaignCode: string;
  clientName: string;
  accountData?: {
    industry: string;
    monthlyBudget: number;
    currentSpend: number;
    healthScore: string;
    status: string;
    lastContact: string;
  } | null;
  campaignProgress: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onCreate?: () => void;
}

export const CompactClientCard = memo(({ 
  campaignId,
  campaignCode,
  clientName,
  accountData,
  campaignProgress,
  onEdit,
  onDelete,
  onCreate
}: CompactClientCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    Active: "border-green-500/30 bg-green-500/20 text-green-400",
    Paused: "border-yellow-500/30 bg-yellow-500/20 text-yellow-400",
    Planning: "border-muted-foreground/30 bg-muted text-muted-foreground",
  };

  return (
    <Card className={cn(
      "border-border rounded-sm overflow-hidden transition-all duration-200",
      expanded 
        ? "bg-gradient-to-br from-card/70 via-card/50 to-primary/5 shadow-lg" 
        : "bg-card/50"
    )}>
      <CardContent className="p-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left touch-manipulation mb-2 h-11 flex items-center"
          data-testid={`button-expand-client-${campaignId}`}
        >
          <div className="flex items-center justify-between flex-1">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <Briefcase className="size-3 text-primary shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-primary font-display font-bold truncate">
                {campaignCode}
              </p>
              {expanded ? (
                <ChevronUp className="size-3 text-primary shrink-0" />
              ) : (
                <ChevronDown className="size-3 text-primary shrink-0" />
              )}
            </div>
            {accountData && (
              <Badge 
                variant="outline" 
                className={cn("text-[10px] px-1.5 py-0", statusColors[accountData.status] || statusColors.Planning)}
              >
                {accountData.status}
              </Badge>
            )}
          </div>
        </button>

        <h3 className="text-sm font-semibold mb-2 line-clamp-2 min-h-[2.5rem]">
          {clientName}
        </h3>

        {accountData ? (
          <>
            <div className="space-y-1.5 mb-2">
              <div className="flex items-center gap-1.5 text-[10px]">
                <MapPin className="size-3 text-muted-foreground shrink-0" />
                <span className="font-mono text-muted-foreground truncate">{accountData.industry}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <DollarSign className="size-3 text-muted-foreground shrink-0" />
                <span className="font-mono text-muted-foreground">${accountData.monthlyBudget.toLocaleString()} presupuesto</span>
              </div>
            </div>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-border space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <TrendingUp className="size-3 text-muted-foreground shrink-0" />
                    <span className="font-mono text-muted-foreground">${accountData.currentSpend.toLocaleString()} gastado</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <Clock className="size-3 text-muted-foreground shrink-0" />
                    <span className="font-mono text-muted-foreground">
                      {formatDistanceToNow(new Date(accountData.lastContact), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                    Health Score
                  </span>
                  <p className="font-mono text-xs text-primary break-all">
                    {accountData.healthScore}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                      Progreso Campaña
                    </span>
                    <span className="text-xs font-display font-bold text-primary">
                      {campaignProgress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${campaignProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                    className="flex-1 rounded-sm h-11"
                    data-testid={`button-edit-compact-client-${campaignId}`}
                  >
                    <Pencil className="size-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                    className="flex-1 rounded-sm text-destructive hover:text-destructive h-11"
                    data-testid={`button-delete-compact-client-${campaignId}`}
                  >
                    <Trash2 className="size-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-3">Datos de cuenta no disponibles</p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCreate?.();
              }}
              className="rounded-sm h-11"
              data-testid={`button-create-compact-client-${campaignId}`}
            >
              <Plus className="size-4 mr-1" />
              Agregar Cuenta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CompactClientCard.displayName = "CompactClientCard";
