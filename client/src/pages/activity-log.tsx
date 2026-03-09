import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs, type AuditLogEntry } from "@/lib/api";
import { useState, useMemo } from "react";
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
    Search,
    ArrowUpDown,
    Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

/* ── Action → visual config ── */
const ACTION_CONFIG: Record<string, { icon: typeof LogIn; color: string; label: string }> = {
    LOGIN: { icon: LogIn, color: "text-blue-400 bg-blue-400/10", label: "Inicio de Sesión" },
    CREATE: { icon: Plus, color: "text-emerald-400 bg-emerald-400/10", label: "Creación" },
    UPDATE: { icon: Pencil, color: "text-amber-400 bg-amber-400/10", label: "Actualización" },
    UPDATE_USER: { icon: Pencil, color: "text-amber-400 bg-amber-400/10", label: "Actualización" },
    DELETE: { icon: Trash2, color: "text-red-400 bg-red-400/10", label: "Eliminación" },
    DELETE_USER: { icon: Trash2, color: "text-red-400 bg-red-400/10", label: "Eliminación" },
    ASSIGN: { icon: Link2, color: "text-violet-400 bg-violet-400/10", label: "Asignación" },
    UNASSIGN: { icon: Link2, color: "text-orange-400 bg-orange-400/10", label: "Desasignación" },
    ADD_SERVICE: { icon: Plus, color: "text-emerald-400 bg-emerald-400/10", label: "Creación" },
    REMOVE_SERVICE: { icon: Trash2, color: "text-red-400 bg-red-400/10", label: "Eliminación" },
    CONVERT: { icon: ArrowUpDown, color: "text-cyan-400 bg-cyan-400/10", label: "Conversión" },
    UNPAY: { icon: ArrowUpDown, color: "text-orange-400 bg-orange-400/10", label: "Reversión" },
};

const ENTITY_LABELS: Record<string, string> = {
    AUTH: "Autenticación",
    PROJECT: "Proyectos",
    CLIENT: "Clientes",
    FINANCE: "Finanzas",
    FINANCE_RECURRING: "Finanzas (Recurrente)",
    TEAM: "Equipo",
    LEAD: "CRM / Leads",
    DELIVERABLE: "Entregables",
    ATTACHMENT: "Archivos",
    SERVICE: "Servicios",
    SUPPLIER: "Proveedores",
    USER: "Usuarios",
    POE: "POES",
};

function formatTimestamp(ts: string): string {
    return new Date(ts).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ActivityLog() {
    const [entityFilter, setEntityFilter] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState("");

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ["audit-logs", entityFilter],
        queryFn: () => fetchAuditLogs({ limit: 500, entityType: entityFilter }),
        refetchInterval: 10000,
    });

    /* ── Search & Filter ── */
    const filteredLogs = useMemo(() => {
        if (!searchTerm.trim()) return logs;
        const q = searchTerm.toLowerCase();
        return logs.filter(
            (log) =>
                log.username?.toLowerCase().includes(q) ||
                log.details?.toLowerCase().includes(q) ||
                (ENTITY_LABELS[log.entityType] || log.entityType).toLowerCase().includes(q) ||
                (ACTION_CONFIG[log.action]?.label || log.action).toLowerCase().includes(q)
        );
    }, [logs, searchTerm]);

    const entityTypes = Object.keys(ENTITY_LABELS);

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
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
                    Auto-refresh 10s
                </Badge>
            </div>

            {/* ── Search Bar ── */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por usuario, módulo o acción..."
                    className="pl-10 bg-card/50 border-white/10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* ── Filters ── */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="size-4 text-muted-foreground" />
                <Button
                    size="sm"
                    variant={!entityFilter ? "default" : "outline"}
                    className="rounded-full text-xs h-7"
                    onClick={() => setEntityFilter(undefined)}
                >
                    Todos
                </Button>
                {entityTypes.map((type) => (
                    <Button
                        key={type}
                        size="sm"
                        variant={entityFilter === type ? "default" : "outline"}
                        className="rounded-full text-xs h-7"
                        onClick={() => setEntityFilter(entityFilter === type ? undefined : type)}
                    >
                        {ENTITY_LABELS[type]}
                    </Button>
                ))}
            </div>

            {/* ── Activity Table ── */}
            <Card className="border-white/5 bg-card/50 backdrop-blur-xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>Últimos Movimientos</span>
                        <span className="text-xs font-mono text-muted-foreground">
                            {filteredLogs.length} de {logs.length} registros
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="size-8 border-4 border-primary/50 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Shield className="size-12 opacity-30 mb-4" />
                            <p className="text-sm">No hay registros de actividad.</p>
                            <p className="text-xs opacity-60 mt-1">
                                {searchTerm ? "Intenta con otro término de búsqueda." : "Las acciones se registrarán automáticamente."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {/* Header row */}
                            <div className="grid grid-cols-[1fr_150px_150px_180px] gap-4 px-6 py-3 border-b border-white/5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <span>Acción</span>
                                <span>Usuario</span>
                                <span>Módulo</span>
                                <span>Fecha y Horario</span>
                            </div>

                            {/* Data rows */}
                            <div className="divide-y divide-white/5">
                                {filteredLogs.map((log) => {
                                    const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
                                    const ActionIcon = config.icon;
                                    return (
                                        <div
                                            key={log.id}
                                            className="grid grid-cols-[1fr_150px_150px_180px] gap-4 px-6 py-3 hover:bg-white/5 transition-colors group items-center"
                                        >
                                            {/* Acción */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                                                    <ActionIcon className="size-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{log.details}</p>
                                                    <Badge variant="outline" className={`text-[10px] h-4 px-1.5 mt-0.5 border-transparent ${config.color}`}>
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Usuario */}
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <User className="size-3.5 text-muted-foreground" />
                                                <span className="font-medium">{log.username}</span>
                                            </div>

                                            {/* Módulo */}
                                            <div>
                                                <Badge variant="outline" className="text-[11px] h-5 px-2 border-white/10">
                                                    {ENTITY_LABELS[log.entityType] || log.entityType}
                                                </Badge>
                                            </div>

                                            {/* Fecha */}
                                            <div className="text-xs text-muted-foreground">
                                                <span>{formatTimestamp(log.timestamp)}</span>
                                                {log.ipAddress && (
                                                    <span className="block text-[10px] font-mono opacity-0 group-hover:opacity-60 transition-opacity mt-0.5">
                                                        IP: {log.ipAddress}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
