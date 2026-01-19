import { useState } from "react";
import { Plus, Trash2, FolderOpen, File, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientDocuments, createClientDocument, deleteClientDocument } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ClientDocument, InsertClientDocument } from "@shared/schema";

interface DocumentsTabProps {
    clientId: number;
}

export function DocumentsTab({ clientId }: DocumentsTabProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: documents = [], isLoading } = useQuery({
        queryKey: ["client-documents", clientId],
        queryFn: () => fetchClientDocuments(clientId),
    });

    const [formData, setFormData] = useState({
        name: "",
        documentType: "other",
        fileUrl: "",
        fileSize: 0,
        mimeType: "application/pdf",
    });

    const createMutation = useMutation({
        mutationFn: createClientDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Éxito", description: "Documento agregado" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteClientDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
            setDeleteDocId(null);
            toast({ title: "Éxito", description: "Documento eliminado" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const resetForm = () => {
        setFormData({
            name: "",
            documentType: "other",
            fileUrl: "",
            fileSize: 0,
            mimeType: "application/pdf",
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.fileUrl) {
            toast({ title: "Error", description: "Nombre y URL del archivo son requeridos", variant: "destructive" });
            return;
        }

        createMutation.mutate({
            ...formData,
            clientId,
            uploadedAt: new Date(),
        } as InsertClientDocument);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "contract": return <FileText className="size-5 text-blue-500" />;
            case "invoice": return <FileText className="size-5 text-green-500" />;
            case "brief": return <FileText className="size-5 text-purple-500" />;
            case "assets": return <FolderOpen className="size-5 text-orange-500" />;
            default: return <File className="size-5" />;
        }
    };

    const getFormattedSize = (bytes?: number | null) => {
        if (!bytes) return "Unknown size";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <>
            <Card className="rounded-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Documentos</CardTitle>
                    <Button onClick={() => setIsDialogOpen(true)} className="rounded-sm" size="sm">
                        <Plus className="size-4 mr-2" />
                        Agregar Documento
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground">Cargando...</p>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8">
                            <FolderOpen className="size-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay documentos cargados</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-4 border border-border rounded-sm bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            {getIcon(doc.documentType)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium hover:underline cursor-pointer" onClick={() => window.open(doc.fileUrl, '_blank')}>
                                                    {doc.name}
                                                </p>
                                                <Badge variant="outline" className="text-[10px] uppercase rounded-sm">
                                                    {doc.documentType}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                <span>{format(new Date(doc.uploadedAt), "dd/MM/yyyy")}</span>
                                                <span>•</span>
                                                <span>{getFormattedSize(doc.fileSize)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => window.open(doc.fileUrl, '_blank')}>
                                            <Download className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-red-500"
                                            onClick={() => setDeleteDocId(doc.id)}
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

            {/* Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-xl rounded-sm">
                    <DialogHeader>
                        <DialogTitle>Agregar Documento</DialogTitle>
                        <DialogDescription>
                            Sube enlaces a documentos importantes del cliente
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Archivo *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="ej. Contrato de Servicios 2025"
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo *</Label>
                            <Select value={formData.documentType} onValueChange={(value) => setFormData({ ...formData, documentType: value })}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="contract">Contrato</SelectItem>
                                    <SelectItem value="invoice">Factura/Fiscal</SelectItem>
                                    <SelectItem value="brief">Brief/Requerimientos</SelectItem>
                                    <SelectItem value="assets">Assets de Marca</SelectItem>
                                    <SelectItem value="other">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url">URL del Archivo *</Label>
                            <Input
                                id="url"
                                value={formData.fileUrl}
                                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                                placeholder="https://..."
                                className="h-10"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-sm">
                                Cancelar
                            </Button>
                            <Button type="submit" className="rounded-sm" disabled={createMutation.isPending}>
                                Agregar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDocId !== null} onOpenChange={() => setDeleteDocId(null)}>
                <AlertDialogContent className="rounded-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Documento</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este documento?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-sm">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteDocId && deleteMutation.mutate(deleteDocId)}
                            className="rounded-sm bg-destructive text-destructive-foreground"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
