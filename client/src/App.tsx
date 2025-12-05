import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/app-layout";

const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Clients = lazy(() => import("@/pages/fleet-tracking"));
const Projects = lazy(() => import("@/pages/proyectos"));
const Resources = lazy(() => import("@/pages/data-center"));
const Team = lazy(() => import("@/pages/personnel"));
const KPIs = lazy(() => import("@/pages/analytics"));
const AdsCommandCenter = lazy(() => import("@/pages/ads-command-center"));
const AdsSettings = lazy(() => import("@/pages/ads-settings"));
const Finanzas = lazy(() => import("@/pages/finanzas"));
const Profile = lazy(() => import("@/pages/profile"));
const Settings = lazy(() => import("@/pages/settings"));
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

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AppLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/clientes" component={Clients} />
          <Route path="/proyectos" component={Projects} />
          <Route path="/recursos" component={Resources} />
          <Route path="/equipo" component={Team} />
          <Route path="/kpis" component={KPIs} />
          <Route path="/ads" component={AdsCommandCenter} />
          <Route path="/ads/command-center" component={AdsCommandCenter} />
          <Route path="/ads/settings" component={AdsSettings} />
          <Route path="/finanzas" component={Finanzas} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <Suspense fallback={null}>
          <AgentChat />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
