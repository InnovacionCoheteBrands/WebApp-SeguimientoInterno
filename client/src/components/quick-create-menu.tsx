import { useState } from "react";
import {
    Plus,
    UserPlus,
    Briefcase,
    DollarSign,
    Users,
    FileText,
    ChevronRight
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LeadForm } from "@/components/forms/lead-form";
import { ProjectForm } from "@/components/forms/project-form";
import { PersonnelForm } from "@/components/forms/personnel-form";
import { TransactionForm } from "@/components/financial/transaction-form";

export function QuickCreateMenu() {
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const menuItems = [
        { id: "lead", label: "Nuevo Lead", icon: UserPlus, color: "text-blue-500", bgColor: "bg-blue-50" },
        { id: "project", label: "Nuevo Proyecto", icon: Briefcase, color: "text-purple-500", bgColor: "bg-purple-50" },
        { id: "transaction", label: "Nueva Transacción", icon: DollarSign, color: "text-green-500", bgColor: "bg-green-50" },
        { id: "personnel", label: "Nuevo Talento", icon: Users, color: "text-orange-500", bgColor: "bg-orange-50" },
        { id: "note", label: "Nueva Nota", icon: FileText, color: "text-slate-500", bgColor: "bg-slate-50" },
    ];

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="icon"
                        className="h-10 w-10 rounded-full bg-primary shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                        <Plus className="h-6 w-6 text-primary-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-border shadow-2xl backdrop-blur-md bg-card/95">
                    <DropdownMenuLabel className="px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        Acciones Rápidas
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {menuItems.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer focus:bg-accent group transition-all"
                            onClick={() => setActiveModal(item.id)}
                        >
                            <div className={`p-2 rounded-md ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform`}>
                                <item.icon className="h-4 w-4" />
                            </div>
                            <span className="flex-1 font-medium text-sm">{item.label}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Modals */}
            <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="sm:max-w-2xl rounded-sm">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            {activeModal === 'lead' && <UserPlus className="h-5 w-5 text-blue-500" />}
                            {activeModal === 'project' && <Briefcase className="h-5 w-5 text-purple-500" />}
                            {activeModal === 'transaction' && <DollarSign className="h-5 w-5 text-green-500" />}
                            {activeModal === 'personnel' && <Users className="h-5 w-5 text-orange-500" />}
                            {activeModal === 'note' && <FileText className="h-5 w-5 text-slate-500" />}
                            {activeModal === 'lead' && "Crear Nuevo Lead"}
                            {activeModal === 'project' && "Crear Nuevo Proyecto"}
                            {activeModal === 'transaction' && "Registrar Transacción"}
                            {activeModal === 'personnel' && "Onboarding de Talento"}
                            {activeModal === 'note' && "Nueva Nota Rápida"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6">
                        {activeModal === 'lead' && (
                            <LeadForm
                                open={activeModal === 'lead'}
                                onOpenChange={(open) => !open && setActiveModal(null)}
                            />
                        )}
                        {activeModal === 'project' && (
                            <ProjectForm
                                open={activeModal === 'project'}
                                onOpenChange={(open) => !open && setActiveModal(null)}
                            />
                        )}
                        {activeModal === 'personnel' && (
                            <PersonnelForm
                                open={activeModal === 'personnel'}
                                onOpenChange={(open) => !open && setActiveModal(null)}
                            />
                        )}
                        {activeModal === 'transaction' && (
                            <TransactionForm
                                open={activeModal === 'transaction'}
                                onOpenChange={(open) => !open && setActiveModal(null)}
                            />
                        )}
                        {activeModal === 'note' && (
                            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-md">
                                <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p>Módulo de notas en desarrollo...</p>
                                <Button className="mt-4" onClick={() => setActiveModal(null)}>Cerrar</Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
