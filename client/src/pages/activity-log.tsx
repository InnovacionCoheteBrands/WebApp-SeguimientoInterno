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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    AGENCY_ROLE: "Roles de Agencia",
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
                    <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3 text-zinc-100">
                        <div className="p-2 rounded-full bg-primary/10 border border-white/10">
                            <Activity className="size-6 text-primary" />
                        </div>
                        Registro de Actividad
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm opacity-60 font-mono uppercase tracking-wider">
                        Audit Intelligence & System Monitoring
                    </p>
                </div>
                <Badge variant="outline" className="border-primary/20 text-primary text-xs font-mono">
                    <Clock className="size-3 mr-1" />
                    Auto-refresh 10s
                </Badge>
            </div>

            {/* ── Search Bar ── */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
                <Input
                    placeholder="Buscar por usuario, módulo o acción..."
                    className="pl-12 bg-zinc-950/40 backdrop-blur-md border-white/15 focus:border-white/30 rounded-full h-12 transition-all font-mono text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* ── Filters ── */}
            <div className="flex items-center gap-2 flex-wrap bg-white/5 p-3 rounded-3xl border border-white/5">
                <Filter className="size-4 text-muted-foreground mr-2 opacity-50" />
                <Button
                    size="sm"
                    variant={!entityFilter ? "default" : "outline"}
                    className={`rounded-full text-[10px] font-mono h-8 px-4 uppercase tracking-wider transition-all duration-300 ${!entityFilter ? 'bg-primary text-primary-foreground' : 'border-white/10 text-muted-foreground hover:bg-white/10'}`}
                    onClick={() => setEntityFilter(undefined)}
                >
                    Todos
                </Button>
                {entityTypes.map((type) => (
                    <Button
                        key={type}
                        size="sm"
                        variant={entityFilter === type ? "default" : "outline"}
                        className={`rounded-full text-[10px] font-mono h-8 px-4 uppercase tracking-wider transition-all duration-300 ${entityFilter === type ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-white/10 text-muted-foreground hover:bg-white/10'}`}
                        onClick={() => setEntityFilter(entityFilter === type ? undefined : type)}
                    >
                        {ENTITY_LABELS[type]}
                    </Button>
                ))}
            </div>

            {/* ── Activity Table ── */}
            <Card className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] overflow-hidden group">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-display flex items-center justify-between text-zinc-100">
                        <span className="uppercase tracking-tight">Últimos Movimientos</span>
                        <span className="text-[10px] font-mono text-muted-foreground opacity-60 uppercase tracking-widest">
                            {filteredLogs.length} OF {logs.length} RECORDS
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
                            <div className="grid grid-cols-[1fr_80px_150px_150px_180px] gap-4 px-8 py-4 bg-white/5 border-b border-white/5 text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                <span>Acción Detectada</span>
                                <span className="text-center">Auth</span>
                                <span>Identity</span>
                                <span>Functional Area</span>
                                <span>Precision Timestamp</span>
                            </div>

                            {/* Data rows */}
                            <div className="divide-y divide-white/5">
                                {filteredLogs.map((log) => {
                                    const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
                                    const ActionIcon = config.icon;
                                    return (
                                        <div
                                            key={log.id}
                                            className="grid grid-cols-[1fr_80px_150px_150px_180px] gap-4 px-8 py-4 hover:bg-white/5 transition-colors group items-center border-b border-white/5 last:border-0"
                                        >
                                            {/* Acción */}
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 border border-white/5 ${config.color.replace('bg-', 'bg-opacity-20 bg-')}`}>
                                                    <ActionIcon className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate text-zinc-100">{log.details}</p>
                                                    <Badge variant="outline" className={`text-[9px] h-4 px-2 mt-1 border-transparent rounded-full font-mono uppercase tracking-wider ${config.color}`}>
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Perfil */}
                                            <div className="flex justify-center">
                                                <Avatar className="h-9 w-9 border border-white/15 ring-2 ring-white/5 transition-transform group-hover:scale-110">
                                                    <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold font-mono">
                                                        {log.username ? log.username.substring(0, 2) : "US"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>

                                            {/* Usuario */}
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="size-3.5 text-muted-foreground opacity-40" />
                                                <span className="font-medium text-zinc-300">{log.username}</span>
                                            </div>

                                            {/* Módulo */}
                                            <div>
                                                <Badge variant="outline" className="text-[9px] font-mono h-5 px-2 border-white/10 bg-white/5 text-zinc-400 rounded-full uppercase tracking-wider">
                                                    {ENTITY_LABELS[log.entityType] || log.entityType}
                                                </Badge>
                                            </div>

                                            {/* Fecha */}
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                <span className="text-zinc-400">{formatTimestamp(log.timestamp)}</span>
                                                {log.ipAddress && (
                                                    <span className="block text-[8px] opacity-0 group-hover:opacity-40 transition-opacity mt-1">
                                                        SRC: {log.ipAddress}
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
