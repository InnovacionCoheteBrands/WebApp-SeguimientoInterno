import { useState } from "react";
import { Plus, Pencil, Trash2, User, Mail, Phone, Bell, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchContactsByClient, createContact, updateContact, deleteContact } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Contact, InsertContact, UpdateContact } from "@shared/schema";

interface ContactsTabProps {
    clientId: number;
}

export function ContactsTab({ clientId }: ContactsTabProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [deleteContactId, setDeleteContactId] = useState<number | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: contacts = [], isLoading } = useQuery({
        queryKey: ["contacts", clientId],
        queryFn: () => fetchContactsByClient(clientId),
    });

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        mobile: "",
        position: "",
        notifyBilling: true,
        notifyPayments: true,
        notifyGeneral: true,
        isPrimary: false,
    });

    const createMutation = useMutation({
        mutationFn: createContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts", clientId] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Éxito", description: "Contacto creado exitosamente" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateContact }) => updateContact(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts", clientId] });
            setIsDialogOpen(false);
            setEditingContact(null);
            resetForm();
            toast({ title: "Éxito", description: "Contacto actualizado exitosamente" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts", clientId] });
            setDeleteContactId(null);
            toast({ title: "Éxito", description: "Contacto eliminado exitosamente" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const resetForm = () => {
        setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            mobile: "",
            position: "",
            notifyBilling: true,
            notifyPayments: true,
            notifyGeneral: true,
            isPrimary: false,
        });
        setEditingContact(null);
    };

    const handleOpenDialog = (contact?: Contact) => {
        if (contact) {
            setEditingContact(contact);
            setFormData({
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone || "",
                mobile: contact.mobile || "",
                position: contact.position || "",
                notifyBilling: contact.notifyBilling,
                notifyPayments: contact.notifyPayments,
                notifyGeneral: contact.notifyGeneral,
                isPrimary: contact.isPrimary,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.email) {
            toast({ title: "Error", description: "Nombre, apellido y email son requeridos", variant: "destructive" });
            return;
        }

        const payload = { ...formData, clientId };

        if (editingContact) {
            updateMutation.mutate({ id: editingContact.id, data: formData });
        } else {
            createMutation.mutate(payload as InsertContact);
        }
    };

    return (
        <>
            <Card className="rounded-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Contactos</CardTitle>
                    <Button onClick={() => handleOpenDialog()} className="rounded-sm" size="sm">
                        <Plus className="size-4 mr-2" />
                        Agregar Contacto
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground">Cargando...</p>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-8">
                            <User className="size-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay contactos registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="flex items-center justify-between p-4 border border-border rounded-sm bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="size-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">
                                                    {contact.firstName} {contact.lastName}
                                                </p>
                                                {contact.isPrimary && (
                                                    <Badge variant="outline" className="text-xs rounded-sm text-primary border-primary/30">
                                                        <Star className="size-3 mr-1" />
                                                        Principal
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="size-3" />
                                                    {contact.email}
                                                </span>
                                                {contact.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="size-3" />
                                                        {contact.phone}
                                                    </span>
                                                )}
                                            </div>
                                            {contact.position && (
                                                <p className="text-xs text-muted-foreground mt-1">{contact.position}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1 mr-4">
                                            {contact.notifyBilling && (
                                                <Badge variant="secondary" className="text-xs rounded-sm">
                                                    <Bell className="size-3 mr-1" />
                                                    Fact
                                                </Badge>
                                            )}
                                            {contact.notifyPayments && (
                                                <Badge variant="secondary" className="text-xs rounded-sm">
                                                    Pagos
                                                </Badge>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(contact)}>
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-red-500"
                                            onClick={() => setDeleteContactId(contact.id)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl rounded-sm">
                    <DialogHeader>
                        <DialogTitle>{editingContact ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
                        <DialogDescription>
                            {editingContact ? "Actualiza la información del contacto" : "Agrega un nuevo contacto para este cliente"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre *</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido *</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="h-10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile">Celular</Label>
                                <Input
                                    id="mobile"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position">Puesto</Label>
                            <Input
                                id="position"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-3 pt-2 border-t border-border">
                            <Label className="text-sm font-medium">Notificaciones</Label>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="notifyBilling"
                                        checked={formData.notifyBilling}
                                        onCheckedChange={(checked) => setFormData({ ...formData, notifyBilling: !!checked })}
                                    />
                                    <Label htmlFor="notifyBilling" className="text-sm font-normal">Facturación</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="notifyPayments"
                                        checked={formData.notifyPayments}
                                        onCheckedChange={(checked) => setFormData({ ...formData, notifyPayments: !!checked })}
                                    />
                                    <Label htmlFor="notifyPayments" className="text-sm font-normal">Pagos</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="notifyGeneral"
                                        checked={formData.notifyGeneral}
                                        onCheckedChange={(checked) => setFormData({ ...formData, notifyGeneral: !!checked })}
                                    />
                                    <Label htmlFor="notifyGeneral" className="text-sm font-normal">General</Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="isPrimary"
                                checked={formData.isPrimary}
                                onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: !!checked })}
                            />
                            <Label htmlFor="isPrimary" className="text-sm font-normal">Marcar como contacto principal</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-sm">
                                Cancelar
                            </Button>
                            <Button type="submit" className="rounded-sm" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingContact ? "Actualizar" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteContactId !== null} onOpenChange={() => setDeleteContactId(null)}>
                <AlertDialogContent className="rounded-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Contacto</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este contacto? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-sm">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteContactId && deleteMutation.mutate(deleteContactId)}
                            className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
