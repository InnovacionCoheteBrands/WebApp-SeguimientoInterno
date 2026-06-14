import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, GraduationCap, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import {
  createAgencyRole,
  deleteAgencyRole,
  fetchAgencyRoles,
  fetchServiceCatalog,
  updateAgencyRole,
} from "@/lib/api";
import type {
  AgencyRole,
  ServiceCatalog,
} from "@/lib/api";
import type { InsertAgencyRole, UpdateAgencyRole } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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

const ROLE_LEVELS = ["Senior", "Mid", "Junior", "Trainee"] as const;

const LEVEL_COLORS: Record<string, string> = {
  Senior: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Mid: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Junior: "bg-green-500/15 text-green-400 border-green-500/30",
  Trainee: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

type RoleForm = {
  roleName: string;
  roleLevel: string;
  department: string;
  defaultBillableRate: string;
  allowedActivities: string;
};

function emptyRoleForm(): RoleForm {
  return {
    roleName: "",
    roleLevel: "Senior",
    department: "General",
    defaultBillableRate: "0",
    allowedActivities: "[]",
  };
}

function parseActivities(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function roleFormFromRecord(role: AgencyRole): RoleForm {
  return {
    roleName: role.roleName,
    roleLevel: role.roleLevel ?? "Senior",
    department: role.department ?? "General",
    defaultBillableRate: role.defaultBillableRate ?? "0",
    allowedActivities: role.allowedActivities ?? "[]",
  };
}

function toRolePayload(form: RoleForm): InsertAgencyRole {
  return {
    roleName: form.roleName.trim(),
    roleLevel: form.roleLevel,
    department: form.department.trim() || null,
    defaultBillableRate: form.defaultBillableRate || undefined,
    allowedActivities: form.allowedActivities,
  };
}

function ServicePicker({
  services,
  value,
  onChange,
}: {
  services: ServiceCatalog[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseActivities(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" className="w-full justify-between rounded-xl normal-case tracking-normal">
          <span className="truncate">
            {selected.length ? `${selected.length} servicio${selected.length === 1 ? "" : "s"} seleccionado${selected.length === 1 ? "" : "s"}` : "Seleccionar servicios"}
          </span>
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar servicio..." />
          <CommandList>
            <CommandEmpty>No hay servicios disponibles.</CommandEmpty>
            <CommandGroup>
              {services.map((service) => {
                const isSelected = selected.includes(service.name);
                return (
                  <CommandItem
                    key={service.id}
                    value={service.name}
                    onSelect={() => {
                      const next = isSelected
                        ? selected.filter((name) => name !== service.name)
                        : [...selected, service.name];
                      onChange(JSON.stringify(next));
                    }}
                  >
                    <span className={cn("mr-2 size-2 rounded-full", isSelected ? "bg-primary" : "bg-muted")} />
                    {service.name}
                    <span className="ml-auto text-xs text-muted-foreground">{service.category ?? "General"}</span>
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

export function RoleCatalogPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgencyRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgencyRole | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyRoleForm);

  const rolesQuery = useQuery({ queryKey: ["agency-roles"], queryFn: fetchAgencyRoles });
  const servicesQuery = useQuery({ queryKey: ["service-catalog"], queryFn: fetchServiceCatalog });

  const closeEditor = () => {
    setDialogOpen(false);
    setEditTarget(null);
    setForm(emptyRoleForm());
  };

  const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: ["agency-roles"] });

  const createMutation = useMutation({
    mutationFn: (payload: InsertAgencyRole) => createAgencyRole(payload),
    onSuccess: async () => {
      await invalidateRoles();
      closeEditor();
      toast({ title: "Rol creado" });
    },
    onError: () => toast({ title: "No se pudo crear el rol", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateAgencyRole }) => updateAgencyRole(id, payload),
    onSuccess: async () => {
      await invalidateRoles();
      closeEditor();
      toast({ title: "Rol actualizado" });
    },
    onError: () => toast({ title: "No se pudo actualizar el rol", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgencyRole,
    onSuccess: async () => {
      await invalidateRoles();
      setDeleteTarget(null);
      toast({ title: "Rol eliminado" });
    },
    onError: () => toast({ title: "No se pudo eliminar el rol", variant: "destructive" }),
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyRoleForm());
    setDialogOpen(true);
  };

  const openEdit = (role: AgencyRole) => {
    setEditTarget(role);
    setForm(roleFormFromRecord(role));
    setDialogOpen(true);
  };

  const submit = () => {
    if (!form.roleName.trim()) {
      toast({ title: "El nombre del rol es obligatorio", variant: "destructive" });
      return;
    }
    const payload = toRolePayload(form);
    if (editTarget) updateMutation.mutate({ id: editTarget.id, payload });
    else createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const roles = rolesQuery.data ?? [];

  return (
    <>
      <div className="mt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-medium">Catálogo de Roles</h2>
            <p className="text-sm text-muted-foreground">Perfiles maestros para asignación en servicios.</p>
          </div>
          <Button type="button" variant="outline" onClick={openCreate}><Plus />Nuevo Rol</Button>
        </div>

        <div className="mt-6 pb-6">
          {rolesQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-card" />)}
            </div>
          ) : roles.length === 0 ? (
            <Empty className="min-h-64 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Shield /></EmptyMedia>
                <EmptyTitle>No hay roles definidos</EmptyTitle>
                <EmptyDescription>Crea perfiles para asignarlos a los servicios.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {roles.map((role) => {
                const level = role.roleLevel ?? "Senior";
                const activities = parseActivities(role.allowedActivities);
                return (
                  <article key={role.id} className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Shield className="size-5 text-primary" /></div>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">{role.roleName}</h3>
                          <p className="text-xs text-muted-foreground">{role.department ?? "General"}</p>
                        </div>
                      </div>
                      <div className="flex">
                        <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(role)} aria-label={`Editar ${role.roleName}`}><Pencil /></Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteTarget(role)} aria-label={`Eliminar ${role.roleName}`} className="text-destructive"><Trash2 /></Button>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("w-fit", LEVEL_COLORS[level] ?? LEVEL_COLORS.Senior)}>
                      <GraduationCap className="mr-1 size-3" />{level}
                    </Badge>
                    {activities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {activities.map((activity) => <Badge key={activity} variant="outline" className="text-[10px]">{activity}</Badge>)}
                      </div>
                    )}
                    <div className="mt-auto flex justify-between border-t border-border/40 pt-3 text-xs">
                      <span className="text-muted-foreground">Costo/hr</span>
                      <span>${role.defaultBillableRate ?? "0.00"}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && !isSaving && closeEditor()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editTarget ? "Editar Rol" : "Nuevo Rol"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="role-name">Nombre del rol *</Label>
              <Input id="role-name" value={form.roleName} onChange={(event) => setForm((current) => ({ ...current, roleName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select value={form.roleLevel} onValueChange={(roleLevel) => setForm((current) => ({ ...current, roleLevel }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLE_LEVELS.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-department">Departamento</Label>
              <Input id="role-department" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="role-rate">Costo/hr</Label>
              <Input id="role-rate" type="number" min={0} step="0.01" value={form.defaultBillableRate} onChange={(event) => setForm((current) => ({ ...current, defaultBillableRate: event.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Servicios que puede ejecutar</Label>
              <ServicePicker services={servicesQuery.data ?? []} value={form.allowedActivities} onChange={(allowedActivities) => setForm((current) => ({ ...current, allowedActivities }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeEditor} disabled={isSaving}>Cancelar</Button>
            <Button type="button" onClick={submit} disabled={isSaving}>{isSaving && <Spinner />}Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar rol?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se eliminará <strong className="text-foreground">{deleteTarget?.roleName}</strong>.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Spinner />}Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
