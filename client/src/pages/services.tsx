import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchServiceCatalog, createService, updateService, deleteService,
    fetchAgencyRoles, createAgencyRole, updateAgencyRole, deleteAgencyRole
} from "@/lib/api";
import type { ServiceCatalog, AgencyRole } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    Briefcase,
    Plus,
    Search,
    Pencil,
    Trash2,
    Clock,
    Users,
    DollarSign,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Shield,
    Check,
    ChevronsUpDown,
    GraduationCap,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
    "Desarrollo": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "Diseño": "bg-purple-500/15 text-purple-400 border-purple-500/30",
    "Marketing": "bg-pink-500/15 text-pink-400 border-pink-500/30",
    "Consultoría": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    "Audiovisual": "bg-orange-500/15 text-orange-400 border-orange-500/30",
    "SEO / SEM": "bg-green-500/15 text-green-400 border-green-500/30",
    "Branding": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "General": "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const SERVICE_CATEGORIES = Object.keys(CATEGORY_COLORS);

const ROLE_LEVELS = ["Senior", "Mid", "Junior", "Trainee"];

const LEVEL_COLORS: Record<string, string> = {
    "Senior": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "Mid": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "Junior": "bg-green-500/15 text-green-400 border-green-500/30",
    "Trainee": "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const emptyForm = () => ({
    name: "",
    description: "",
    defaultPrice: "",
    baseCost: "",
    category: "General",
    estimatedDeliveryDays: 0,
    requiredRoles: "",
    marketingAssetUrl: "",
    isActive: true,
});

const emptyRoleForm = () => ({
    roleName: "",
    roleLevel: "Senior",
    department: "General",
    defaultBillableRate: "0",
    allowedActivities: "[]",
});

// ── Reusable Multi-Select ─────────────────────────────────────────────────

function MultiSelect<T extends { id: number }>({
    items,
    selectedIds,
    onChange,
    getLabel,
    getSubLabel,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    emptyMessage = "Sin resultados.",
}: {
    items: T[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    getLabel: (item: T) => string;
    getSubLabel?: (item: T) => string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between min-h-[40px] h-auto py-2"
                >
                    <div className="flex flex-wrap gap-1">
                        {selectedIds.length > 0 ? (
                            selectedIds.map(id => {
                                const item = items.find(i => String(i.id) === id || getLabel(i) === id);
                                return (
                                    <Badge key={id} variant="secondary" className="mr-1">
                                        {item ? getLabel(item) : id}
                                    </Badge>
                                );
                            })
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => {
                                const label = getLabel(item);
                                const isSelected = selectedIds.includes(label) || selectedIds.includes(String(item.id));
                                return (
                                    <CommandItem
                                        key={item.id}
                                        onSelect={() => {
                                            const newIds = isSelected
                                                ? selectedIds.filter(r => r !== label && r !== String(item.id))
                                                : [...selectedIds, label];
                                            onChange(newIds);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                        {label}
                                        {getSubLabel && <span className="ml-auto text-xs text-muted-foreground">{getSubLabel(item)}</span>}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ── Service Card ──────────────────────────────────────────────────────────

function ServiceCard({
    service,
    onEdit,
    onDelete,
}: {
    service: ServiceCatalog;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const badgeClass = CATEGORY_COLORS[service.category || "General"] ?? CATEGORY_COLORS["General"];
    const margin = service.defaultPrice && service.baseCost
        ? ((parseFloat(service.defaultPrice) - parseFloat(service.baseCost)) / parseFloat(service.defaultPrice) * 100).toFixed(0)
        : null;

    return (
        <div className={`group relative rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-primary/30 hover:shadow-lg transition-all duration-200 ${!service.isActive ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm leading-tight truncate">{service.name}</p>
                        {service.description && (
                            <p className="text-xs text-muted-foreground truncate line-clamp-1">{service.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                </div>
            </div>

            <span className={`inline-flex self-start items-center text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
                {service.category || "General"}
            </span>

            <div className="flex items-baseline justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-lg font-semibold">{service.defaultPrice || "0.00"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {service.baseCost && <span>Costo: ${service.baseCost}</span>}
                    {margin && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                            {margin}% margen
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{(service as any).estimatedDeliveryDays || 0} días de entrega</span>
                </div>
                {(service as any).requiredRoles && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{(service as any).requiredRoles}</span>
                    </div>
                )}
                {(service as any).marketingAssetUrl && (
                    <a href={(service as any).marketingAssetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Asset de Marketing</span>
                    </a>
                )}
            </div>

            <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border/40">
                {service.isActive
                    ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-xs text-emerald-500">Activo</span></>
                    : <><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-xs text-red-400">Inactivo</span></>
                }
            </div>
        </div>
    );
}

// ── Page Component ────────────────────────────────────────────────────────

export default function ServicesPage() {
    const { toast } = useToast();
    const qc = useQueryClient();

    // Service state
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<ServiceCatalog | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [deleteTarget, setDeleteTarget] = useState<ServiceCatalog | null>(null);

    // Role state
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [editRoleTarget, setEditRoleTarget] = useState<AgencyRole | null>(null);
    const [roleForm, setRoleForm] = useState(emptyRoleForm());
    const [deleteRoleTarget, setDeleteRoleTarget] = useState<AgencyRole | null>(null);

    // Queries
    const { data: services = [], isLoading } = useQuery({
        queryKey: ["service-catalog"],
        queryFn: fetchServiceCatalog,
    });

    const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
        queryKey: ["agency-roles"],
        queryFn: fetchAgencyRoles,
    });

    // Filtering
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return services.filter(s => {
            const matchSearch = s.name.toLowerCase().includes(q) || (s.category?.toLowerCase().includes(q) ?? false);
            const matchCategory = filterCategory === "all" || s.category === filterCategory;
            return matchSearch && matchCategory;
        });
    }, [services, search, filterCategory]);

    // Mutations - Services
    const createMutation = useMutation({ mutationFn: createService, onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-catalog"] }); setDialogOpen(false); toast({ title: "Servicio creado ✓" }); } });
    const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: number; data: any }) => updateService(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-catalog"] }); setDialogOpen(false); toast({ title: "Servicio actualizado ✓" }); } });
    const deleteMutation = useMutation({ mutationFn: deleteService, onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-catalog"] }); setDeleteTarget(null); toast({ title: "Servicio eliminado" }); } });

    // Mutations - Roles
    const createRoleMutation = useMutation({ mutationFn: createAgencyRole, onSuccess: () => { qc.invalidateQueries({ queryKey: ["agency-roles"] }); setRoleDialogOpen(false); toast({ title: "Rol creado ✓" }); } });
    const updateRoleMutation = useMutation({ mutationFn: ({ id, data }: { id: number; data: any }) => updateAgencyRole(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["agency-roles"] }); setRoleDialogOpen(false); toast({ title: "Rol actualizado ✓" }); } });
    const deleteRoleMutation = useMutation({ mutationFn: deleteAgencyRole, onSuccess: () => { qc.invalidateQueries({ queryKey: ["agency-roles"] }); setDeleteRoleTarget(null); toast({ title: "Rol eliminado" }); } });

    // Handlers
    const openCreate = () => { setEditTarget(null); setForm(emptyForm()); setDialogOpen(true); };
    const openEdit = (s: ServiceCatalog) => {
        setEditTarget(s);
        setForm({
            name: s.name, description: s.description || "", defaultPrice: s.defaultPrice?.toString() || "", baseCost: s.baseCost?.toString() || "",
            category: s.category || "General", estimatedDeliveryDays: (s as any).estimatedDeliveryDays || 0,
            requiredRoles: (s as any).requiredRoles || "", marketingAssetUrl: (s as any).marketingAssetUrl || "", isActive: s.isActive,
        });
        setDialogOpen(true);
    };

    const openCreateRole = () => { setEditRoleTarget(null); setRoleForm(emptyRoleForm()); setRoleDialogOpen(true); };
    const openEditRole = (r: AgencyRole) => {
        setEditRoleTarget(r);
        setRoleForm({
            roleName: r.roleName,
            roleLevel: (r as any).roleLevel || "Senior",
            department: r.department || "General",
            defaultBillableRate: r.defaultBillableRate?.toString() || "0",
            allowedActivities: r.allowedActivities || "[]",
        });
        setRoleDialogOpen(true);
    };

    const handleServiceSubmit = () => {
        if (!form.name.trim()) return toast({ title: "Nombre requerido", variant: "destructive" });
        if (editTarget) updateMutation.mutate({ id: editTarget.id, data: form });
        else createMutation.mutate(form as any);
    };

    const handleRoleSubmit = () => {
        if (!roleForm.roleName.trim()) return toast({ title: "Nombre de rol requerido", variant: "destructive" });
        if (editRoleTarget) updateRoleMutation.mutate({ id: editRoleTarget.id, data: roleForm });
        else createRoleMutation.mutate(roleForm as any);
    };

    // Helper: parse allowedActivities JSON
    const parseActivities = (raw: string): string[] => {
        try { return JSON.parse(raw); } catch { return []; }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background">
            <div className="px-6 py-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Configuración de Servicios</h1>
                        <p className="text-sm text-muted-foreground">Gestiona servicios y el catálogo de roles de la agencia.</p>
                    </div>
                </div>

                <Tabs defaultValue="services" className="mt-6">
                    <TabsList className="bg-muted/50 p-1 border border-border/50">
                        <TabsTrigger value="services" className="gap-2 px-4"><Briefcase className="w-4 h-4" /> Servicios</TabsTrigger>
                        <TabsTrigger value="roles" className="gap-2 px-4"><Shield className="w-4 h-4" /> Catálogo de Roles</TabsTrigger>
                    </TabsList>

                    {/* ── SERVICES TAB ──────────────────────────────────────── */}
                    <TabsContent value="services" className="mt-0 outline-none">
                        <div className="flex items-center justify-between mt-6 mb-4">
                            <h2 className="text-lg font-medium">Lista de Servicios</h2>
                            <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Nuevo Servicio</Button>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-6">
                            <div className="relative flex-1 min-w-[220px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Buscar servicios…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                            </div>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todas" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las categorías</SelectItem>
                                    {SERVICE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-6">
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-52 rounded-2xl bg-card border border-border/50" />)}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-2xl">
                                    <p className="text-muted-foreground">No se encontraron servicios.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filtered.map(s => <ServiceCard key={s.id} service={s} onEdit={() => openEdit(s)} onDelete={() => setDeleteTarget(s)} />)}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ── ROLES TAB ──────────────────────────────────────── */}
                    <TabsContent value="roles" className="mt-0 outline-none">
                        <div className="flex items-center justify-between mt-6 mb-6">
                            <div>
                                <h2 className="text-lg font-medium">Catálogo de Roles</h2>
                                <p className="text-sm text-muted-foreground">Perfiles maestros para asignación en servicios.</p>
                            </div>
                            <Button onClick={openCreateRole} variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Nuevo Rol</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-6">
                            {isLoadingRoles ? (
                                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />)}</div>
                            ) : roles.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-2xl">
                                    <p className="text-muted-foreground">No hay roles definidos.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {roles.map(role => {
                                        const level = (role as any).roleLevel || "Senior";
                                        const levelClass = LEVEL_COLORS[level] ?? LEVEL_COLORS["Senior"];
                                        const activities = parseActivities(role.allowedActivities || "[]");
                                        return (
                                            <div key={role.id} className="group rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-primary/30 transition-all">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                                                        <div>
                                                            <p className="font-semibold text-sm truncate">{role.roleName}</p>
                                                            <p className="text-xs text-muted-foreground">{role.department}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                        <button onClick={() => openEditRole(role)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                                                        <button onClick={() => setDeleteRoleTarget(role)} className="p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                                                    </div>
                                                </div>

                                                {/* Level badge */}
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${levelClass}`}>
                                                        <GraduationCap className="w-3 h-3 mr-1" /> {level}
                                                    </span>
                                                </div>

                                                {/* Activities/Services */}
                                                {activities.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {activities.map((act, i) => (
                                                            <Badge key={i} variant="outline" className="text-[10px]">{act}</Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="pt-2 border-t border-border/40 text-xs flex justify-between">
                                                    <span className="text-muted-foreground">Costo/hr</span>
                                                    <span className="font-medium">${role.defaultBillableRate}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* ── SERVICE DIALOG ──────────────────────────────────────── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader><DialogTitle>{editTarget ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle></DialogHeader>
                    <div className="grid gap-5 py-4 px-6 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5"><Label>Nombre del servicio *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                            <div className="space-y-1.5">
                                <Label>Categoría</Label>
                                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{SERVICE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Precio de venta</Label><Input type="number" step="0.01" value={form.defaultPrice} onChange={e => setForm(f => ({ ...f, defaultPrice: e.target.value }))} /></div>
                            <div className="space-y-1.5"><Label>Costo interno</Label><Input type="number" step="0.01" value={form.baseCost} onChange={e => setForm(f => ({ ...f, baseCost: e.target.value }))} /></div>
                            <div className="space-y-1.5"><Label>Tiempo estimado (días)</Label><Input type="number" value={form.estimatedDeliveryDays} onChange={e => setForm(f => ({ ...f, estimatedDeliveryDays: parseInt(e.target.value) || 0 }))} /></div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Roles responsables</Label>
                                <MultiSelect
                                    items={roles}
                                    selectedIds={form.requiredRoles ? form.requiredRoles.split(",").filter(Boolean) : []}
                                    onChange={s => setForm(f => ({ ...f, requiredRoles: s.join(",") }))}
                                    getLabel={r => r.roleName}
                                    getSubLabel={r => `${(r as any).roleLevel || "Senior"} · ${r.department}`}
                                    placeholder="Seleccionar roles responsables..."
                                    searchPlaceholder="Buscar rol..."
                                    emptyMessage="No se encontraron roles."
                                />
                                <p className="text-xs text-muted-foreground">Perfiles que participan en este servicio.</p>
                            </div>
                            <div className="col-span-2 space-y-1.5"><Label>URL Asset Marketing</Label><Input value={form.marketingAssetUrl} onChange={e => setForm(f => ({ ...f, marketingAssetUrl: e.target.value }))} /></div>
                            <div className="col-span-2 space-y-1.5"><Label>Descripción</Label><Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                            <div className="col-span-2 flex items-center gap-3"><Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} /><Label>Servicio Activo</Label></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleServiceSubmit} disabled={createMutation.isPending || updateMutation.isPending}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── ROLE DIALOG ──────────────────────────────────────── */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editRoleTarget ? "Editar Rol" : "Nuevo Rol"}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4 px-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Nombre del Rol *</Label>
                                <Input value={roleForm.roleName} onChange={e => setRoleForm(f => ({ ...f, roleName: e.target.value }))} placeholder="Ej. Diseñador UX" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nivel</Label>
                                <Select value={roleForm.roleLevel} onValueChange={v => setRoleForm(f => ({ ...f, roleLevel: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ROLE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Departamento</Label>
                                <Input value={roleForm.department} onChange={e => setRoleForm(f => ({ ...f, department: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Costo/hr (Billable Rate)</Label>
                                <Input type="number" step="0.01" value={roleForm.defaultBillableRate} onChange={e => setRoleForm(f => ({ ...f, defaultBillableRate: e.target.value }))} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Servicios / Actividades que puede ejecutar</Label>
                            <MultiSelect
                                items={services}
                                selectedIds={parseActivities(roleForm.allowedActivities)}
                                onChange={sel => setRoleForm(f => ({ ...f, allowedActivities: JSON.stringify(sel) }))}
                                getLabel={s => s.name}
                                getSubLabel={s => s.category || "General"}
                                placeholder="Seleccionar servicios..."
                                searchPlaceholder="Buscar servicio..."
                                emptyMessage="No hay servicios en el catálogo."
                            />
                            <p className="text-xs text-muted-foreground">Los servicios que este perfil puede ejecutar.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleRoleSubmit} disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── CONFIRM DELETE DIALOGS ──────────────────────────── */}
            <Dialog open={!!deleteRoleTarget} onOpenChange={o => !o && setDeleteRoleTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>¿Eliminar rol?</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground text-center">Confirmar eliminación de <strong>{deleteRoleTarget?.roleName}</strong>.</p>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setDeleteRoleTarget(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteRoleTarget && deleteRoleMutation.mutate(deleteRoleTarget.id)}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>¿Eliminar servicio?</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground text-center">Confirmar eliminación de <strong>{deleteTarget?.name}</strong>.</p>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
