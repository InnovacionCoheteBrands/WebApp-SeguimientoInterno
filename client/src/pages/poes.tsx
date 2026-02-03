/**
 * POES Page - Standard Operating Procedures
 * Part of Cohete Brands Replica
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FileText,
    Plus,
    Folder,
    Download,
    Eye,
    MoreVertical,
    Trash2,
    Edit,
    Search,
    ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    fetchPoes,
    createPoe,
    updatePoe,
    deletePoe,
    type Poe,
} from "@/lib/api";
import { POE_CATEGORIES } from "@shared/schema";

export default function PoesPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch all POES
    const { data: poes = [], isLoading } = useQuery({
        queryKey: ["poes"],
        queryFn: fetchPoes,
    });

    // Filter POES
    const filteredPoes = poes.filter((poe) => {
        const matchesCategory = selectedCategory === "all" || poe.category === selectedCategory;
        const matchesSearch = poe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            poe.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Group by category for display
    const poesByCategory = POE_CATEGORIES.reduce((acc, category) => {
        acc[category] = filteredPoes.filter((poe) => poe.category === category);
        return acc;
    }, {} as Record<string, Poe[]>);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: createPoe,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["poes"] });
            setIsCreateDialogOpen(false);
            toast({ title: "POE creado", description: "El procedimiento ha sido agregado exitosamente" });
        },
        onError: () => {
            toast({ title: "Error", description: "No se pudo crear el POE", variant: "destructive" });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deletePoe,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["poes"] });
            toast({ title: "POE eliminado" });
        },
    });

    const handleCreatePoe = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get("title") as string,
            description: formData.get("description") as string || null,
            category: formData.get("category") as typeof POE_CATEGORIES[number],
            fileUrl: formData.get("fileUrl") as string || null,
            version: "1.0",
        };
        createMutation.mutate(data);
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "Operaciones": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "Ventas": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "Marketing": return "bg-pink-500/10 text-pink-500 border-pink-500/20";
            case "Finanzas": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "Recursos Humanos": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "Tecnología": return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
            case "Diseño": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            case "Atención al Cliente": return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">POES</h1>
                    <p className="text-muted-foreground">Procedimientos Operativos Estandarizados</p>
                </div>

                <div className="flex gap-2">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Nuevo POE
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Crear Nuevo POE</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreatePoe} className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Título *</Label>
                                    <Input id="title" name="title" required placeholder="Nombre del procedimiento" />
                                </div>
                                <div>
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea id="description" name="description" placeholder="Describe el procedimiento..." />
                                </div>
                                <div>
                                    <Label htmlFor="category">Categoría *</Label>
                                    <Select name="category" defaultValue="General">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {POE_CATEGORIES.map((category) => (
                                                <SelectItem key={category} value={category}>{category}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="fileUrl">URL del Documento</Label>
                                    <Input id="fileUrl" name="fileUrl" placeholder="https://drive.google.com/..." />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? "Creando..." : "Crear POE"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Buscar procedimientos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {POE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{poes.length}</p>
                                <p className="text-sm text-muted-foreground">Total POES</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Folder className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{POE_CATEGORIES.length}</p>
                                <p className="text-sm text-muted-foreground">Categorías</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* POES Grid */}
            {selectedCategory === "all" ? (
                // Show all categories
                POE_CATEGORIES.map((category) => {
                    const categoryPoes = poesByCategory[category];
                    if (!categoryPoes || categoryPoes.length === 0) return null;

                    return (
                        <div key={category} className="space-y-3">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Folder className="w-5 h-5" />
                                {category}
                                <Badge variant="secondary">{categoryPoes.length}</Badge>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categoryPoes.map((poe) => (
                                    <PoeCard key={poe.id} poe={poe} onDelete={() => deleteMutation.mutate(poe.id)} getCategoryColor={getCategoryColor} />
                                ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                // Show filtered category
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPoes.map((poe) => (
                        <PoeCard key={poe.id} poe={poe} onDelete={() => deleteMutation.mutate(poe.id)} getCategoryColor={getCategoryColor} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {filteredPoes.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay procedimientos</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? "No se encontraron resultados para tu búsqueda" : "Comienza creando tu primer POE"}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Crear POE
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// POE Card Component
function PoeCard({
    poe,
    onDelete,
    getCategoryColor
}: {
    poe: Poe;
    onDelete: () => void;
    getCategoryColor: (category: string) => string;
}) {
    return (
        <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-medium line-clamp-2">{poe.title}</h3>
                        <Badge variant="outline" className={`mt-2 ${getCategoryColor(poe.category)}`}>
                            {poe.category}
                        </Badge>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {poe.fileUrl && (
                                <DropdownMenuItem asChild>
                                    <a href={poe.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Ver Documento
                                    </a>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {poe.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{poe.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>v{poe.version}</span>
                    {poe.fileUrl && (
                        <a
                            href={poe.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                            <Eye className="w-3 h-3" />
                            Ver
                        </a>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
