/**
 * ProjectCard - Premium vertical project card
 */

import {
    Briefcase,
    Calendar,
    ChevronDown,
    DollarSign,
    Edit,
    FileText,
    Trash2,
    Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/api";
import { mapProjectStatusToTab, normalizeComparableText } from "./project-analytics-helpers";

interface ProjectCardProps {
    project: Project & {
        effectiveQuotation?: number;
        serviceNames?: string[];
    };
    onEdit: (project: Project) => void;
    onDelete: (id: number) => void;
    onStatusChange: (id: number, status: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
    active: { label: "En Desarrollo", color: "text-green-400", dotColor: "bg-green-500" },
    on_hold: { label: "Pausa", color: "text-yellow-400", dotColor: "bg-yellow-500" },
    completed: { label: "Terminado", color: "text-red-400", dotColor: "bg-red-500" },
    planning: { label: "Planeacion", color: "text-blue-400", dotColor: "bg-blue-500" },
    cancelled: { label: "Cancelado", color: "text-gray-400", dotColor: "bg-gray-500" },
};

const statusOptions = [
    { value: "active", label: "En Desarrollo" },
    { value: "on_hold", label: "Pausa" },
    { value: "completed", label: "Terminado" },
    { value: "planning", label: "Planeacion" },
];

export function ProjectCard({
    project,
    onEdit,
    onDelete,
    onStatusChange,
}: ProjectCardProps) {
    const normalizedStatus = normalizeComparableText(project.status);
    const statusKey =
        normalizedStatus === "cancelado" || normalizedStatus === "cancelled"
            ? "cancelled"
            : mapProjectStatusToTab(project.status) || "planning";
    const status = statusConfig[statusKey];
    const initial = project.name.charAt(0).toUpperCase();

    const formatCurrency = (amount: string | number | undefined | null) => {
        if (!amount) return "$0";
        const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
        if (Number.isNaN(numericAmount)) return "$0";
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 0,
        }).format(numericAmount);
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
        <Card className="group relative flex flex-col overflow-hidden border-white/15 bg-zinc-950/40 ring-1 ring-inset ring-white/10 transition-all duration-500 hover:border-white/30 hover:bg-zinc-900/50">
            <div className="relative flex h-32 items-center justify-center overflow-hidden border-b border-white/5 bg-gradient-to-br from-zinc-800/50 to-zinc-950/50">
                <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10 text-center">
                    <span className="text-4xl font-display font-bold text-zinc-100 transition-colors duration-500 group-hover:text-primary">
                        {initial}
                    </span>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">Proyecto</p>
                </div>
            </div>

            <div className="flex-1 space-y-4 p-4">
                <div>
                    <h3 className="line-clamp-1 font-semibold text-foreground">{project.name}</h3>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                        {project.client?.companyName || "Sin cliente"}
                    </p>
                </div>

                <Badge variant="secondary" className="text-xs">
                    {project.serviceType || "General"}
                </Badge>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-9 w-full justify-between bg-muted/30 px-3 hover:bg-muted/50"
                        >
                            <div className="flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", status.dotColor)} />
                                <span className={cn("text-sm", status.color)}>{status.label}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        {statusOptions.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => onStatusChange(project.id, option.value)}
                                className="flex items-center gap-2"
                            >
                                <span
                                    className={cn(
                                        "h-2 w-2 rounded-full",
                                        statusConfig[option.value]?.dotColor || "bg-gray-500",
                                    )}
                                />
                                {option.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="space-y-2 text-sm">
                    {project.description ? (
                        <div className="flex items-start gap-2 text-muted-foreground">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="line-clamp-2">{project.description}</span>
                        </div>
                    ) : null}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4 shrink-0" />
                        <span>{formatCurrency(project.effectiveQuotation ?? project.quotationAmount ?? project.budget)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>{formatDate(project.startDate || project.deadline)}</span>
                    </div>
                    {project.monthlyMaintenance ? (
                        <div className="flex items-center gap-2 text-green-400">
                            <Wrench className="h-4 w-4 shrink-0" />
                            <span>{formatCurrency(project.monthlyMaintenance)}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Wrench className="h-4 w-4 shrink-0" />
                            <span>Sin mantenimiento mensual</span>
                        </div>
                    )}
                    {project.serviceNames && project.serviceNames.length > 0 ? (
                        <div className="flex items-start gap-2 text-muted-foreground">
                            <Briefcase className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="line-clamp-2">{project.serviceNames.join(", ")}</span>
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center gap-2 border-t border-border/50 pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(project)}
                        className="h-8 flex-1 text-xs"
                    >
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Editar
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(project.id)}
                        className="h-8 flex-1 text-xs text-destructive hover:text-destructive"
                    >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Eliminar
                    </Button>
                </div>
            </div>
        </Card>
    );
}
