import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ClientSelector } from "@/components/financial/client-selector";
import {
    insertRecurringTransactionSchema,
    INCOME_CATEGORIES,
    EXPENSE_CATEGORIES,
    type RecurringTransaction
} from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface RecurringFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: RecurringTransaction | null;
    defaultType?: "Ingreso" | "Gasto";
}

// Extend schema for form handling (string to number coercion)
const formSchema = insertRecurringTransactionSchema.extend({
    amount: z.string().or(z.number()).transform(v => v.toString()),
    subtotal: z.string().or(z.number()).optional().transform(v => v ? v.toString() : undefined),
    iva: z.string().or(z.number()).optional().transform(v => v ? v.toString() : undefined),
    dayOfMonth: z.coerce.number().min(1).max(31).optional(),
    dayOfWeek: z.coerce.number().min(0).max(6).optional(),
    // Add startDate manually to form schema as it's not in insert schema but needed for UI
    startDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function RecurringForm({ open, onOpenChange, initialData, defaultType = "Ingreso" }: RecurringFormProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: defaultType,
            amount: "0",
            category: "",
            frequency: "monthly",
            // interval: 1, // Removed
            isActive: true,
            // Fiscal / Extra
            description: "",
            subtotal: "0",
            iva: "0",
            rfc: "",
            provider: "",
            clientId: null,
            notes: "",
            dayOfMonth: new Date().getDate(),
            startDate: new Date(),
        },
    });

    const { watch, setValue, reset } = form;
    const type = watch("type");
    const frequency = watch("frequency");
    const subtotal = watch("subtotal");

    // Reset form on open
    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    amount: initialData.amount.toString(),
                    subtotal: initialData.subtotal?.toString(),
                    iva: initialData.iva?.toString(),
                    startDate: initialData.nextExecutionDate ? new Date(initialData.nextExecutionDate) : new Date(),
                    dayOfMonth: initialData.dayOfMonth ?? undefined,
                    dayOfWeek: initialData.dayOfWeek ?? undefined,
                });
            } else {
                reset({
                    name: "",
                    type: defaultType,
                    amount: "0",
                    category: "",
                    frequency: "monthly",
                    isActive: true,
                    notes: "",
                    subtotal: "0",
                    iva: "0",
                    rfc: "",
                    provider: "",
                    clientId: null,
                    // notes: "", // Removed duplicate
                    dayOfMonth: new Date().getDate(),
                    startDate: new Date(),
                });
            }
        }
    }, [open, initialData, defaultType, reset]);

    // Auto-calculate IVA and Total
    useEffect(() => {
        if (!subtotal) return;
        const subVal = parseFloat(subtotal.toString());
        if (!isNaN(subVal)) {
            const ivaVal = subVal * 0.16;
            const totalVal = subVal + ivaVal;

            setValue("iva", ivaVal.toFixed(2));
            setValue("amount", totalVal.toFixed(2));
        }
    }, [subtotal, setValue]);

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const endpoint = initialData
                ? `/api/recurring_transactions/${initialData.id}`
                : "/api/recurring_transactions";

            const method = initialData ? "PATCH" : "POST";

            // Format dates and numbers
            const { startDate, ...rest } = values;
            const payload = {
                ...rest,
                nextExecutionDate: startDate || new Date(),
            };

            const res = await apiRequest(method, endpoint, payload);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/recurring_transactions"] });
            toast({
                title: initialData ? "Actualizado" : "Creado",
                description: `Transacción recurrente ${initialData ? "actualizada" : "creada"} exitosamente.`,
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Error al guardar: ${error}`,
                variant: "destructive",
            });
        }
    });

    const onSubmit = (values: FormValues) => {
        mutation.mutate(values);
    };

    const categories = type === "Ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Editar" : "Nueva"} Automatización ({type})
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Concepto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Renta Oficina" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                // Clear category when switching type
                                                form.setValue("category", "");
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Ingreso">Ingreso (CxC)</SelectItem>
                                                <SelectItem value="Gasto">Gasto (CxP)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Client / Provider Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            {type === "Ingreso" ? (
                                <FormField
                                    control={form.control}
                                    name="clientId"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Cliente</FormLabel>
                                            <FormControl>
                                                <ClientSelector
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="provider"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1">
                                            <FormLabel>Proveedor</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Razón Social del Proveedor"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="rfc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RFC</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="XAXX010101000"
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Amounts Section */}
                        <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20">
                            <FormField
                                control={form.control}
                                name="subtotal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subtotal</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="iva"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>IVA (16%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" readOnly className="bg-muted" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">Total</FormLabel>
                                        <FormControl>
                                            <Input type="number" readOnly className="font-bold bg-muted" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Classification & Frequency */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frecuencia</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="weekly">Semanal</SelectItem>
                                                <SelectItem value="biweekly">Quincenal</SelectItem>
                                                <SelectItem value="monthly">Mensual</SelectItem>
                                                <SelectItem value="yearly">Anual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Frequency Details */}
                        <div className="grid grid-cols-2 gap-4">
                            {frequency === 'monthly' && (
                                <FormField
                                    control={form.control}
                                    name="dayOfMonth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Día del mes de ejecución</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" max="31" {...field} />
                                            </FormControl>
                                            <FormDescription>Se generará automáticamente en este día</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {frequency === 'weekly' && (
                                <FormField
                                    control={form.control}
                                    name="dayOfWeek"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Día de la semana</FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(parseInt(val))}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar día" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="1">Lunes</SelectItem>
                                                    <SelectItem value="2">Martes</SelectItem>
                                                    <SelectItem value="3">Miércoles</SelectItem>
                                                    <SelectItem value="4">Jueves</SelectItem>
                                                    <SelectItem value="5">Viernes</SelectItem>
                                                    <SelectItem value="6">Sábado</SelectItem>
                                                    <SelectItem value="0">Domingo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas / Descripción interna</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Detalles adicionales..." {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Automático</FormLabel>
                                        <FormDescription>
                                            Si está activo, el sistema generará la transacción automáticamente.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Automatización
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
