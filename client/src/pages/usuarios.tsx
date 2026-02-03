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
                        className="max-w-[300px] bg-background border-border font-mono text-xs"
                    />
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> Invitar Usuario
                    </Button>
                </div>
            </div>

            <div className="bg-card/50 border border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border">
                            <TableHead className="font-mono text-[10px] uppercase text-muted-foreground">Usuario</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase text-muted-foreground">ID</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase text-muted-foreground text-center">Rol</TableHead>
                            <TableHead className="font-mono text-[10px] uppercase text-muted-foreground text-center">Estado</TableHead>
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
                                <TableRow key={user.id} className="border-border hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <UserIcon className="size-4 text-primary" />
                                            </div>
                                            <span className="font-medium text-foreground">{user.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                                        {user.id}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className={`font-mono text-[10px] uppercase border shadow-none ${user.role === "admin"
                                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
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
                                            className="font-mono text-[10px] uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        >
                                            Activo
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="hover:bg-muted">
                                                    <MoreVertical className="size-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border-border">
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
