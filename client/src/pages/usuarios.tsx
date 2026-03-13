import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Shield,
    User as UserIcon,
    MoreVertical,
    Trash2,
    ShieldCheck,
    ShieldAlert,
    Plus,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function Usuarios() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    const { data: users = [], isLoading } = useQuery<Omit<User, "password">[]>({
        queryKey: ["/api/users"],
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; role?: string; password?: string }) => {
            const { id, ...rest } = data;
            const res = await apiRequest("PATCH", `/api/users/${id}`, rest);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({ title: "Usuario actualizado", description: "Los cambios se guardaron correctamente." });
            setIsEditDialogOpen(false);
        },
        onError: (error) => {
            toast({ title: "Error", description: "No se pudo actualizar el usuario.", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({ title: "Usuario eliminado" });
            setIsDeleteDialogOpen(false);
        },
        onError: (error: any) => {
            const message = error.message || "No se pudo eliminar el usuario.";
            toast({ title: "Error", description: message, variant: "destructive" });
        },
    });

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (user: Omit<User, "password">) => {
        setSelectedUser(user);
        setIsEditDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setUserToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (userToDelete) deleteMutation.mutate(userToDelete);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold tracking-tight text-foreground mb-1">
                        Gestión de Usuarios
                    </h2>
                    <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                        Administra el acceso y roles de los miembros de la plataforma.
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Input
                        placeholder="Buscar usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-[300px] bg-white/5 border-white/15 focus:border-white/30 font-mono text-xs transition-all h-10 rounded-full"
                    />
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-10 px-6 font-mono text-xs uppercase tracking-wider">
                        <Plus className="mr-2 h-4 w-4" /> Invitar Usuario
                    </Button>
                </div>
            </div>

            <div className="bg-zinc-950/40 backdrop-blur-xl border-white/15 ring-1 ring-inset ring-white/10 rounded-[2rem] overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="font-mono text-[10px] uppercase text-muted-foreground/80 pl-6">Usuario</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase text-muted-foreground/80">ID</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase text-muted-foreground/80 text-center">Rol</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase text-muted-foreground/80 text-center">Estado</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 font-mono text-xs text-muted-foreground">
                                    Cargando usuarios...
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 font-mono text-xs text-muted-foreground italic">
                                    No se encontraron usuarios.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                                                <UserIcon className="size-4 text-zinc-400" />
                                            </div>
                                            <span className="font-medium text-zinc-100">{user.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                                        {user.id}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className={`font-mono text-[9px] uppercase border shadow-none rounded-full px-2 py-0.5 ${user.role === "admin"
                                                    ? "bg-primary/10 text-primary border-primary/20"
                                                    : "bg-zinc-500/10 text-zinc-400 border-white/10"
                                                }`}
                                        >
                                            {user.role === "admin" ? (
                                                <ShieldCheck className="mr-1 h-3 w-3" />
                                            ) : (
                                                <Shield className="mr-1 h-3 w-3" />
                                            )}
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className="font-mono text-[9px] uppercase bg-zinc-500/10 text-zinc-400 border-white/10 rounded-full px-2 py-0.5"
                                        >
                                            Activo
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full h-8 w-8">
                                                    <MoreVertical className="size-4 text-muted-foreground opacity-60" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-zinc-950 border-white/15">
                                                <DropdownMenuLabel className="font-mono text-[10px] uppercase text-muted-foreground">Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                    Editar Usuario
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border" />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-rose-400 focus:text-rose-400"
                                                >
                                                    <Trash2 className="mr-2 size-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-card border-border sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Modifica el rol o actualiza la contraseña para <strong>{selectedUser?.username}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-muted-foreground uppercase text-[10px] font-mono">Rol de Sistema</Label>
                            <Select
                                value={selectedUser?.role}
                                onValueChange={(val) => setSelectedUser(prev => prev ? { ...prev, role: val } : null)}
                            >
                                <SelectTrigger id="role" className="bg-background border-border">
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">Colaborador (User)</SelectItem>
                                    <SelectItem value="admin">Administrador (Admin)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pass" className="text-muted-foreground uppercase text-[10px] font-mono">Nueva Contraseña (Opcional)</Label>
                            <Input
                                id="pass"
                                type="password"
                                placeholder="Dejar en blanco para no cambiar"
                                className="bg-background border-border font-mono text-xs"
                                onChange={(e) => setSelectedUser(prev => prev ? { ...prev, password: e.target.value } : null)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border bg-transparent hover:bg-muted font-mono text-xs">
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => selectedUser?.id && updateMutation.mutate({
                                id: selectedUser.id,
                                role: selectedUser.role,
                                password: (selectedUser as any).password || undefined
                            })}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase"
                            disabled={updateMutation.isPending}
                        >
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es irreversible. Se eliminarán todos los permisos de acceso para este usuario.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border bg-transparent hover:bg-muted font-mono text-xs">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs uppercase"
                            disabled={deleteMutation.isPending}
                        >
                            Eliminar Permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
