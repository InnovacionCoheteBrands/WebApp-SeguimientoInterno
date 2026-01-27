import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { ErrorBoundary } from "@/components/error-boundary";

const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Clients = lazy(() => import("@/pages/fleet-tracking"));
const ClientDetail = lazy(() => import("@/pages/client-detail"));
const Projects = lazy(() => import("@/pages/proyectos"));
const ProjectDetail = lazy(() => import("@/pages/project-detail"));
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

function ProtectedRoute({ component: Component, ...rest }: any) {
  const token = localStorage.getItem("token");
  // Simple check - in production use a real auth context
  if (!token) return <AuthPage />;
  return <Component {...rest} />;
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public Route */}
        <Route path="/auth" component={AuthPage} />

        {/* Protected Routes */}
        <Route path="/:rest*">
          <AppLayout>
            <Switch>
              <Route path="/" component={(props) => <ProtectedRoute component={Dashboard} {...props} />} />
              <Route path="/clientes" component={(props) => <ProtectedRoute component={Clients} {...props} />} />
              <Route path="/clientes/:id" component={(props) => <ProtectedRoute component={ClientDetail} {...props} />} />
              <Route path="/proyectos" component={(props) => <ProtectedRoute component={Projects} {...props} />} />
              <Route path="/proyectos/:id" component={(props) => <ProtectedRoute component={ProjectDetail} {...props} />} />
              <Route path="/recursos" component={(props) => <ProtectedRoute component={Resources} {...props} />} />
              <Route path="/equipo" component={(props) => <ProtectedRoute component={Team} {...props} />} />
              <Route path="/kpis" component={(props) => <ProtectedRoute component={KPIs} {...props} />} />
              <Route path="/ads" component={(props) => <ProtectedRoute component={AdsCommandCenter} {...props} />} />
              <Route path="/ads/command-center" component={(props) => <ProtectedRoute component={AdsCommandCenter} {...props} />} />
              <Route path="/ads/settings" component={(props) => <ProtectedRoute component={AdsSettings} {...props} />} />
              <Route path="/digital-assets" component={(props) => <ProtectedRoute component={DigitalAssets} {...props} />} />
              <Route path="/finanzas" component={(props) => <ProtectedRoute component={Finanzas} {...props} />} />
              <Route path="/profile" component={(props) => <ProtectedRoute component={Profile} {...props} />} />
              <Route path="/settings" component={(props) => <ProtectedRoute component={Settings} {...props} />} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
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
          <TooltipProvider>
            <Toaster />
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
            <Suspense fallback={null}>
              <AgentChat />
            </Suspense>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
