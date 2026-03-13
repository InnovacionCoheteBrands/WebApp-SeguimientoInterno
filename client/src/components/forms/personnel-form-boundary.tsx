import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";

interface PersonnelFormBoundaryProps {
    children: ReactNode;
}

export function PersonnelFormBoundary({ children }: PersonnelFormBoundaryProps) {
    return (
        <ErrorBoundary
            fallback={
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-foreground">
                                No se pudo cargar el componente
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                El formulario de personal fallo al renderizarse. Puedes cerrar y volver
                                a abrir esta ventana mientras el resto de la interfaz sigue operando.
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}