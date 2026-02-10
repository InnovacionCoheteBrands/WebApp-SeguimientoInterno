/**
 * ProjectsTable - List/Table view for projects
 * Part of Projects View Redesign
 */

import {
    Calendar,
    ChevronDown,
    Edit,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/api";

interface ProjectsTableProps {
    projects: Project[];
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

export function ProjectsTable({
    projects,
    onEdit,
    onDelete,
    onStatusChange,
}: ProjectsTableProps) {
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
        if (!date) return "—";
        return new Date(date).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    if (projects.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12 bg-card/30 rounded-lg border border-border/50">
                No hay proyectos que mostrar
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold">Proyecto</TableHead>
                        <TableHead className="font-semibold">Cliente</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold text-right">Presupuesto</TableHead>
                        <TableHead className="font-semibold">Fecha Inicio</TableHead>
                        <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => {
                        const status = statusConfig[project.status] || statusConfig.planning;
                        return (
                            <TableRow key={project.id} className="group hover:bg-muted/20">
                                {/* Project Name & Description */}
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{project.name}</p>
                                        {project.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                                {project.description}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Client */}
                                <TableCell className="text-muted-foreground">
                                    {project.client?.companyName || "—"}
                                </TableCell>

                                {/* Type */}
                                <TableCell>
                                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                                        {project.serviceType || "General"}
                                    </span>
                                </TableCell>

                                {/* Status Dropdown */}
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 gap-1.5"
                                            >
                                                <span className={cn("w-2 h-2 rounded-full", status.dotColor)} />
                                                <span className={cn("text-xs", status.color)}>{status.label}</span>
                                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-40">
                                            {statusOptions.map((opt) => (
                                                <DropdownMenuItem
                                                    key={opt.value}
                                                    onClick={() => onStatusChange(project.id, opt.value)}
                                                    className="flex items-center gap-2 text-xs"
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
                                </TableCell>

                                {/* Budget */}
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(project.budget)}
                                </TableCell>

                                {/* Date */}
                                <TableCell className="text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(project.startDate || project.deadline)}
                                    </div>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => onEdit(project)}
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => onDelete(project.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
