/**
 * ProjectFilters - Multi-criteria filter bar
 * Part of Projects View Redesign
 */

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { ClientAccount } from "@/lib/api";

export interface ProjectFiltersState {
    search: string;
    type: string;
    status: string;
    employee: string;
    client: string;
}

interface ProjectFiltersProps {
    filters: ProjectFiltersState;
    onFiltersChange: (filters: ProjectFiltersState) => void;
    clients?: ClientAccount[];
    employees?: Array<{ id: number; name: string }>;
}

const projectTypes = [
    { value: "all", label: "Todos los tipos" },
    { value: "SEO", label: "SEO" },
    { value: "Web", label: "Web" },
    { value: "Ads", label: "Ads" },
    { value: "General", label: "General" },
];

const statusOptions = [
    { value: "all", label: "Todos los estados" },
    { value: "active", label: "En Desarrollo" },
    { value: "on_hold", label: "Pausa" },
    { value: "completed", label: "Terminado" },
    { value: "planning", label: "Planeación" },
];

export function ProjectFilters({
    filters,
    onFiltersChange,
    clients = [],
    employees = [],
}: ProjectFiltersProps) {
    const updateFilter = <K extends keyof ProjectFiltersState>(
        key: K,
        value: ProjectFiltersState[K]
    ) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="space-y-4 p-4 rounded-lg bg-card/30 border border-border/50">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Search className="w-4 h-4" />
                <span>Filtros</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar..."
                        value={filters.search}
                        onChange={(e) => updateFilter("search", e.target.value)}
                        className="pl-9 h-9 bg-background/50"
                    />
                </div>

                {/* Type Filter */}
                <Select value={filters.type} onValueChange={(v) => updateFilter("type", v)}>
                    <SelectTrigger className="w-[160px] h-9 bg-background/50">
                        <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                        {projectTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                    <SelectTrigger className="w-[170px] h-9 bg-background/50">
                        <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Employee Filter */}
                <Select value={filters.employee} onValueChange={(v) => updateFilter("employee", v)}>
                    <SelectTrigger className="w-[180px] h-9 bg-background/50">
                        <SelectValue placeholder="Todos los empleados" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los empleados</SelectItem>
                        {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Client Filter */}
                <Select value={filters.client} onValueChange={(v) => updateFilter("client", v)}>
                    <SelectTrigger className="w-[160px] h-9 bg-background/50">
                        <SelectValue placeholder="Todos los clientes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los clientes</SelectItem>
                        {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                                {client.companyName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
