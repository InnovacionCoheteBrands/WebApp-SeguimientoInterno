import React, { Suspense, lazy } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Clients = lazy(() => import("@/pages/fleet-tracking"));
const ClientDetail = lazy(() => import("@/pages/client-detail"));
const Projects = lazy(() => import("@/pages/proyectos"));
const ProjectDetail = lazy(() => import("@/pages/project-detail"));
const ProyectosTest = lazy(() => import("@/pages/proyectos-test"));
const Resources = lazy(() => import("@/pages/data-center"));
const Team = lazy(() => import("@/pages/personnel"));
const KPIs = lazy(() => import("@/pages/analytics"));
const AdsCommandCenter = lazy(() => import("@/pages/ads-command-center"));
const AdsSettings = lazy(() => import("@/pages/ads-settings"));
const DigitalAssets = lazy(() => import("@/pages/digital-assets-page"));
const Finanzas = lazy(() => import("@/pages/finanzas"));
const Profile = lazy(() => import("@/pages/profile"));
const Settings = lazy(() => import("@/pages/settings"));
const AuthPage = lazy(() => import("@/pages/auth"));
const AgentChat = lazy(() => import("@/components/agent-chat").then(m => ({ default: m.AgentChat })));
// Cohete Replica Pages
const LeadsControl = lazy(() => import("@/pages/leads-control"));
const Poes = lazy(() => import("@/pages/poes"));
const PaymentCalendar = lazy(() => import("@/pages/payment-calendar"));
const ControlProyectos = lazy(() => import("@/pages/control-proyectos"));
const Usuarios = lazy(() => import("@/pages/usuarios"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
          Cargando...
        </p>
      </div>
    </div>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect unauthenticated users
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/auth');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    // Return loading while redirect happens
    return <LoadingFallback />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public Route */}
        <Route path="/auth" component={AuthPage} />

        {/* Protected Routes - use /* to match all including root */}
        <Route>
          <ProtectedLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/clientes" component={Clients} />
              <Route path="/clientes/:id" component={ClientDetail} />
              <Route path="/proyectos" component={Projects} />
              <Route path="/proyectos-test" component={ProyectosTest} />
              <Route path="/proyectos/:id" component={ProjectDetail} />
              <Route path="/recursos" component={Resources} />
              <Route path="/equipo" component={Team} />
              <Route path="/kpis" component={KPIs} />
              <Route path="/ads" component={AdsCommandCenter} />
              <Route path="/ads/command-center" component={AdsCommandCenter} />
              <Route path="/ads/settings" component={AdsSettings} />
              <Route path="/digital-assets" component={DigitalAssets} />
              <Route path="/finanzas" component={Finanzas} />
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
              {/* Cohete Replica Routes */}
              <Route path="/leads" component={LeadsControl} />
              <Route path="/poes" component={Poes} />
              <Route path="/calendario-pagos" component={PaymentCalendar} />
              <Route path="/control-proyectos" component={ControlProyectos} />
              <Route path="/usuarios" component={Usuarios} />
              <Route component={NotFound} />
            </Switch>
          </ProtectedLayout>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <LanguageProvider defaultLanguage="en" storageKey="app-language">
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <ErrorBoundary>
                <Router />
              </ErrorBoundary>
              <Suspense fallback={null}>
                <AgentChat />
              </Suspense>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
