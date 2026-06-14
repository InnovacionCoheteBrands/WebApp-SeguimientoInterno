import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-50" />
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 rounded-sm bg-red-500/10 border border-red-500/20 w-fit mb-4">
            <AlertTriangle className="size-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-display uppercase tracking-tight text-foreground">
            404 - Recurso no disponible
          </CardTitle>
          <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            La ruta solicitada no existe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-sm text-muted-foreground font-mono leading-relaxed">
            La seccion solicitada esta fuera del mapa operativo.
            Vuelve al panel principal para continuar.
          </p>

          <Link href="/">
            <Button className="w-full gap-2 rounded-sm" variant="default">
              <Home className="size-4" />
              Volver al inicio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
