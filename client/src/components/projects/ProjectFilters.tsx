/**
 * ProjectFilters - Multi-criteria filter bar
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
    service: string;
}

interface ProjectFiltersProps {
    filters: ProjectFiltersState;
    onFiltersChange: (filters: ProjectFiltersState) => void;
    clients?: ClientAccount[];
    employees?: Array<{ id: number; name: string }>;
    services?: Array<{ id: number; name: string }>;
    statuses?: string[];
}

const projectTypes = [
    { value: "all", label: "Todos los tipos" },
    { value: "SEO", label: "SEO" },
    { value: "Web", label: "Web" },
    { value: "General", label: "General" },
];

export function ProjectFilters({
    filters,
    onFiltersChange,
    clients = [],
    employees = [],
    services = [],
    statuses = [],
}: ProjectFiltersProps) {
    const updateFilter = <K extends keyof ProjectFiltersState>(
        key: K,
        value: ProjectFiltersState[K]
    ) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="space-y-4 rounded-lg border border-border/50 bg-card/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Search className="h-4 w-4" />
                <span>Filtros</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar proyecto, cliente o descripcion..."
                        value={filters.search}
                        onChange={(event) => updateFilter("search", event.target.value)}
                        className="h-9 bg-background/50 pl-9"
                    />
                </div>

                <Select value={filters.type} onValueChange={(value) => updateFilter("type", value)}>
                    <SelectTrigger className="h-9 w-[160px] bg-background/50">
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

                <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                    <SelectTrigger className="h-9 w-[170px] bg-background/50">
                        <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.employee} onValueChange={(value) => updateFilter("employee", value)}>
                    <SelectTrigger className="h-9 w-[180px] bg-background/50">
                        <SelectValue placeholder="Todos los empleados" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los empleados</SelectItem>
                        {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.service} onValueChange={(value) => updateFilter("service", value)}>
                    <SelectTrigger className="h-9 w-[190px] bg-background/50">
                        <SelectValue placeholder="Todos los servicios" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los servicios</SelectItem>
                        {services.map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                                {service.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.client} onValueChange={(value) => updateFilter("client", value)}>
                    <SelectTrigger className="h-9 w-[170px] bg-background/50">
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
