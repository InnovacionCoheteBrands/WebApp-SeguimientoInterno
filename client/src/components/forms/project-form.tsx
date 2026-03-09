import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createProject,
    updateProject,
    fetchClientAccounts,
    fetchTeam,
    fetchServiceCatalog,
    fetchAgencyRoles,
    addProjectTeamMember,
    addProjectService,
    createInstallment,
    type Project
} from "@/lib/api";
import { insertProjectSchema } from "@shared/schema";
import { useEffect, useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ProjectFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Project | null;
}

const formSchema = insertProjectSchema;
const PROJECT_LEVELS = ["Bronce", "Plata", "Oro", "Diamante"];

export function ProjectForm({ open, onOpenChange, initialData }: ProjectFormProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>(() =>
        (initialData as any)?.teamMembers?.map((m: any) => m.teamMemberId) || []
    );
    const [selectedServices, setSelectedServices] = useState<number[]>(() =>
        (initialData as any)?.services?.map((s: any) => s.serviceId) || []
    );
    const [installments, setInstallments] = useState<Array<{ amount: number; date: Date; concept: string }>>(() =>
        (initialData as any)?.installments || []
    );
    const [newInstallment, setNewInstallment] = useState<{ amount: string, date: Date | undefined, concept: string }>({ amount: "", date: new Date(), concept: "" });
    const [missingRoles, setMissingRoles] = useState<string[]>([]);

    const { data: clients = [] } = useQuery({ queryKey: ["client-accounts"], queryFn: fetchClientAccounts });
    const { data: team = [] } = useQuery({ queryKey: ["team"], queryFn: fetchTeam });
    const { data: services = [] } = useQuery({ queryKey: ["service-catalog"], queryFn: fetchServiceCatalog });
    const { data: agencyRoles = [] } = useQuery({ queryKey: ["agency-roles"], queryFn: fetchAgencyRoles });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientId: initialData?.clientId || 0,
            name: initialData?.name || "",
            serviceType: initialData?.serviceType || "General",
            status: initialData?.status || "planning",
            health: (initialData?.health as any) || "green",
            progress: initialData?.progress || 0,
            description: initialData?.description || "",
            level: (initialData as any)?.level || "Plata",
            quotationAmount: (initialData as any)?.quotationAmount?.toString() || "",
            monthlyMaintenance: (initialData as any)?.monthlyMaintenance?.toString() || "",
            deadline: initialData?.deadline ? new Date(initialData.deadline) : undefined,
            startDate: (initialData as any)?.startDate ? new Date((initialData as any).startDate) : new Date(),
            coverColor: (initialData as any)?.coverColor || "#3B82F6",
            additionalNotes: (initialData as any)?.additionalNotes || "",
            dealType: (initialData as any)?.dealType || "Proyecto",
            totalAmount: (initialData as any)?.totalAmount?.toString() || "",
            numberOfPayments: (initialData as any)?.numberOfPayments || 1,
            billingDay: (initialData as any)?.billingDay || 1,
        },
    });

    // --- Filtered Services Logic ---
    const visibleServices = useMemo(() => {
        if (selectedTeamMembers.length === 0) return services;

        // 1. Get roles of selected team members
        const selectedMemberRoles = selectedTeamMembers
            .map(id => team.find(t => t.id === id)?.role)
            .filter(Boolean);

        // 2. Identify allowed service names for those roles
        const allowedServiceNames = new Set<string>();
        selectedMemberRoles.forEach(roleName => {
            const roleConfig = agencyRoles.find(r => r.roleName === roleName);
            if (roleConfig?.allowedActivities) {
                try {
                    const activities = typeof roleConfig.allowedActivities === 'string'
                        ? JSON.parse(roleConfig.allowedActivities)
                        : roleConfig.allowedActivities;
                    if (Array.isArray(activities)) {
                        activities.forEach(act => allowedServiceNames.add(act));
                    }
                } catch (e) {
                    console.error("Error parsing allowedActivities for role:", roleName, e);
                }
            }
        });

        // 3. Filter the global catalog by these names
        // If no roles are found in the catalog yet, we might want to show all or none. 
        // Showing all if the set is empty (meaning no role mapping exists) is safer.
        if (allowedServiceNames.size === 0) return services;

        return services.filter(service => allowedServiceNames.has(service.name));
    }, [services, selectedTeamMembers, team, agencyRoles]);

    // Auto-calculation effect
    useEffect(() => {
        if (!selectedServices.length || !services.length) {
            setMissingRoles([]);
            return;
        }

        let totalCost = 0;
        let totalDays = 0;
        const requiredRolesSet = new Set<string>();

        selectedServices.forEach(serviceId => {
            const service = services.find(s => s.id === serviceId);
            if (service) {
                totalCost += service.defaultPrice ? parseFloat(service.defaultPrice) : 0;
                totalDays += (service as any).estimatedDeliveryDays || 0;

                const rawRoles = (service as any).requiredRoles;
                if (rawRoles) {
                    try {
                        const roles = typeof rawRoles === 'string' ? JSON.parse(rawRoles) : rawRoles;
                        if (Array.isArray(roles)) roles.forEach(r => requiredRolesSet.add(r));
                    } catch (e) {
                        if (typeof rawRoles === 'string') {
                            rawRoles.split(',').forEach((r: string) => requiredRolesSet.add(r.trim()));
                        }
                    }
                }
            }
        });

        // Use functional getters and only set if different to prevent the loop
        const currentQuotation = form.getValues("quotationAmount");
        if (totalCost > 0 && Math.abs(parseFloat(currentQuotation || "0") - totalCost) > 0.01) {
            form.setValue("quotationAmount", totalCost.toString(), { shouldDirty: true });
        }

        if (totalDays > 0) {
            const startDate = form.getValues("startDate");
            if (startDate) {
                const newDeadline = addDays(startDate, totalDays);
                const currentDeadline = form.getValues("deadline");

                if (!currentDeadline || Math.abs(currentDeadline.getTime() - newDeadline.getTime()) > 1000) {
                    form.setValue("deadline", newDeadline, { shouldDirty: true });
                }
            }
        }

        const currentRoles = selectedTeamMembers.map(id => team.find(t => t.id === id)?.role).filter(Boolean) as string[];
        const missing = Array.from(requiredRolesSet).filter(req => !currentRoles.some(curr => curr.toLowerCase().includes(req.toLowerCase())));

        setMissingRoles(prev => JSON.stringify(prev) === JSON.stringify(missing) ? prev : missing);
    }, [selectedServices, services, selectedTeamMembers, team, form]);

    const createMutation = useMutation({
        mutationFn: async (data: z.infer<typeof formSchema>) => {
            const project = await createProject(data);

            if (selectedTeamMembers.length > 0) {
                await Promise.all(selectedTeamMembers.map(userId =>
                    addProjectTeamMember(project.id, { teamMemberId: userId, roleInProject: "Member" })
                ));
            }

            if (selectedServices.length > 0) {
                await Promise.all(selectedServices.map(serviceId =>
                    addProjectService(project.id, serviceId)
                ));
            }

            if (installments.length > 0) {
                await Promise.all(installments.map((inst, index) =>
                    createInstallment({
                        projectId: project.id,
                        installmentNumber: index + 1,
                        amount: inst.amount.toString(),
                        dueDate: inst.date,
                        status: "pending",
                        notes: inst.concept
                    } as any)
                ));
            }

            return project;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast({ title: "Éxito", description: "Proyecto creado correctamente." });
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message || "Error al crear proyecto", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateProject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast({ title: "Éxito", description: "Proyecto actualizado" });
            onOpenChange(false);
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        if (initialData) {
            updateMutation.mutate({ id: initialData.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const addInstallment = () => {
        if (!newInstallment.amount || !newInstallment.date) return;
        setInstallments([...installments, {
            amount: parseFloat(newInstallment.amount),
            date: newInstallment.date,
            concept: newInstallment.concept
        }]);
        setNewInstallment({ amount: "", date: new Date(), concept: "" });
    };

    const removeInstallment = (index: number) => {
        const newInst = [...installments];
        newInst.splice(index, 1);
        setInstallments(newInst);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="h-[70vh] flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-8">
                        {/* === GENERAL SECTION === */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Información General</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Proyecto *</FormLabel>
                                        <FormControl><Input placeholder="Ej. Sitio Web Corporativo" {...field} value={field.value || ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="clientId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cliente *</FormLabel>
                                        <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {clients.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="level" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nivel/Categoría *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar nivel..." /></SelectTrigger></FormControl>
                                            <SelectContent>{PROJECT_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado del Proyecto *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar estado..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="planning">Planificación</SelectItem>
                                                <SelectItem value="active">En Desarrollo</SelectItem>
                                                <SelectItem value="on_hold">Pausa</SelectItem>
                                                <SelectItem value="completed">Terminado</SelectItem>
                                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="startDate" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha de Inicio *</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="deadline" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha de Fin</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>dd/mm/aaaa</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción del Proyecto *</FormLabel>
                                    <FormControl><Textarea placeholder="Describe los objetivos y alcance del proyecto..." className="min-h-[100px]" {...field} value={field.value || ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="coverColor" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color de Portada</FormLabel>
                                        <div className="flex gap-2 items-center">
                                            <Input type="color" {...field} value={field.value || "#3B82F6"} className="w-12 h-9 p-1 cursor-pointer" />
                                            <span className="text-xs text-muted-foreground">Color de fondo si no hay imagen</span>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="additionalNotes" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notas Adicionales</FormLabel>
                                        <FormControl><Input placeholder="Información adicional..." {...field} value={field.value || ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        {/* === FINANCE SECTION === */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium pt-4 border-t">Económico</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="quotationAmount" render={({ field: { value, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel>Cotización *</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...fieldProps} value={value || ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="monthlyMaintenance" render={({ field: { value, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel>Mantenimiento Mensual (Opcional)</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...fieldProps} value={value || ""} /></FormControl>
                                        <FormDescription>Ingreso mensual por mantenimiento del proyecto</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            {/* Payment Segmentation */}
                            <div className="border rounded-xl p-4 bg-muted/20">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold text-sm">Segmentación de Pagos</h4>
                                    <div className="text-xs text-muted-foreground">Fracciona los pagos en fechas específicas</div>
                                </div>

                                <div className="grid grid-cols-4 gap-2 mb-2">
                                    <Input type="number" placeholder="Monto" value={newInstallment.amount} onChange={e => setNewInstallment({ ...newInstallment, amount: e.target.value })} />
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newInstallment.date && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newInstallment.date ? format(newInstallment.date, "dd/MM/yyyy") : "Fecha"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={newInstallment.date} onSelect={(d) => d && setNewInstallment({ ...newInstallment, date: d })} initialFocus /></PopoverContent>
                                    </Popover>
                                    <Input placeholder="Concepto" value={newInstallment.concept} onChange={e => setNewInstallment({ ...newInstallment, concept: e.target.value })} />
                                    <Button type="button" size="sm" onClick={addInstallment}><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
                                </div>

                                <div className="space-y-2 mt-4">
                                    {installments.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">No hay pagos segmentados</div>}
                                    {installments.map((inst, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-background p-2 rounded border text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-medium">${inst.amount} - {format(inst.date, "dd/MM/yyyy")}</span>
                                                {inst.concept && <span className="text-xs text-muted-foreground">{inst.concept}</span>}
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeInstallment(idx)} className="h-6 w-6 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* === TEAM SECTION === */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium pt-4 border-t">Equipo de Trabajo</h3>
                            <div className="space-y-4">
                                <div className="text-sm font-medium">Selección de Miembros</div>
                                <ScrollArea className="h-[200px] border rounded-xl p-4">
                                    {team.map((member) => (
                                        <div key={member.id} className="flex items-center space-x-2 py-2 border-b last:border-0">
                                            <Checkbox
                                                id={`team-${member.id}`}
                                                checked={selectedTeamMembers.includes(member.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedTeamMembers([...selectedTeamMembers, member.id]);
                                                    else setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== member.id));
                                                }}
                                            />
                                            <label htmlFor={`team-${member.id}`} className="text-sm font-medium leading-none cursor-pointer w-full">
                                                {member.name}
                                                <span className="block text-xs text-muted-foreground font-normal">{member.role}</span>
                                            </label>
                                        </div>
                                    ))}
                                </ScrollArea>
                                <p className="text-xs text-muted-foreground">Selecciona los empleados que trabajarán en este proyecto</p>
                            </div>
                        </div>

                        {/* === SERVICES SECTION === */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium pt-4 border-t">Servicios Incluidos</h3>
                            {selectedTeamMembers.length > 0 && Array.from(new Set(selectedTeamMembers.map(id => team.find(t => t.id === id)?.role).filter(Boolean))).length > 0 && (
                                <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg text-xs flex items-center justify-between">
                                    <span>Filtrando servicios permitidos para el equipo seleccionado ({visibleServices.length} disponibles)</span>
                                    {visibleServices.length < services.length && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] hover:bg-primary/20"
                                            onClick={() => setSelectedTeamMembers([])}
                                        >
                                            Limpiar Filtro
                                        </Button>
                                    )}
                                </div>
                            )}
                            {missingRoles.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs animate-pulse">
                                    <span className="font-bold">Aviso:</span> Faltan perfiles en el equipo para cubrir los servicios: {missingRoles.join(", ")}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div className="text-sm font-medium">Catálogo de Servicios</div>
                                <ScrollArea className="h-[200px] border rounded-xl p-4">
                                    {visibleServices.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-8">
                                            {selectedTeamMembers.length > 0
                                                ? "No hay servicios compatibles con los roles seleccionados."
                                                : "No hay servicios disponibles."}
                                        </div>
                                    ) : (
                                        visibleServices.map((service: any) => (
                                            <div key={service.id} className="flex items-center space-x-2 py-2 border-b last:border-0">
                                                <Checkbox
                                                    id={`service-${service.id}`}
                                                    checked={selectedServices.includes(service.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) setSelectedServices([...selectedServices, service.id]);
                                                        else setSelectedServices(selectedServices.filter(id => id !== service.id));
                                                    }}
                                                />
                                                <label htmlFor={`service-${service.id}`} className="text-sm font-medium leading-none cursor-pointer w-full">
                                                    {service.name}
                                                    <span className="block text-xs text-muted-foreground font-normal">${(service as any).basePrice || (service as any).defaultPrice || "0.00"}</span>
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </ScrollArea>
                                <p className="text-xs text-muted-foreground">Selecciona los servicios que se incluirán en este proyecto</p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="flex justify-end gap-2 pt-4 border-t mt-4 bg-background">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {createMutation.isPending ? "Creando..." : (initialData ? "Guardar Cambios" : "Crear Proyecto")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
