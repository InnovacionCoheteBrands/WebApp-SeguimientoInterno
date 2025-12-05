import { memo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, Users, Cpu, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  status?: "success" | "warning" | "danger" | "neutral";
}

const MetricCard = memo(({ icon: Icon, title, value, subtitle, trend, status = "neutral" }: MetricCardProps) => {
  const statusColors = {
    success: "text-green-400",
    warning: "text-yellow-400",
    danger: "text-red-400",
    neutral: "text-muted-foreground"
  };

  const glowEffects = {
    success: "",
    warning: "shadow-[0_0_10px_rgba(234,179,8,0.2)]",
    danger: "shadow-[0_0_10px_rgba(239,68,68,0.3)]",
    neutral: ""
  };

  return (
    <Card className={cn("border-border bg-card/50 rounded-sm min-w-[160px] flex-shrink-0 transition-shadow", glowEffects[status])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
            {title}
          </p>
          <Icon className="size-4 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-display font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend && (
            <p className={cn("text-[10px] font-mono font-bold", statusColors[status])}>
              {trend}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = "MetricCard";

interface MetricsCarouselProps {
  clientStatus: { operational: number; total: number };
  team: { active: number; trend: string };
  systemLoad: { percent: number; status: string };
  threatLevel: { level: string; incidents: number };
}

export const MetricsCarousel = memo(({
  clientStatus,
  team,
  systemLoad,
  threatLevel
}: MetricsCarouselProps) => {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true
  });

  return (
    <div className="md:hidden overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3">
        <MetricCard
          icon={Rocket}
          title="Clientes Activos"
          value={`${clientStatus.operational}/${clientStatus.total}`}
          subtitle="ESTADO"
          trend={`${Math.round((clientStatus.operational / clientStatus.total) * 100)}% activos`}
          status={clientStatus.operational === clientStatus.total ? "success" : "warning"}
        />
        <MetricCard
          icon={Users}
          title="Equipo Activo"
          value={team.active.toString()}
          subtitle="EN SERVICIO"
          trend={team.trend}
          status="success"
        />
        <MetricCard
          icon={Cpu}
          title="Carga del Sistema"
          value={`${systemLoad.percent}%`}
          subtitle="Capacidad Usada"
          trend={systemLoad.status}
          status={systemLoad.percent > 80 ? "danger" : systemLoad.percent > 60 ? "warning" : "success"}
        />
        <MetricCard
          icon={ShieldAlert}
          title="Nivel de Urgencia"
          value={threatLevel.level}
          subtitle="Seguro"
          trend={`${threatLevel.incidents} incidentes`}
          status={
            threatLevel.level === "HIGH" ? "danger" :
              threatLevel.level === "MEDIUM" ? "warning" :
                "success"
          }
        />
      </div>
    </div>
  );
});

MetricsCarousel.displayName = "MetricsCarousel";
