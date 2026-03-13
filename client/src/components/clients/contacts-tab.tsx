import { useState } from "react";
import { Plus, Pencil, Trash2, User, Mail, Phone, Bell, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <div className="space-y-6">
            <div className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />
                <div className="flex items-center justify-between p-8 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-2xl bg-primary/10 border border-white/10 text-primary">
                            <User className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-display uppercase tracking-tight text-zinc-100 italic">Personnel Directory</h3>
                            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest opacity-60 italic">Managed Entity Contacts</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => handleOpenDialog()} 
                        className="h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-mono text-[10px] uppercase tracking-widest px-6"
                    >
                        <Plus className="size-3.5 mr-2" />
                        Initialize Resource
                    </Button>
                </div>
                <div className="p-8">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)}
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="size-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                                <User className="size-8 text-zinc-600 opacity-20" />
                            </div>
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-40 italic">No registered personnel detected.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="flex items-center justify-between p-6 bg-zinc-950/20 border border-white/5 rounded-3xl hover:bg-white/5 hover:border-white/10 transition-all duration-300 group/item"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="size-12 rounded-2xl bg-zinc-900 border border-white/5 shadow-inner flex items-center justify-center">
                                            <User className="size-6 text-zinc-500 group-hover/item:text-primary transition-colors duration-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-display text-zinc-100 text-lg italic tracking-tight">
                                                    {contact.firstName} {contact.lastName}
                                                </p>
                                                {contact.isPrimary && (
                                                    <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-full h-5 px-3 text-[9px] font-mono font-bold uppercase tracking-widest">
                                                        Principal
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-60 group-hover/item:opacity-100 transition-opacity">
                                                    <Mail className="size-3 opacity-40" />
                                                    {contact.email}
                                                </div>
                                                {contact.phone && (
                                                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-60 group-hover/item:opacity-100 transition-opacity">
                                                        <Phone className="size-3 opacity-40" />
                                                        {contact.phone}
                                                    </div>
                                                )}
                                            </div>
                                            {contact.position && (
                                                <p className="text-[9px] font-mono text-primary/60 uppercase tracking-[0.2em] mt-2 italic">{contact.position}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex gap-2">
                                            {contact.notifyBilling && (
                                                <div className="p-1 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                                                    <Bell className="size-2.5" />
                                                    Fiscal
                                                </div>
                                            )}
                                            {contact.notifyPayments && (
                                                <div className="p-1 px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                                                    Payments
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-20 group-hover/item:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(contact)} className="h-9 w-9 rounded-full hover:bg-white/10">
                                                <Pencil className="size-4 text-zinc-400" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                                                onClick={() => setDeleteContactId(contact.id)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl bg-[#030303]/95 backdrop-blur-2xl border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <DialogHeader className="space-y-4">
                        <DialogTitle className="text-2xl font-display text-white italic tracking-tight">
                            {editingContact ? "Modify Personnel Data" : "Initiate Resource"}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-60">
                            Managed Contact Configuration Protocol
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-8 mt-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-display italic"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-display italic"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Email Endpoint</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Office Line</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Mobile Secure</Label>
                                <Input
                                    id="mobile"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-1">Strategic Position</Label>
                            <Input
                                id="position"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-display italic"
                            />
                        </div>

                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary italic">Notification Protocols</Label>
                                <Badge variant="outline" className="text-[8px] border-white/10 text-zinc-500 uppercase tracking-widest">Active Monitoring</Badge>
                            </div>
                            <div className="flex flex-wrap gap-8">
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="notifyBilling"
                                        checked={formData.notifyBilling}
                                        onCheckedChange={(checked) => setFormData({ ...formData, notifyBilling: !!checked })}
                                        className="rounded-md border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Label htmlFor="notifyBilling" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Fiscal / Billing</Label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="notifyPayments"
                                        checked={formData.notifyPayments}
                                        onCheckedChange={(checked) => setFormData({ ...formData, notifyPayments: !!checked })}
                                        className="rounded-md border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Label htmlFor="notifyPayments" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Payments</Label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="notifyGeneral"
                                        checked={formData.notifyGeneral}
                                        onCheckedChange={(checked) => setFormData({ ...formData, notifyGeneral: !!checked })}
                                        className="rounded-md border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Label htmlFor="notifyGeneral" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">General</Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                            <Checkbox
                                id="isPrimary"
                                checked={formData.isPrimary}
                                onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: !!checked })}
                                className="rounded-md border-primary/30 data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor="isPrimary" className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">Designate Principal Authority</Label>
                        </div>

                        <DialogFooter className="pt-4 border-t border-white/10">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-full h-10 px-6 font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white">
                                Abort
                            </Button>
                            <Button type="submit" className="rounded-full h-10 px-8 bg-primary text-black font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)]" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingContact ? "Overwrite" : "Authorize"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteContactId !== null} onOpenChange={() => setDeleteContactId(null)}>
                <AlertDialogContent className="bg-[#030303]/95 backdrop-blur-2xl border-white/10 rounded-[2.5rem]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display italic text-white">Decommission Resource</AlertDialogTitle>
                        <AlertDialogDescription className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                            Warning: This operation will permanently remove the personnel record from active database nodes. This action is irreversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-full h-10 px-6 font-mono text-[10px] uppercase tracking-widest border-white/10 bg-white/5 text-zinc-400">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteContactId && deleteMutation.mutate(deleteContactId)}
                            className="rounded-full h-10 px-8 bg-red-500 text-white font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        >
                            Execute
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
