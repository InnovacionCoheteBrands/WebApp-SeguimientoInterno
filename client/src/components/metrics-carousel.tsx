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

  return (
    <Card className="border-border bg-card/50 rounded-sm min-w-[160px] flex-shrink-0">
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
  fleetStatus: { operational: number; total: number };
  personnel: { active: number; trend: string };
  systemLoad: { percent: number; status: string };
  threatLevel: { level: string; incidents: number };
}

export const MetricsCarousel = memo(({ 
  fleetStatus, 
  personnel, 
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
          title="Fleet Status"
          value={`${fleetStatus.operational}/${fleetStatus.total}`}
          subtitle="Operational"
          trend={`${Math.round((fleetStatus.operational / fleetStatus.total) * 100)}% active`}
          status={fleetStatus.operational === fleetStatus.total ? "success" : "warning"}
        />
        <MetricCard
          icon={Users}
          title="Active Personnel"
          value={personnel.active.toString()}
          subtitle="On Duty"
          trend={personnel.trend}
          status="success"
        />
        <MetricCard
          icon={Cpu}
          title="System Load"
          value={`${systemLoad.percent}%`}
          subtitle="Capacity Used"
          trend={systemLoad.status}
          status={systemLoad.percent > 80 ? "danger" : systemLoad.percent > 60 ? "warning" : "success"}
        />
        <MetricCard
          icon={ShieldAlert}
          title="Threat Level"
          value={threatLevel.level}
          subtitle="Secure"
          trend={`${threatLevel.incidents} incidents`}
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
