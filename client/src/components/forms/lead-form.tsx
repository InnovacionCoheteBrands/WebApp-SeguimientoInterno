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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLead, updateLead, type Lead } from "@/lib/api";
import { insertLeadSchema, LEAD_ORIGINS, LEAD_PRIORITIES } from "@shared/schema";
import { useEffect } from "react";

interface LeadFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Lead | null;
}

const formSchema = insertLeadSchema;

export function LeadForm({ open, onOpenChange, initialData }: LeadFormProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            company: "",
            origin: "Otro",
            estimatedValue: "",
            notes: "",
            status: "Nuevo",
            priority: "Media",
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    email: initialData.email || "",
                    phone: initialData.phone || "",
                    company: initialData.company || "",
                    origin: initialData.origin as any,
                    estimatedValue: initialData.estimatedValue || "",
                    notes: initialData.notes || "",
                    status: initialData.status as any,
                    priority: initialData.priority as any || "Media",
                });
            } else {
                form.reset({
                    name: "",
                    email: "",
                    phone: "",
                    company: "",
                    origin: "Otro",
                    estimatedValue: "",
                    notes: "",
                    status: "Nuevo",
                    priority: "Media",
                });
            }
        }
    }, [open, initialData, form]);

    const createMutation = useMutation({
        mutationFn: createLead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["leads-metrics"] });
            toast({ title: "Éxito", description: "Lead creado correctamente" });
            onOpenChange(false);
        },
        onError: () => {
            toast({ title: "Error", description: "No se pudo crear el lead", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateLead(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["leads-metrics"] });
            toast({ title: "Éxito", description: "Lead actualizado correctamente" });
            onOpenChange(false);
        },
        onError: () => {
            toast({ title: "Error", description: "No se pudo actualizar el lead", variant: "destructive" });
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        if (initialData) {
            updateMutation.mutate({ id: initialData.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre *</FormLabel>
                            <FormControl>
                                <Input placeholder="Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field: { value, ...fieldProps } }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="email@ejemplo.com" {...fieldProps} value={value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field: { value, ...fieldProps } }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="+52 33 1234 5678" {...fieldProps} value={value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="company"
                    render={({ field: { value, ...fieldProps } }) => (
                        <FormItem>
                            <FormLabel>Empresa</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre de la empresa" {...fieldProps} value={value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="origin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Origen *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {LEAD_ORIGINS.map((origin) => (
                                            <SelectItem key={origin} value={origin}>{origin}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="estimatedValue"
                        render={({ field: { value, ...fieldProps } }) => (
                            <FormItem>
                                <FormLabel>Valor Estimado</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="50000" {...fieldProps} value={value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prioridad</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {LEAD_PRIORITIES.map((priority) => (
                                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field: { value, ...fieldProps } }) => (
                        <FormItem>
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Notas adicionales..." {...fieldProps} value={value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {initialData ? "Guardar Cambios" : "Crear Lead"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
