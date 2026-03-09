import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs, type AuditLogEntry } from "@/lib/api";
import { useState } from "react";
import {
    Shield,
    LogIn,
    Plus,
    Pencil,
    Trash2,
    Filter,
    Clock,
    User,
    Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ACTION_CONFIG: Record<string, { icon: typeof LogIn; color: string; label: string }> = {
    LOGIN: { icon: LogIn, color: "text-blue-400 bg-blue-400/10", label: "Inicio de Sesión" },
    CREATE: { icon: Plus, color: "text-emerald-400 bg-emerald-400/10", label: "Creación" },
    UPDATE: { icon: Pencil, color: "text-amber-400 bg-amber-400/10", label: "Actualización" },
    DELETE: { icon: Trash2, color: "text-red-400 bg-red-400/10", label: "Eliminación" },
};

const ENTITY_LABELS: Record<string, string> = {
    AUTH: "Autenticación",
    PROJECT: "Proyectos",
    CLIENT: "Clientes",
    FINANCE: "Finanzas",
    TEAM: "Equipo",
};

function formatTimestamp(ts: string): string {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return "Ahora mismo";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffH < 24) return `Hace ${diffH}h`;
    if (diffD < 7) return `Hace ${diffD} día${diffD > 1 ? "s" : ""}`;
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function formatFullDate(ts: string): string {
    return new Date(ts).toLocaleString("es-MX", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function ActivityLog() {
    const [entityFilter, setEntityFilter] = useState<string | undefined>(undefined);

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ["audit-logs", entityFilter],
        queryFn: () => fetchAuditLogs({ limit: 200, entityType: entityFilter }),
        refetchInterval: 15000,
    });

    const entityTypes = ["AUTH", "PROJECT", "CLIENT", "FINANCE", "TEAM"];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
                        <Activity className="size-8 text-primary" />
                        Registro de Actividad
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitorea todas las acciones realizadas por los usuarios del sistema.
                    </p>
                </div>
                <Badge variant="outline" className="border-primary/20 text-primary text-xs font-mono">
                    <Clock className="size-3 mr-1" />
                    Auto-refresh 15s
                </Badge>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="size-4 text-muted-foreground" />
                <Button
                    size="sm"
                    variant={!entityFilter ? "default" : "outline"}
                    className="rounded-full text-xs h-8"
                    onClick={() => setEntityFilter(undefined)}
                >
                    Todos
                </Button>
                {entityTypes.map((type) => (
                    <Button
                        key={type}
                        size="sm"
                        variant={entityFilter === type ? "default" : "outline"}
                        className="rounded-full text-xs h-8"
                        onClick={() => setEntityFilter(entityFilter === type ? undefined : type)}
                    >
                        {ENTITY_LABELS[type] || type}
                    </Button>
                ))}
            </div>

            {/* Activity List */}
            <Card className="border-white/5 bg-card/50 backdrop-blur-xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>Últimos Movimientos</span>
                        <span className="text-xs font-mono text-muted-foreground">{logs.length} registros</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="size-8 border-4 border-primary/50 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Shield className="size-12 opacity-30 mb-4" />
                            <p className="text-sm">No hay registros de actividad aún.</p>
                            <p className="text-xs opacity-60 mt-1">Las acciones se registrarán automáticamente.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map((log) => {
                                const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
                                const ActionIcon = config.icon;
                                return (
                                    <div
                                        key={log.id}
                                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                                    >
                                        {/* Icon */}
                                        <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                                            <ActionIcon className="size-4" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-tight">
                                                {log.details}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <User className="size-3" />
                                                    {log.username}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] h-5 px-2 border-white/10">
                                                    {ENTITY_LABELS[log.entityType] || log.entityType}
                                                </Badge>
                                                <Badge variant="outline" className={`text-[10px] h-5 px-2 border-transparent ${config.color}`}>
                                                    {config.label}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Timestamp */}
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-muted-foreground" title={formatFullDate(log.timestamp)}>
                                                {formatTimestamp(log.timestamp)}
                                            </p>
                                            {log.ipAddress && (
                                                <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {log.ipAddress}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
