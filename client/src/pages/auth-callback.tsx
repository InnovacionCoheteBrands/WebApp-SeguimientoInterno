import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
    const [, setLocation] = useLocation();
    const { login } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        // Prevent double-processing in StrictMode
        if (processed.current) return;
        processed.current = true;

        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token");
        const refreshToken = searchParams.get("refreshToken");
        const userStr = searchParams.get("user");
        const error = searchParams.get("error");

        if (error) {
            setLocation(`/auth?error=${encodeURIComponent(error)}`);
            return;
        }

        if (token && userStr) {
            try {
                const user: AuthUser = JSON.parse(decodeURIComponent(userStr));

                // Save token to localStorage FIRST (so API calls can use it immediately)
                localStorage.setItem('token', token);
                if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));

                // Then update React state
                login(token, user, refreshToken || undefined);

                // Small delay to let React state propagate before redirect
                // This prevents the race condition where dashboard components
                // make API calls before the auth state is updated
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
            } catch (err) {
                console.error("Failed to parse user data", err);
                setLocation("/auth?error=InvalidUserData");
            }
        } else {
            setLocation("/auth?error=MissingAuthData");
        }
    }, [login, setLocation]);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <h2 className="text-xl font-semibold">Autenticando...</h2>
                <p className="text-muted-foreground">Por favor espera mientras verificamos tus datos.</p>
            </div>
        </div>
    );
}
