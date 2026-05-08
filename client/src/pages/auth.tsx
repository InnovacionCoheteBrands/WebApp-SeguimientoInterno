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

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                throw new Error(
                    "Gateway Error: Authentication node unreachable. Verify infrastructure status."
                );
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Access Denied: Invalid Authorization Hash");
            }

            login(result.token, result.user);

            toast({
                title: "Authentication Successful",
                description: `Node connectivity established for ${result.user.username}`,
            });

            setLocation("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Handshake Failure: Connection Refused");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#020202] relative overflow-hidden font-sans selection:bg-primary/30">
            {/* Ethereal Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_70%)]" />
            <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:40px_40px]" />
            
            {/* Animated Scanner Beam */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent absolute top-0 animate-[scanner_8s_ease-in-out_infinite]" />
            </div>

            <div className="relative z-10 w-full max-w-[440px] px-6">
                <div className="mb-12 text-center space-y-4">
                    <div className="inline-flex items-center justify-center size-20 rounded-[2rem] bg-white/[0.03] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-4 ring-1 ring-white/5 relative group">
                        <div className="absolute inset-0 rounded-[2rem] bg-primary/20 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
                        <ShieldCheck className="size-10 text-primary relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-display italic font-bold tracking-tighter text-white mb-1">
                            Mission Control
                        </h1>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.5em] font-bold pl-1">
                            Secure Access Terminal v2.0
                        </p>
                    </div>
                </div>

                <Card className="bg-zinc-950/40 backdrop-blur-3xl border-white/10 ring-1 ring-white/5 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    <CardHeader className="pt-10 pb-6 text-center">
                        <CardTitle className="text-xl font-display italic text-white tracking-tight">Initiate Handshake</CardTitle>
                        <CardDescription className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-2">
                            Provide Authorization Credentials
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-10 pb-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {error && (
                                    <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-400 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                                        <AlertCircle className="size-4" />
                                        <AlertDescription className="text-[11px] font-mono uppercase font-bold tracking-wide ml-2">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                        <User className="size-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                                    </div>
                                                    <FormControl>
                                                        <Input 
                                                            placeholder="OPERATOR_ID" 
                                                            className="h-14 pl-12 rounded-2xl bg-white/[0.03] border-white/5 text-white font-mono text-xs placeholder:text-zinc-600 focus:bg-white/[0.05] focus:border-white/10 focus:ring-primary/20 transition-all" 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage className="text-[10px] font-mono text-rose-400 pl-4 uppercase" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                        <Lock className="size-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                                                    </div>
                                                    <FormControl>
                                                        <Input 
                                                            type="password" 
                                                            placeholder="ENCRYPTION_HASH" 
                                                            className="h-14 pl-12 rounded-2xl bg-white/[0.03] border-white/5 text-white font-mono text-xs placeholder:text-zinc-600 focus:bg-white/[0.05] focus:border-white/10 focus:ring-primary/20 transition-all" 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage className="text-[10px] font-mono text-rose-400 pl-4 uppercase" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-2xl bg-primary text-black font-mono font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(var(--primary),0.2)] disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="size-4 animate-spin" />
                                            Encrypting...
                                        </div>
                                    ) : (
                                        "Authenticate Node"
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <div className="relative my-10">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/5" />
                            </div>
                            <div className="relative flex justify-center text-[9px] font-mono uppercase tracking-[0.3em] font-bold">
                                <span className="bg-zinc-950 px-4 text-zinc-500">
                                    Alternative Sync
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            type="button"
                            className="w-full h-14 rounded-2xl bg-white/5 border-white/10 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all font-bold"
                            onClick={() => window.location.href = "/api/auth/google"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 mr-3 grayscale group-hover:grayscale-0 transition-all">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google_Oauth_Node
                        </Button>
                    </CardContent>
                    
                    <CardFooter className="px-10 pb-10 flex justify-center border-t border-white/5 bg-white/[0.01]">
                        <p className="text-[9px] font-mono uppercase tracking-[0.3em] font-normal text-zinc-600">
                            Authorized Personnel Only // Restricted Access
                        </p>
                    </CardFooter>
                </Card>

                <div className="mt-12 text-center flex items-center justify-center gap-4 opacity-30 group hover:opacity-100 transition-opacity duration-700">
                    <div className="h-[1px] w-8 bg-zinc-800" />
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.4em] font-bold">
                        Encrypted_TLS_1.3 // AES-256_JWT
                    </p>
                    <div className="h-[1px] w-8 bg-zinc-800" />
                </div>
            </div>

            <style>{`
                @keyframes scanner {
                    0% { transform: translateY(0); opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
            `}</style>
        </div >
    );
}
