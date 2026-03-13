/**
 * ProjectCard - Premium vertical project card
 * Part of Projects View Redesign
 * Replicates the card design from cohetebrands.web.app/proyectos
 */

import {
    Calendar,
    DollarSign,
    FileText,
    Wrench,
    Edit,
    Trash2,
    ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/api";

interface ProjectCardProps {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (id: number) => void;
    onStatusChange: (id: number, status: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
    active: { label: "En Desarrollo", color: "text-green-400", dotColor: "bg-green-500" },
    on_hold: { label: "Pausa", color: "text-yellow-400", dotColor: "bg-yellow-500" },
    completed: { label: "Terminado", color: "text-red-400", dotColor: "bg-red-500" },
    planning: { label: "Planeación", color: "text-blue-400", dotColor: "bg-blue-500" },
    cancelled: { label: "Cancelado", color: "text-gray-400", dotColor: "bg-gray-500" },
};

const statusOptions = [
    { value: "active", label: "En Desarrollo" },
    { value: "on_hold", label: "Pausa" },
    { value: "completed", label: "Terminado" },
    { value: "planning", label: "Planeación" },
];

export function ProjectCard({
    project,
    onEdit,
    onDelete,
    onStatusChange,
}: ProjectCardProps) {
    const status = statusConfig[project.status] || statusConfig.planning;
    const initial = project.name.charAt(0).toUpperCase();

    const formatCurrency = (amount: string | number | undefined | null) => {
        if (!amount) return "$0";
        const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return "$0";
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 0,
        }).format(numAmount);
    };

    const formatDate = (date: string | Date | undefined | null) => {
        if (!date) return "Sin fecha";
        return new Date(date).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <Card className="group relative flex flex-col overflow-hidden border-white/15 ring-1 ring-inset ring-white/10 bg-zinc-950/40 hover:bg-zinc-900/50 hover:border-white/30 transition-all duration-500">
            {/* Header with Initial - Refined Zinc Gradient */}
            <div className="flex items-center justify-center h-32 bg-gradient-to-br from-zinc-800/50 to-zinc-950/50 relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="text-center relative z-10">
                    <span className="text-4xl font-display font-bold text-zinc-100 group-hover:text-primary transition-colors duration-500">{initial}</span>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-2 font-medium">Proyecto</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-4">
                {/* Project Identity */}
                <div>
                    <h3 className="font-semibold text-foreground line-clamp-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.client?.companyName || "Sin cliente"}
                    </p>
                </div>

                {/* Type Badge */}
                <Badge variant="secondary" className="text-xs">
                    {project.serviceType || "General"}
                </Badge>

                {/* Status Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-between h-9 px-3 bg-muted/30 hover:bg-muted/50"
                        >
                            <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", status.dotColor)} />
                                <span className={cn("text-sm", status.color)}>{status.label}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        {statusOptions.map((opt) => (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={() => onStatusChange(project.id, opt.value)}
                                className="flex items-center gap-2"
                            >
                                <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    statusConfig[opt.value]?.dotColor || "bg-gray-500"
                                )} />
                                {opt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Data Points */}
                <div className="space-y-2 text-sm">
                    {project.description && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                            <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{project.description}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-4 h-4 shrink-0" />
                        <span>{formatCurrency(project.budget)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{formatDate(project.startDate || project.deadline)}</span>
                    </div>
                    {project.monthlyMaintenance && (
                        <div className="flex items-center gap-2 text-green-400">
                            <Wrench className="w-4 h-4 shrink-0" />
                            <span>{formatCurrency(project.monthlyMaintenance)}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(project)}
                        className="flex-1 h-8 text-xs"
                    >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Editar
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(project.id)}
                        className="flex-1 h-8 text-xs text-destructive hover:text-destructive"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Eliminar
                    </Button>
                </div>
            </div>
        </Card>
    );
}
