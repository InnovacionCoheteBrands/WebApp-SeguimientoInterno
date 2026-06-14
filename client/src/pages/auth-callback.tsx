import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) {
      return;
    }
    processed.current = true;

    (async () => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          setLocation("/auth?error=OAuthSessionInitFailed");
          return;
        }

        const payload = await response.json();
        if (!payload?.token || !payload?.user) {
          setLocation("/auth?error=OAuthSessionInitFailed");
          return;
        }

        login(payload.token as string, payload.user as AuthUser);
        window.location.href = "/";
      } catch (error) {
        console.error("OAuth callback hydration failed", error);
        setLocation("/auth?error=OAuthSessionInitFailed");
      }
    })();
  }, [login, setLocation]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020202] relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_70%)]" />
      <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:40px_40px]" />

      <div className="relative z-10 w-full max-w-sm px-6">
        <Card className="bg-zinc-950/40 backdrop-blur-3xl border-white/10 ring-1 ring-white/5 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <CardContent className="p-12 text-center space-y-8">
            <div className="relative inline-flex items-center justify-center size-20">
              <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-[ping_3s_infinite]" />
              <div className="absolute inset-0 rounded-full border border-primary/30 animate-[spin_4s_linear_infinite]" />
              <Loader2 className="size-10 text-primary animate-spin" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-display italic text-white tracking-tight">Sincronizando acceso...</h2>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] font-bold">
                Estableciendo la conexion segura
              </p>
            </div>

            <div className="pt-4">
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite] w-1/3 shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em]">
            Redirigiendo al centro de mando // Espera un momento
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
