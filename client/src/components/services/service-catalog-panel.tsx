import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  Code2,
  Megaphone,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import {
  createService,
  deleteService,
  fetchAgencyRoles,
  fetchServiceCatalog,
  updateService,
} from "@/lib/api";
import type {
  AgencyRole,
  InsertServiceCatalog,
  ServiceCatalog,
  UpdateServiceCatalog,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const CATEGORY_COLORS: Record<string, string> = {
  Desarrollo: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Diseño: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Marketing: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  Consultoría: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  Audiovisual: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "SEO / SEM": "bg-green-500/15 text-green-400 border-green-500/30",
  Branding: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  General: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const SERVICE_CATEGORIES = Object.keys(CATEGORY_COLORS);

const SERVICE_ICONS = [
  { name: "Briefcase", label: "Servicios", icon: Briefcase },
  { name: "Wrench", label: "Herramientas", icon: Wrench },
  { name: "Rocket", label: "Lanzamiento", icon: Rocket },
  { name: "Search", label: "SEO y búsqueda", icon: Search },
  { name: "Code2", label: "Desarrollo", icon: Code2 },
  { name: "Palette", label: "Diseño", icon: Palette },
  { name: "Megaphone", label: "Marketing", icon: Megaphone },
  { name: "BarChart3", label: "Analítica", icon: BarChart3 },
  { name: "Users", label: "Personas", icon: Users },
  { name: "Sparkles", label: "Creatividad", icon: Sparkles },
] satisfies Array<{ name: string; label: string; icon: LucideIcon }>;

const ICON_COMPONENTS = Object.fromEntries(
  SERVICE_ICONS.map((item) => [item.name, item.icon]),
) as Record<string, LucideIcon>;

type ServiceForm = {
  name: string;
  description: string;
  icon: string;
  category: string;
  defaultPrice: string;
  baseCost: string;
  estimatedDeliveryDays: number;
  requiredRoles: string;
  marketingAssetUrl: string;
  isActive: boolean;
};

type ServiceFormErrors = Partial<Record<"name" | "description" | "icon", string>>;

function emptyServiceForm(): ServiceForm {
  return {
    name: "",
    description: "",
    icon: "Briefcase",
    category: "General",
    defaultPrice: "",
    baseCost: "",
    estimatedDeliveryDays: 0,
    requiredRoles: "",
    marketingAssetUrl: "",
    isActive: true,
  };
}

function formFromService(service: ServiceCatalog): ServiceForm {
  return {
    name: service.name,
    description: service.description ?? "",
    icon: service.icon ?? "Briefcase",
    category: service.category ?? "General",
    defaultPrice: service.defaultPrice ?? "",
    baseCost: service.baseCost ?? "",
    estimatedDeliveryDays: service.estimatedDeliveryDays ?? 0,
    requiredRoles: service.requiredRoles ?? "",
    marketingAssetUrl: service.marketingAssetUrl ?? "",
    isActive: service.isActive,
  };
}

function toServicePayload(form: ServiceForm): InsertServiceCatalog {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    icon: form.icon,
    category: form.category,
    defaultPrice: form.defaultPrice || undefined,
    baseCost: form.baseCost || undefined,
    estimatedDeliveryDays: form.estimatedDeliveryDays,
    requiredRoles: form.requiredRoles || null,
    marketingAssetUrl: form.marketingAssetUrl.trim() || null,
    isActive: form.isActive,
    supplierId: null,
  };
}

function validateServiceForm(form: ServiceForm): ServiceFormErrors {
  const errors: ServiceFormErrors = {};
  const name = form.name.trim();

  if (!name) errors.name = "El título es obligatorio.";
  else if (name.length > 200) errors.name = "El título no puede superar 200 caracteres.";
  if (form.description.length > 500) errors.description = "La descripción no puede superar 500 caracteres.";
  if (!form.icon) errors.icon = "Selecciona un ícono.";

  return errors;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatCreatedAt(value: Date | string) {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function ServiceIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && ICON_COMPONENTS[name]) || Briefcase;
  return <Icon className={className} aria-hidden="true" />;
}

function IconPicker({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = SERVICE_ICONS.find((item) => item.name === value) ?? SERVICE_ICONS[0];
  const SelectedIcon = selected.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className="w-full justify-between rounded-xl normal-case tracking-normal"
        >
          <span className="flex items-center gap-2">
            <SelectedIcon className="size-4" />
            {selected.label}
          </span>
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar ícono..." />
          <CommandList>
            <CommandEmpty>No se encontraron íconos.</CommandEmpty>
            <CommandGroup>
              {SERVICE_ICONS.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.name}
                    value={`${item.label} ${item.name}`}
                    onSelect={() => {
                      onChange(item.name);
                      setOpen(false);
                    }}
                  >
                    <Icon className="mr-2 size-4" />
                    {item.label}
                    {value === item.name && <span className="ml-auto text-primary">Seleccionado</span>}
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

function RolePicker({
  roles,
  value,
  onChange,
}: {
  roles: AgencyRole[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? value.split(",").filter(Boolean) : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="min-h-10 w-full justify-between rounded-xl normal-case tracking-normal"
        >
          <span className="truncate">
            {selected.length ? `${selected.length} rol${selected.length === 1 ? "" : "es"} seleccionado${selected.length === 1 ? "" : "s"}` : "Seleccionar roles"}
          </span>
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar rol..." />
          <CommandList>
            <CommandEmpty>No se encontraron roles.</CommandEmpty>
            <CommandGroup>
              {roles.map((role) => {
                const isSelected = selected.includes(role.roleName);
                return (
                  <CommandItem
                    key={role.id}
                    value={role.roleName}
                    onSelect={() => {
                      const next = isSelected
                        ? selected.filter((name) => name !== role.roleName)
                        : [...selected, role.roleName];
                      onChange(next.join(","));
                    }}
                  >
                    <span className={cn("mr-2 size-2 rounded-full", isSelected ? "bg-primary" : "bg-muted")} />
                    {role.roleName}
                    <span className="ml-auto text-xs text-muted-foreground">{role.department}</span>
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

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: ServiceCatalog;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group flex min-h-48 flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-primary/35 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ServiceIcon name={service.icon} className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold leading-6">{service.name}</h3>
            <Badge
              variant="outline"
              className={cn("mt-1 text-[10px]", CATEGORY_COLORS[service.category ?? "General"])}
            >
              {service.category ?? "General"}
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={onEdit} aria-label={`Editar ${service.name}`}>
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={`Eliminar ${service.name}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {service.description || "Sin descripción"}
      </p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-4 text-xs text-muted-foreground">
        <span>Creado: {formatCreatedAt(service.createdAt)}</span>
        {service.defaultPrice && <span className="font-medium text-foreground">${service.defaultPrice}</span>}
      </div>
    </article>
  );
}

export function ServiceCatalogPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ServiceCatalog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceCatalog | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyServiceForm);
  const [formErrors, setFormErrors] = useState<ServiceFormErrors>({});

  const servicesQuery = useQuery({
    queryKey: ["service-catalog"],
    queryFn: fetchServiceCatalog,
  });
  const rolesQuery = useQuery({
    queryKey: ["agency-roles"],
    queryFn: fetchAgencyRoles,
  });

  const services = servicesQuery.data ?? [];
  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es");
    return services.filter((service) => {
      const matchesSearch =
        !normalizedSearch ||
        service.name.toLocaleLowerCase("es").includes(normalizedSearch) ||
        service.description?.toLocaleLowerCase("es").includes(normalizedSearch);
      const matchesCategory = category === "all" || service.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, search, services]);

  const closeEditor = () => {
    setDialogOpen(false);
    setEditTarget(null);
    setForm(emptyServiceForm());
    setFormErrors({});
    setAdvancedOpen(false);
  };

  const refreshCatalog = async () => {
    await queryClient.invalidateQueries({ queryKey: ["service-catalog"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: InsertServiceCatalog) => createService(payload),
    onSuccess: async () => {
      await refreshCatalog();
      closeEditor();
      toast({ title: "Servicio creado", description: "El catálogo se actualizó correctamente." });
    },
    onError: (error) => {
      toast({
        title: "No se pudo crear el servicio",
        description: getErrorMessage(error, "Intenta nuevamente."),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateServiceCatalog }) =>
      updateService(id, payload),
    onSuccess: async () => {
      await refreshCatalog();
      closeEditor();
      toast({ title: "Servicio actualizado", description: "Los cambios quedaron guardados." });
    },
    onError: (error) => {
      toast({
        title: "No se pudo actualizar el servicio",
        description: getErrorMessage(error, "Intenta nuevamente."),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: async () => {
      await refreshCatalog();
      setDeleteTarget(null);
      toast({
        title: "Servicio eliminado",
        description: "Se ocultó del catálogo sin afectar el historial.",
      });
    },
    onError: (error) => {
      toast({
        title: "No se pudo eliminar el servicio",
        description: getErrorMessage(error, "Intenta nuevamente."),
        variant: "destructive",
      });
    },
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyServiceForm());
    setFormErrors({});
    setAdvancedOpen(false);
    setDialogOpen(true);
  };

  const openEdit = (service: ServiceCatalog) => {
    setEditTarget(service);
    setForm(formFromService(service));
    setFormErrors({});
    setAdvancedOpen(false);
    setDialogOpen(true);
  };

  const submitService = () => {
    const errors = validateServiceForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    const payload = toServicePayload(form);
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const hasFilters = Boolean(search.trim()) || category !== "all";

  return (
    <>
      <div className="mt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-medium">Servicios</h2>
            <p className="text-sm text-muted-foreground">Gestiona los servicios disponibles para tus proyectos.</p>
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" />
            Agregar Servicio
          </Button>
        </div>

        {!servicesQuery.isLoading && !servicesQuery.isError && services.length > 0 && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar servicios..."
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {SERVICE_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="mt-6 pb-6">
          {servicesQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Cargando servicios">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-2xl border border-border/50 bg-card" />
              ))}
            </div>
          ) : servicesQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudieron cargar los servicios</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{getErrorMessage(servicesQuery.error, "Verifica la conexión e intenta nuevamente.")}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => servicesQuery.refetch()}>
                  <RefreshCw className="size-4" />
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : services.length === 0 ? (
            <Empty className="min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Briefcase /></EmptyMedia>
                <EmptyTitle>Aún no hay servicios</EmptyTitle>
                <EmptyDescription>Crea el primer servicio para usarlo en tus proyectos.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" onClick={openCreate}><Plus />Agregar Servicio</Button>
              </EmptyContent>
            </Empty>
          ) : filteredServices.length === 0 ? (
            <Empty className="min-h-64 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Search /></EmptyMedia>
                <EmptyTitle>Sin resultados</EmptyTitle>
                <EmptyDescription>No hay servicios que coincidan con los filtros actuales.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                  }}
                  disabled={!hasFilters}
                >
                  Limpiar filtros
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={() => openEdit(service)}
                  onDelete={() => setDeleteTarget(service)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && !isSaving && closeEditor()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar Servicio" : "Agregar Nuevo Servicio"}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editTarget ? "Actualiza la información del servicio." : "Completa la información del servicio que deseas agregar."}
            </p>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <Field data-invalid={Boolean(formErrors.name)}>
              <FieldLabel htmlFor="service-name">Título *</FieldLabel>
              <Input
                id="service-name"
                value={form.name}
                maxLength={200}
                autoFocus
                aria-invalid={Boolean(formErrors.name)}
                placeholder="Nombre del servicio"
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  setFormErrors((current) => ({ ...current, name: undefined }));
                }}
              />
              <FieldError>{formErrors.name}</FieldError>
            </Field>

            <Field data-invalid={Boolean(formErrors.description)}>
              <FieldLabel htmlFor="service-description">Descripción</FieldLabel>
              <Textarea
                id="service-description"
                rows={4}
                maxLength={500}
                value={form.description}
                aria-invalid={Boolean(formErrors.description)}
                placeholder="Descripción del servicio"
                onChange={(event) => {
                  setForm((current) => ({ ...current, description: event.target.value }));
                  setFormErrors((current) => ({ ...current, description: undefined }));
                }}
              />
              <div className="flex justify-between gap-3">
                <FieldError>{formErrors.description}</FieldError>
                <span className="ml-auto text-xs text-muted-foreground">{form.description.length}/500</span>
              </div>
            </Field>

            <Field data-invalid={Boolean(formErrors.icon)}>
              <FieldLabel>Ícono *</FieldLabel>
              <IconPicker
                value={form.icon}
                invalid={Boolean(formErrors.icon)}
                onChange={(icon) => {
                  setForm((current) => ({ ...current, icon }));
                  setFormErrors((current) => ({ ...current, icon: undefined }));
                }}
              />
              <FieldError>{formErrors.icon}</FieldError>
            </Field>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between rounded-xl normal-case tracking-normal">
                  <span className="flex items-center gap-2"><Settings2 />Configuración avanzada</span>
                  <ChevronDown className={cn("transition-transform", advancedOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 grid gap-4 border-t border-border/50 pt-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-days">Tiempo estimado (días)</Label>
                  <Input
                    id="service-days"
                    type="number"
                    min={0}
                    value={form.estimatedDeliveryDays}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      estimatedDeliveryDays: Math.max(0, Number.parseInt(event.target.value, 10) || 0),
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-price">Precio de venta</Label>
                  <Input id="service-price" type="number" min={0} step="0.01" value={form.defaultPrice} onChange={(event) => setForm((current) => ({ ...current, defaultPrice: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-cost">Costo interno</Label>
                  <Input id="service-cost" type="number" min={0} step="0.01" value={form.baseCost} onChange={(event) => setForm((current) => ({ ...current, baseCost: event.target.value }))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Roles responsables</Label>
                  <RolePicker roles={rolesQuery.data ?? []} value={form.requiredRoles} onChange={(requiredRoles) => setForm((current) => ({ ...current, requiredRoles }))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="service-asset">URL del asset de marketing</Label>
                  <Input id="service-asset" type="url" value={form.marketingAssetUrl} onChange={(event) => setForm((current) => ({ ...current, marketingAssetUrl: event.target.value }))} />
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <Switch id="service-active" checked={form.isActive} onCheckedChange={(isActive) => setForm((current) => ({ ...current, isActive }))} />
                  <Label htmlFor="service-active">Servicio activo</Label>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeEditor} disabled={isSaving}>Cancelar</Button>
            <Button type="button" onClick={submitService} disabled={isSaving}>
              {isSaving && <Spinner />}
              {editTarget ? "Guardar cambios" : "Agregar Servicio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar servicio?</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">
            <strong className="text-foreground">{deleteTarget?.name}</strong> se ocultará del catálogo.
            Los proyectos y registros históricos conservarán su información.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancelar</Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending && <Spinner />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
