import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ClientSelector } from "@/components/financial/client-selector";
import {
    insertTransactionSchema,
    INCOME_CATEGORIES,
    EXPENSE_CATEGORIES,
    type InsertTransaction,
    type Transaction
} from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransaction, updateTransaction } from "@/lib/api";

interface TransactionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Transaction | null;
    defaultType?: "Ingreso" | "Gasto";
}

// Extend the schema to handle string parsing for numbers if needed, 
// though react-hook-form + zod usually handles this well with coerce.
// We'll use the insert schema but refine it safely.
// Note: insertTransactionSchema expects numeric strings for amount/subtotal/etc in strict Drizzle Zod,
// but we might want to handle them as numbers in the form for better UX.

const formSchema = insertTransactionSchema.extend({
    // Override numeric fields to accept strings or numbers, ensuring they parse to numeric strings for API
    amount: z.string().or(z.number()).transform(v => v.toString()),
    subtotal: z.string().or(z.number()).optional().transform(v => v ? v.toString() : undefined),
    iva: z.string().or(z.number()).optional().transform(v => v ? v.toString() : undefined),
});

export function TransactionForm({ open, onOpenChange, initialData, defaultType = "Ingreso" }: TransactionFormProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: defaultType,
            date: new Date(),
            amount: "0",
            subtotal: "0",
            iva: "0",
            category: "",
            description: "",
            status: "Pendiente",
            isPaid: false,
            rfc: "",
            invoiceNumber: "",
            provider: "", /* Only for Egresos */
            notes: "",
            clientId: null,
        },
    });

    const { watch, setValue, reset } = form;
    const type = watch("type");
    const subtotal = watch("subtotal");
    const iva = watch("iva");

    // Reset form when opening/closing or changing initialData
    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    ...initialData,
                    date: new Date(initialData.date),
                    amount: initialData.amount.toString(),
                    subtotal: initialData.subtotal?.toString(),
                    iva: initialData.iva?.toString(),
                    clientId: initialData.clientId || null,
                });
            } else {
                form.reset({
                    type: defaultType,
                    date: new Date(),
                    isPaid: false,
                    status: "Pendiente",
                    amount: "0",
                    subtotal: "",
                    iva: "",
                });
            }
        }
    }, [open, initialData, defaultType, form]);

    // Auto-calculate Total logic
    useEffect(() => {
        const sub = parseFloat(subtotal?.toString() || "0");
        const tax = parseFloat(iva?.toString() || "0");

        // If user enters subtotal, we can default IVA to 16% if it's currently 0 or empty?
        // Let's implement dynamic calculation: Total = Subtotal + IVA
        // Only update total if subtotal/iva changes to avoid loops
        if (!isNaN(sub) && !isNaN(tax)) {
            const total = (sub + tax).toFixed(2);
            // Only set if different to avoid re-renders or overwriting user manual total
            const currentTotal = watch("amount");
            if (currentTotal !== total && (sub > 0 || tax > 0)) {
                setValue("amount", total);
            }
        }
    }, [subtotal, iva, setValue, watch]);

    // If type changes, clear category
    useEffect(() => {
        if (type !== initialData?.type) {
            // setValue("category", ""); // Optional: keep/clear category
        }
    }, [type, initialData, setValue]);

    const createMutation = useMutation({
        mutationFn: createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            toast({ title: "Éxito", description: "Transacción creada correctamente" });
            onOpenChange(false);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "No se pudo crear la transacción. Verifique los datos.",
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: InsertTransaction) => updateTransaction(initialData!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            toast({ title: "Éxito", description: "Transacción actualizada correctamente" });
            onOpenChange(false);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "No se pudo actualizar la transacción.",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        // Ensure numbers are formatted as strings for the API if schema requires it, 
        // or let zod transform handle it.
        // The formSchema transformer should have handled it, but safety check:
        const payload = {
            ...data,
            // Ensure paidDate is set if isPaid is true
            paidDate: data.isPaid && !data.paidDate ? new Date() : data.paidDate,
        };

        if (initialData) {
            updateMutation.mutate(payload as InsertTransaction);
        } else {
            createMutation.mutate(payload as InsertTransaction);
        }
    };

    const categories = type === "Ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Transacción" : `Nuevo ${type === "Ingreso" ? "Ingreso" : "Egreso"}`}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Essential Info Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground">Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background border-border">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Ingreso">Ingreso (Income)</SelectItem>
                                                <SelectItem value="Gasto">Egreso (Expense)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground">Fecha</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                                className="bg-background border-border"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Category & Concept */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground">Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background border-border">
                                                    <SelectValue placeholder="Seleccionar Categoría" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground">Concepto / Descripción</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Pago servicio Junio" {...field} value={field.value || ""} className="bg-background border-border" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Client (for Income) or Provider (for Expense) */}
                        <div className="grid grid-cols-2 gap-4">
                            {type === "Ingreso" && (
                                <FormField
                                    control={form.control}
                                    name="clientId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-muted-foreground">Cliente (Relacionado)</FormLabel>
                                            <FormControl>
                                                <ClientSelector
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    className="bg-background border-border"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {type === "Gasto" && (
                                <FormField
                                    control={form.control}
                                    name="provider"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-muted-foreground">Proveedor</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. AWS, Totalplay" {...field} value={field.value || ""} className="bg-background border-border" />
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
                                        <FormLabel className="text-muted-foreground">RFC (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="XEXX010101000" {...field} value={field.value || ""} className="bg-background border-border uppercase" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Fiscal Data Row */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-sm border border-border">
                            <FormField
                                control={form.control}
                                name="subtotal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground uppercase font-mono">Subtotal</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number" step="0.01"
                                                placeholder="0.00"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    // Auto calc IVA 16% on subtotal change
                                                    if (e.target.value) {
                                                        const sub = parseFloat(e.target.value);
                                                        // Automatically adding 16% IVA
                                                        const calculatedIva = (sub * 0.16).toFixed(2);
                                                        form.setValue("iva", calculatedIva);
                                                    } else {
                                                        form.setValue("iva", "");
                                                    }
                                                }}
                                                className="bg-background border-border text-right font-mono"
                                            />
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
                                        <FormLabel className="text-xs text-muted-foreground uppercase font-mono">IVA (16%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number" step="0.01"
                                                placeholder="0.00"
                                                {...field}
                                                className="bg-background border-border text-right font-mono"
                                                readOnly
                                            />
                                        </FormControl>
                                        {/* Helper to set 16% */}
                                        <span
                                            className="text-[10px] text-blue-500 cursor-pointer hover:underline text-right block"
                                            onClick={() => {
                                                const sub = parseFloat(form.getValues("subtotal") || "0");
                                                if (sub) form.setValue("iva", (sub * 0.16).toFixed(2));
                                            }}
                                        >
                                            Calc 16%
                                        </span>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-primary uppercase font-mono font-bold">TOTAL</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number" step="0.01"
                                                {...field}
                                                className="bg-background border-border text-right font-mono font-bold text-foreground"
                                                readOnly // Make read-only to enforce calc? Or allow override?
                                            // Let's allow override but visually distinct
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Invoice & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="invoiceNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground">Folio Factura</FormLabel>
                                        <FormControl>
                                            <Input placeholder="A-1234" {...field} value={field.value || ""} className="bg-background border-border" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isPaid"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-sm border border-border bg-card p-3 shadow-sm mt-8">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-foreground">Pagado</FormLabel>
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
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground">Notas Adicionales</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="" {...field} value={field.value || ""} className="bg-background border-border" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                            {initialData ? "Guardar Cambios" : "Crear Transacción"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
