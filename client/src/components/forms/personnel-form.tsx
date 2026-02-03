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
    FormDescription,
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
import { createTeam, updateTeam, fetchAgencyRoles } from "@/lib/api";
import { insertTeamSchema, type Team, type AgencyRole } from "@shared/schema";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PersonnelFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Team | null;
}


// Use insertTeamSchema directly - it has validations and defaults already configured
const formSchema = insertTeamSchema;

export function PersonnelForm({ open, onOpenChange, initialData }: PersonnelFormProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const { data: roles = [] } = useQuery({
        queryKey: ["agency-roles"],
        queryFn: fetchAgencyRoles,
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            monthlySalary: "0",
            payrollType: "Fija",
            startDate: new Date(),
            employeeStatus: "Activo",
            notes: "",
            avatarUrl: "",
            // Legacy fields with defaults
            name: "",
            role: "",
            seniority: "Junior",
            status: "Available",
            workHoursStart: "09:00",
            workHoursEnd: "18:00",
            weeklyCapacity: 40,
            internalCostHour: "0",
            billableRate: "0",
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    firstName: initialData.firstName || "",
                    lastName: initialData.lastName || "",
                    email: initialData.email || "",
                    phone: initialData.phone || "",
                    monthlySalary: initialData.monthlySalary?.toString() || "0",
                    payrollType: (initialData.payrollType as "Fija" | "Variable") || "Fija",
                    startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
                    employeeStatus: (initialData.employeeStatus as "Activo" | "Inactivo") || "Activo",
                    notes: initialData.notes || "",
                    avatarUrl: initialData.avatarUrl || "",
                    // Legacy fields
                    name: initialData.name || "",
                    role: initialData.role || "",
                    seniority: initialData.seniority || "Junior",
                    status: initialData.status || "Available",
                    workHoursStart: initialData.workHoursStart || "09:00",
                    workHoursEnd: initialData.workHoursEnd || "18:00",
                    weeklyCapacity: initialData.weeklyCapacity || 40,
                    internalCostHour: initialData.internalCostHour?.toString() || "0",
                    billableRate: initialData.billableRate?.toString() || "0",
                });
                setAvatarPreview(initialData.avatarUrl || null);
            } else {
                form.reset({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    monthlySalary: "0",
                    payrollType: "Fija",
                    startDate: new Date(),
                    employeeStatus: "Activo",
                    notes: "",
                    avatarUrl: "",
                    name: "",
                    role: "",
                    seniority: "Junior",
                    status: "Available",
                    workHoursStart: "09:00",
                    workHoursEnd: "18:00",
                    weeklyCapacity: 40,
                    internalCostHour: "0",
                    billableRate: "0",
                });
                setAvatarPreview(null);
            }
        }
    }, [open, initialData, form]);

    const createMutation = useMutation({
        mutationFn: async (data: z.infer<typeof formSchema>) => {
            // Combine firstName and lastName into name for backward compatibility
            const payload = {
                ...data,
                name: `${data.firstName} ${data.lastName}`,
            };
            return createTeam(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
            toast({ title: "Éxito", description: "Empleado agregado correctamente" });
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message || "Error al crear empleado", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => {
            const payload = {
                ...data,
                name: `${data.firstName} ${data.lastName}`,
            };
            return updateTeam(id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
            toast({ title: "Éxito", description: "Empleado actualizado correctamente" });
            onOpenChange(false);
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        console.log("Form submitted with values:", values);
        console.log("Form errors:", form.formState.errors);

        if (initialData) {
            updateMutation.mutate({ id: initialData.id, data: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const onError = (errors: any) => {
        console.log("❌ Form validation failed with errors:", errors);
        console.log("Current form values:", form.getValues());

        // Build detailed error message showing which fields failed
        const errorFields = Object.keys(errors);
        const errorMessages = errorFields.map(field => {
            const error = errors[field];
            return `${field}: ${error?.message || 'Inválido'}`;
        });

        console.log("❌ Campos con error:", errorMessages);

        toast({
            title: "Error de validación",
            description: errorFields.length > 0
                ? `Campos con error: ${errorFields.join(', ')}`
                : "Por favor completa todos los campos requeridos",
            variant: "destructive"
        });
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
                form.setValue("avatarUrl", reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getInitials = () => {
        const firstName = form.watch("firstName");
        const lastName = form.watch("lastName");
        return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
    };

    const payrollType = form.watch("payrollType");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                {/* Avatar Upload Section */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative group">
                        <Avatar className="h-24 w-24 border-2 border-border">
                            {avatarPreview ? (
                                <AvatarImage src={avatarPreview} />
                            ) : (
                                <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-semibold">
                                    {getInitials()}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <label
                            htmlFor="avatar-upload"
                            className="absolute bottom-0 right-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                        >
                            <Upload className="h-4 w-4 text-primary-foreground" />
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                        </label>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        Haz clic en el ícono para subir una foto de perfil
                    </p>
                </div>

                {/* Two-column Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Juan" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Apellido *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Pérez" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="juan.perez@empresa.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono *</FormLabel>
                                <FormControl>
                                    <Input placeholder="+52 33 1234 5678" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="monthlySalary"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sueldo Mensual *</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input type="number" placeholder="0" {...field} className="pr-12" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                            MXN
                                        </span>
                                    </div>
                                </FormControl>
                                <FormDescription className="text-xs">
                                    {payrollType === "Fija" ? "Cantidad fija mensual" : "Monto estimado/referencia"}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payrollType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Nómina *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "Fija"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Fija">💰 Nómina Fija (Mensual fijo)</SelectItem>
                                        <SelectItem value="Variable">📊 Nómina Variable (Por pago)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription className="text-xs">
                                    {field.value === "Fija"
                                        ? "Se paga el mismo monto cada mes"
                                        : "Se pagan cantidades variables según el trabajo"}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha de Ingreso *</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "dd/MM/yyyy", { locale: es })
                                                ) : (
                                                    <span>dd/mm/aaaa</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value || undefined}
                                            onSelect={field.onChange}
                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="employeeStatus"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "Activo"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Activo">Activo</SelectItem>
                                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Rol */}
                <FormField
                    control={form.control}
                    name="roleCatalogId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rol</FormLabel>
                            {roles.length === 0 ? (
                                <div className="text-center py-6 px-4 border border-dashed border-border rounded-md">
                                    <p className="text-sm text-muted-foreground mb-1">
                                        No hay roles disponibles. Crea roles en el catálogo.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Los roles definen las responsabilidades del empleado
                                    </p>
                                </div>
                            ) : (
                                <Select
                                    onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                                    value={field.value?.toString() || "none"}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un rol..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Sin rol asignado</SelectItem>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id.toString()}>
                                                {role.roleName} - {role.department}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <FormDescription className="text-xs">
                                El rol define las actividades y responsabilidades del talento
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Notas Adicionales */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notas Adicionales</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Información adicional sobre el empleado..."
                                    className="min-h-[100px] resize-none"
                                    {...field}
                                    value={field.value || ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {createMutation.isPending || updateMutation.isPending
                            ? "Guardando..."
                            : initialData
                                ? "Guardar Cambios"
                                : "Crear"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
