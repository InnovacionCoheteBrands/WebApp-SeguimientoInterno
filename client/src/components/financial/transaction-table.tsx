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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreVertical, FileText } from "lucide-react";
import { type Transaction } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/format-currency";

interface TransactionTableProps {
    data: Transaction[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: number) => void;
    showProvider?: boolean; // Show provider column (for Egresos)
    showClient?: boolean; // Show client column (for Ingresos)
}

export function TransactionTable({ data, onEdit, onDelete, showProvider, showClient }: TransactionTableProps) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                <FileText className="h-10 w-10 mb-2 opacity-50" />
                <p>No hay transacciones registradas.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-border">
            <Table>
                <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="w-[120px]">Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Categoría</TableHead>
                        {showClient && <TableHead>Cliente</TableHead>}
                        {showProvider && <TableHead>Proveedor</TableHead>}
                        <TableHead className="text-right">RFC / Folio</TableHead>
                        <TableHead className="w-[100px]">Estado</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((transaction) => (
                        <TableRow key={transaction.id} className="border-border hover:bg-muted/50">
                            <TableCell className="font-mono text-xs text-muted-foreground">
                                {format(new Date(transaction.date), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                                {transaction.description || "—"}
                                {transaction.notes && (
                                    <span className="block text-[10px] text-muted-foreground truncate max-w-[200px]">{transaction.notes}</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-xs border-border text-muted-foreground font-normal">
                                    {transaction.category}
                                </Badge>
                            </TableCell>

                            {showClient && (
                                <TableCell className="text-foreground/80">
                                    {/* Note: In a real app we might need to join/fetch client name if relatedClient/clientId is just ID. 
                          Currently transactions has clientId but we might need to rely on what logic? 
                          If finanzas.tsx fetches transactions with client relation, we can display it. 
                          But typically fetchTransactions just returns the table row.
                          Let's assume we might show the raw text relativeClient if legacy, or look it up if we have the context.
                          For now, display raw relatedClient or simply "ID: " + clientId if simple. 
                          Refinement: We might need to fetch clients and map 
                          OR assume 'relatedClient' field still holds name logic or we updated storage to return joined data? 
                          Storage implementation: createTransaction logic uses clientId.
                          Let's use a simpler approach: allow passing a client map or just display ID for now?
                          Revisiting storage.ts: getTransactions simply selects from transactions. It does NOT join.
                          However, relatedClient text field exists.
                          */}
                                    {transaction.relatedClient || (transaction.clientId ? `Client #${transaction.clientId}` : "—")}
                                </TableCell>
                            )}

                            {showProvider && (
                                <TableCell className="text-foreground/80">{transaction.provider || "—"}</TableCell>
                            )}

                            <TableCell className="text-right text-xs font-mono text-muted-foreground">
                                {transaction.rfc && <span className="block">{transaction.rfc}</span>}
                                {transaction.invoiceNumber && <span className="text-muted-foreground/60">#{transaction.invoiceNumber}</span>}
                            </TableCell>

                            <TableCell>
                                <Badge
                                    className={`text-[10px] uppercase tracking-wider rounded-sm
                        ${transaction.isPaid
                                            ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                            : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"}
                    `}
                                >
                                    {transaction.isPaid ? "Pagado" : "Pendiente"}
                                </Badge>
                            </TableCell>

                            <TableCell className="text-right font-mono font-medium">
                                {formatCurrency(Number(transaction.amount))}
                            </TableCell>

                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-card border-border">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => onEdit(transaction)}
                                            className="text-foreground/80 focus:text-foreground focus:bg-muted cursor-pointer"
                                        >
                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDelete(transaction.id)}
                                            className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
