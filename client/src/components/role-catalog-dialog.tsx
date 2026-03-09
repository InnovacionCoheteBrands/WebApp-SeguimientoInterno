import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Save, Briefcase, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchAgencyRoles, createAgencyRole, updateAgencyRole, deleteAgencyRole, fetchServiceCatalog } from "@/lib/api";
import { AgencyRole, InsertAgencyRole, ROLE_LEVELS } from "@shared/schema";
import type { ServiceCatalog } from "@/lib/api";

interface RoleCatalogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RoleCatalogDialog({ open, onOpenChange }: RoleCatalogDialogProps) {
    const { toast } = useToast();
    const [roles, setRoles] = useState<AgencyRole[]>([]);
    const [services, setServices] = useState<ServiceCatalog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [editingRole, setEditingRole] = useState<AgencyRole | null>(null);
    const [formData, setFormData] = useState<Partial<InsertAgencyRole>>({
        roleName: "",
        roleLevel: "Senior",
        department: "",
        defaultBillableRate: "",
        allowedActivities: "[]"
    });
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);

    useEffect(() => {
        if (open) {
            loadRoles();
            loadServices();
        }
    }, [open]);

    const loadRoles = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAgencyRoles();
            setRoles(data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load roles", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const loadServices = async () => {
        try {
            const data = await fetchServiceCatalog();
            setServices(data);
        } catch (error) {
            console.error("Failed to load services for role mapping", error);
        }
    };

    const resetForm = () => {
        setEditingRole(null);
        setFormData({ roleName: "", roleLevel: "Senior", department: "", defaultBillableRate: "", allowedActivities: "[]" });
        setSelectedServiceIds([]);
        setShowServiceDropdown(false);
    };

    const handleEdit = (role: AgencyRole) => {
        setEditingRole(role);
        // Parse allowedActivities: could be an array of service IDs (numbers) or service names (strings)
        let parsedIds: number[] = [];
        if (role.allowedActivities) {
            try {
                const parsed = JSON.parse(role.allowedActivities as string);
                if (Array.isArray(parsed)) {
                    // If items are numbers, use them directly. If strings, try to match to service names.
                    parsedIds = parsed.map((item: any) => {
                        if (typeof item === "number") return item;
                        // Try to find by name
                        const found = services.find(s => s.name === item);
                        return found ? found.id : null;
                    }).filter(Boolean) as number[];
                }
            } catch { parsedIds = []; }
        }
        setSelectedServiceIds(parsedIds);
        setFormData({
            roleName: role.roleName,
            roleLevel: role.roleLevel ?? "Senior",
            department: role.department ?? undefined,
            defaultBillableRate: role.defaultBillableRate ?? undefined,
            allowedActivities: role.allowedActivities ?? "[]"
        });
    };

    const toggleService = (serviceId: number) => {
        setSelectedServiceIds(prev => {
            const next = prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId];
            // Sync to formData as JSON array of service names for readability
            const serviceNames = next.map(id => services.find(s => s.id === id)?.name).filter(Boolean);
            setFormData(f => ({ ...f, allowedActivities: JSON.stringify(serviceNames) }));
            return next;
        });
    };

    const removeService = (serviceId: number) => {
        toggleService(serviceId); // same logic
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.roleName || !formData.department) {
            toast({ title: "Campos requeridos", description: "Nombre del Rol y Área son obligatorios", variant: "destructive" });
            return;
        }

        try {
            if (editingRole) {
                await updateAgencyRole(editingRole.id, formData);
                toast({ title: "Rol actualizado", description: `${formData.roleName} guardado correctamente` });
            } else {
                await createAgencyRole(formData as InsertAgencyRole);
                toast({ title: "Rol creado", description: `${formData.roleName} agregado al catálogo` });
            }
            resetForm();
            loadRoles();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar el rol", variant: "destructive" });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro? Esto podría afectar a miembros del equipo vinculados a este rol.")) return;
        try {
            await deleteAgencyRole(id);
            toast({ title: "Eliminado", description: "Rol eliminado del catálogo" });
            if (editingRole?.id === id) resetForm();
            loadRoles();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el rol", variant: "destructive" });
        }
    };

    // Helper: get level color
    const getLevelColor = (level: string | null) => {
        switch (level) {
            case "Senior": return "border-amber-500/50 text-amber-400 bg-amber-500/10";
            case "Mid": return "border-blue-500/50 text-blue-400 bg-blue-500/10";
            case "Junior": return "border-green-500/50 text-green-400 bg-green-500/10";
            case "Trainee": return "border-purple-500/50 text-purple-400 bg-purple-500/10";
            default: return "border-border text-muted-foreground";
        }
    };

    // Parse activities for display
    const parseActivities = (raw: string | null): string[] => {
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-5xl border-border bg-card text-foreground h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b border-border">
                    <DialogTitle>Catálogo de Roles</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Gestiona los roles, niveles y servicios asociados de la agencia.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* ───── Left Panel: Role List ───── */}
                    <div className="w-1/3 border-r border-border overflow-y-auto p-4 space-y-2 bg-muted/30">
                        <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase mb-3">Roles Definidos</h3>
                        {isLoading ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : roles.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-4 text-center">No hay roles definidos aún</p>
                        ) : (
                            roles.map(role => {
                                const activities = parseActivities(role.allowedActivities);
                                return (
                                    <div
                                        key={role.id}
                                        className={`p-3 border cursor-pointer hover:bg-muted transition-colors rounded-md ${editingRole?.id === role.id ? 'bg-muted border-primary/50 ring-1 ring-primary/30' : 'bg-background border-border'}`}
                                        onClick={() => handleEdit(role)}
                                    >
                                        <div className="flex justify-between items-start mb-1.5">
                                            <span className="font-semibold text-sm text-foreground">{role.roleName}</span>
                                            <Badge variant="outline" className={`text-[10px] h-5 rounded-full ${getLevelColor(role.roleLevel)}`}>
                                                {role.roleLevel || "—"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground font-mono mb-2">
                                            <span>{role.department || "Sin área"}</span>
                                            <span className="text-green-500">${role.defaultBillableRate || "0"}/hr</span>
                                        </div>
                                        {activities.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {activities.slice(0, 3).map(a => (
                                                    <Badge key={a} variant="secondary" className="text-[9px] h-4 bg-muted/80 text-muted-foreground font-normal">
                                                        {a}
                                                    </Badge>
                                                ))}
                                                {activities.length > 3 && (
                                                    <Badge variant="secondary" className="text-[9px] h-4 bg-muted/80 text-muted-foreground font-normal">
                                                        +{activities.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <Button variant="outline" className="w-full border-dashed border-border text-muted-foreground hover:text-foreground" onClick={resetForm}>
                            <Plus className="mr-2 size-3" /> Nuevo Rol
                        </Button>
                    </div>

                    {/* ───── Right Panel: Form ───── */}
                    <div className="w-2/3 p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                                {editingRole ? `Editando: ${editingRole.roleName}` : "Crear Nuevo Rol"}
                            </h3>
                            {editingRole && (
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(editingRole.id)} className="h-7 text-xs">
                                    <Trash2 className="mr-1 size-3" /> Eliminar
                                </Button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Row 1: Role Name + Level */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Nombre del Rol</Label>
                                    <Input
                                        value={formData.roleName}
                                        onChange={e => setFormData({ ...formData, roleName: e.target.value })}
                                        className="bg-background border-border"
                                        placeholder="Ej. Diseñador UX/UI"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Nivel</Label>
                                    <Select
                                        value={formData.roleLevel || "Senior"}
                                        onValueChange={v => setFormData({ ...formData, roleLevel: v })}
                                    >
                                        <SelectTrigger className="bg-background border-border">
                                            <SelectValue placeholder="Selecciona nivel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLE_LEVELS.map(level => (
                                                <SelectItem key={level} value={level}>
                                                    <span className="flex items-center gap-2">
                                                        <span className={`size-2 rounded-full ${level === "Senior" ? "bg-amber-400" : level === "Mid" ? "bg-blue-400" : level === "Junior" ? "bg-green-400" : "bg-purple-400"}`} />
                                                        {level}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Row 2: Area + Rate */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Área / Departamento</Label>
                                    <Input
                                        value={formData.department || ""}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        className="bg-background border-border"
                                        placeholder="Ej. Creativo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Tarifa Base ($/hr)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.defaultBillableRate || ""}
                                        onChange={e => setFormData({ ...formData, defaultBillableRate: e.target.value })}
                                        className="bg-background border-border text-green-500 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Allowed Services (Multi-Select from Service Catalog) */}
                            <div className="space-y-3 pt-1">
                                <Label className="text-muted-foreground flex items-center gap-2">
                                    <Briefcase className="size-3.5" />
                                    Servicios Permitidos
                                </Label>

                                {/* Selected Services Display */}
                                <div className="flex flex-wrap gap-2 p-3 bg-background/50 border border-border rounded-md min-h-[48px]">
                                    {selectedServiceIds.length === 0 && (
                                        <span className="text-xs text-muted-foreground italic">Ningún servicio asignado — selecciona del catálogo abajo</span>
                                    )}
                                    {selectedServiceIds.map(id => {
                                        const svc = services.find(s => s.id === id);
                                        if (!svc) return null;
                                        return (
                                            <Badge
                                                key={id}
                                                className="bg-primary/10 text-primary border-primary/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 cursor-pointer transition-colors pr-1.5"
                                                onClick={() => removeService(id)}
                                            >
                                                {svc.name}
                                                <span className="ml-1.5 text-xs opacity-60 hover:opacity-100">×</span>
                                            </Badge>
                                        );
                                    })}
                                </div>

                                {/* Dropdown Toggle */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-dashed border-border text-muted-foreground hover:text-foreground text-xs"
                                    onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                                >
                                    <ChevronDown className={`mr-2 size-3 transition-transform ${showServiceDropdown ? "rotate-180" : ""}`} />
                                    {showServiceDropdown ? "Ocultar catálogo" : "Seleccionar del Catálogo de Servicios"}
                                </Button>

                                {/* Service Catalog Grid */}
                                {showServiceDropdown && (
                                    <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto p-2 bg-muted/30 border border-border rounded-md">
                                        {services.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic col-span-2 text-center py-3">No hay servicios en el catálogo</p>
                                        ) : (
                                            services.map(svc => {
                                                const isSelected = selectedServiceIds.includes(svc.id);
                                                return (
                                                    <div
                                                        key={svc.id}
                                                        className={`p-2.5 border rounded-md cursor-pointer transition-all text-xs ${isSelected
                                                            ? "bg-primary/10 border-primary/40 text-foreground ring-1 ring-primary/20"
                                                            : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                                            }`}
                                                        onClick={() => toggleService(svc.id)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium truncate">{svc.name}</span>
                                                            {isSelected && <span className="text-primary text-sm">✓</span>}
                                                        </div>
                                                        {svc.category && (
                                                            <span className="text-[10px] text-muted-foreground font-mono">{svc.category}</span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex justify-end gap-2 border-t border-border">
                                <Button type="button" variant="ghost" onClick={resetForm}>Limpiar</Button>
                                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Save className="mr-2 size-4" /> {editingRole ? "Guardar Cambios" : "Crear Rol"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
