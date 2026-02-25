import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, User, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
    username: z.string().min(1, "El usuario es requerido"),
    password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            // Defensive check: ensure we received JSON, not HTML (server crash fallback)
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                throw new Error(
                    "El servidor no respondió correctamente. Verifica que el backend esté activo e intenta de nuevo."
                );
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Error al iniciar sesión");
            }

            // Use AuthContext login method instead of direct localStorage
            login(result.token, result.user);

            toast({
                title: "¡Bienvenido!",
                description: `Has iniciado sesión como ${result.user.username}`,
            });

            // Redirect to dashboard
            setLocation("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error de conexión");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
            <div className="absolute h-full w-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="mb-8 text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-display font-bold tracking-tight">Mission Control</h1>
                    <p className="text-muted-foreground">Sistema de Gestión Integral</p>
                </div>

                <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
                    <CardHeader>
                        <CardTitle>Iniciar Sesión</CardTitle>
                        <CardDescription>
                            Ingresa tus credenciales para acceder al sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Usuario</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="admin" className="pl-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contraseña</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input type="password" placeholder="••••••••" className="pl-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base font-medium"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Iniciando...
                                        </>
                                    ) : (
                                        "Ingresar"
                                    )}
                                </Button>

                            </form>
                        </Form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    O continúa con
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            type="button"
                            className="w-full h-11"
                            onClick={() => window.location.href = "/api/auth/google"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </Button>
                    </CardContent>
                    <CardFooter className="flex justify-center text-xs text-muted-foreground">
                        <p>Acceso restringido a personal autorizado</p>
                    </CardFooter>
                </Card>

                <div className="mt-8 text-center">
                    <p className="text-xs text-muted-foreground/50">
                        v1.0.0 • Secured with AES-256 & JWT
                    </p>
                </div>
            </div>
        </div >
    );
}
