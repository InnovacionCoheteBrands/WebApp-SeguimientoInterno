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
const DigitalAssets = lazy(() => import("@/pages/digital-assets-page"));
const Finanzas = lazy(() => import("@/pages/finanzas"));
const Profile = lazy(() => import("@/pages/profile"));
const Settings = lazy(() => import("@/pages/settings"));
const AuthPage = lazy(() => import("@/pages/auth"));
const AuthCallbackPage = lazy(() => import("@/pages/auth-callback"));
const AgentChat = lazy(() => import("@/components/agent-chat").then(m => ({ default: m.AgentChat })));
// Cohete Replica Pages
const LeadsControl = lazy(() => import("@/pages/leads-control"));
const Poes = lazy(() => import("@/pages/poes"));
const PaymentCalendar = lazy(() => import("@/pages/payment-calendar"));
const ControlProyectos = lazy(() => import("@/pages/control-proyectos"));
const Usuarios = lazy(() => import("@/pages/usuarios"));
const Suppliers = lazy(() => import("@/pages/suppliers"));
const Services = lazy(() => import("@/pages/services"));
const ActivityLog = lazy(() => import("@/pages/activity-log"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/20 via-background to-background">
      <div className="text-center space-y-4 relative z-10">
        <div className="size-12 border-4 border-primary/50 border-t-primary rounded-full animate-spin mx-auto shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)]" />
        <p className="text-sm text-muted-foreground font-display font-bold tracking-widest animate-pulse">
          Accediendo a Mission Control...
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
        <Route path="/auth/callback" component={AuthCallbackPage} />

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
              <Route path="/digital-assets" component={DigitalAssets} />
              <Route path="/finanzas" component={Finanzas} />
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
              {/* Cohete Replica Routes */}
              <Route path="/crm" component={LeadsControl} />
              <Route path="/leads" component={() => <Redirect to="/crm" />} />
              <Route path="/poes" component={Poes} />
              <Route path="/calendario-pagos" component={PaymentCalendar} />
              <Route path="/control-proyectos" component={ControlProyectos} />
              <Route path="/usuarios" component={Usuarios} />
              <Route path="/proveedores" component={Suppliers} />
              <Route path="/servicios" component={Services} />
              <Route path="/actividad" component={ActivityLog} />
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
