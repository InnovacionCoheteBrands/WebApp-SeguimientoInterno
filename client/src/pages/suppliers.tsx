import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    Building2,
    Plus,
    Search,
    Mail,
    Phone,
    Globe,
    Pencil,
    Trash2,
    CheckCircle2,
    XCircle,
    Users,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Supplier {
    id: number;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    specialty: string;
    website: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const SUPPLIER_SPECIALTIES = [
    "Diseño Gráfico",
    "Desarrollo Web",
    "Fotografía / Video",
    "Redacción / Copywriting",
    "SEO / SEM",
    "Pauta Digital",
    "Impresión",
    "Sonido / Música",
    "Traducción",
    "Consultoría",
    "Software / SaaS",
    "Otro",
] as const;

const SPECIALTY_COLORS: Record<string, string> = {
    "Diseño Gráfico": "bg-purple-500/15 text-purple-400 border-purple-500/30",
    "Desarrollo Web": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "Fotografía / Video": "bg-pink-500/15 text-pink-400 border-pink-500/30",
    "Redacción / Copywriting": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "SEO / SEM": "bg-green-500/15 text-green-400 border-green-500/30",
    "Pauta Digital": "bg-orange-500/15 text-orange-400 border-orange-500/30",
    "Impresión": "bg-red-500/15 text-red-400 border-red-500/30",
    "Sonido / Música": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    "Traducción": "bg-teal-500/15 text-teal-400 border-teal-500/30",
    "Consultoría": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    "Software / SaaS": "bg-violet-500/15 text-violet-400 border-violet-500/30",
    "Otro": "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

// ── Empty form ─────────────────────────────────────────────────────────────
const emptyForm = () => ({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    specialty: "" as string,
    website: "",
    notes: "",
    isActive: true,
});

// ── Main Component ──────────────────────────────────────────────────────────
export default function SuppliersPage() {
    const { toast } = useToast();
    const qc = useQueryClient();

    const [search, setSearch] = useState("");
    const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Supplier | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

    // ── Queries ──────────────────────────────────────────────────────────────
    const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
        queryKey: ["/api/suppliers"],
        queryFn: () => apiRequest("GET", "/api/suppliers").then(r => r.json()),
    });

    // ── Derived ──────────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return suppliers.filter(s => {
            const matchSearch =
                s.name.toLowerCase().includes(q) ||
                (s.contactName?.toLowerCase().includes(q) ?? false) ||
                (s.specialty.toLowerCase().includes(q));
            const matchSpecialty = filterSpecialty === "all" || s.specialty === filterSpecialty;
            return matchSearch && matchSpecialty;
        });
    }, [suppliers, search, filterSpecialty]);

    const activeCount = suppliers.filter(s => s.isActive).length;

    // ── Mutations ────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data: typeof form) =>
            apiRequest("POST", "/api/suppliers", data).then(r => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["/api/suppliers"] });
            setDialogOpen(false);
            toast({ title: "Proveedor creado ✓" });
        },
        onError: () => toast({ title: "Error al crear proveedor", variant: "destructive" }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<typeof form> }) =>
            apiRequest("PATCH", `/api/suppliers/${id}`, data).then(r => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["/api/suppliers"] });
            setDialogOpen(false);
            toast({ title: "Proveedor actualizado ✓" });
        },
        onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiRequest("DELETE", `/api/suppliers/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["/api/suppliers"] });
            setDeleteTarget(null);
            toast({ title: "Proveedor eliminado" });
        },
        onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
    });

    // ── Handlers ─────────────────────────────────────────────────────────────
    const openCreate = () => { setEditTarget(null); setForm(emptyForm()); setDialogOpen(true); };
    const openEdit = (s: Supplier) => {
        setEditTarget(s);
        setForm({
            name: s.name,
            contactName: s.contactName ?? "",
            email: s.email ?? "",
            phone: s.phone ?? "",
            specialty: s.specialty,
            website: s.website ?? "",
            notes: s.notes ?? "",
            isActive: s.isActive,
        });
        setDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!form.name.trim() || !form.specialty) {
            toast({ title: "Nombre y especialidad son requeridos", variant: "destructive" });
            return;
        }
        if (editTarget) {
            updateMutation.mutate({ id: editTarget.id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background">
            {/* Page Header */}
            <div className="px-6 py-5 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Directorio de Proveedores</h1>
                            <p className="text-sm text-muted-foreground">
                                {suppliers.length} proveedores — {activeCount} activos
                            </p>
                        </div>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="w-4 h-4" /> Nuevo Proveedor
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mt-4">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, contacto o especialidad…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Todas las especialidades" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las especialidades</SelectItem>
                            {SUPPLIER_SPECIALTIES.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-44 rounded-2xl bg-card animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">No se encontraron proveedores</p>
                            <p className="text-sm text-muted-foreground/60">
                                {search || filterSpecialty !== "all" ? "Intenta ajustando los filtros" : "Agrega tu primer proveedor"}
                            </p>
                        </div>
                        {!search && filterSpecialty === "all" && (
                            <Button onClick={openCreate} variant="outline" className="gap-2">
                                <Plus className="w-4 h-4" /> Agregar Proveedor
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(supplier => (
                            <SupplierCard
                                key={supplier.id}
                                supplier={supplier}
                                onEdit={() => openEdit(supplier)}
                                onDelete={() => setDeleteTarget(supplier)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1.5">
                                <Label>Nombre de la empresa *</Label>
                                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Studio" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Contacto principal</Label>
                                <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Juan Pérez" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Especialidad *</Label>
                                <Select value={form.specialty} onValueChange={v => setForm(f => ({ ...f, specialty: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                                    <SelectContent>
                                        {SUPPLIER_SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contacto@acme.com" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Teléfono</Label>
                                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+52 55 1234 5678" />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Sitio web</Label>
                                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://acme.com" />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Notas</Label>
                                <Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Condiciones, plazos, calificación…" />
                            </div>
                            <div className="col-span-2 flex items-center gap-3">
                                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                                <Label className="cursor-pointer">{form.isActive ? "Activo" : "Inactivo"}</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                            {editTarget ? "Guardar cambios" : "Crear proveedor"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar proveedor?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Se desvinculará <strong>{deleteTarget?.name}</strong> de todos los servicios del catálogo. Esta acción no se puede deshacer.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                            disabled={deleteMutation.isPending}
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Supplier Card ─────────────────────────────────────────────────────────
function SupplierCard({
    supplier,
    onEdit,
    onDelete,
}: {
    supplier: Supplier;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const badgeClass = SPECIALTY_COLORS[supplier.specialty] ?? SPECIALTY_COLORS["Otro"];

    return (
        <div className={`group relative rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-primary/30 hover:shadow-lg transition-all duration-200 ${!supplier.isActive ? "opacity-60" : ""}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm leading-tight truncate">{supplier.name}</p>
                        {supplier.contactName && (
                            <p className="text-xs text-muted-foreground truncate">{supplier.contactName}</p>
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

            {/* Specialty Badge */}
            <span className={`inline-flex self-start items-center text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
                {supplier.specialty}
            </span>

            {/* Contact Info */}
            <div className="flex flex-col gap-1">
                {supplier.email && (
                    <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                    </a>
                )}
                {supplier.phone && (
                    <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{supplier.phone}</span>
                    </a>
                )}
                {supplier.website && (
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{supplier.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5 mt-auto pt-1 border-t border-border/40">
                {supplier.isActive
                    ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-xs text-emerald-500">Activo</span></>
                    : <><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-xs text-red-400">Inactivo</span></>
                }
            </div>
        </div>
    );
}
