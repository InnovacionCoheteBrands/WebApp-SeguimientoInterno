import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgentChat } from "@/components/agent-chat";

const NotFound = lazy(() => import("@/pages/not-found"));
const MissionControl = lazy(() => import("@/pages/dashboard"));
const FleetTracking = lazy(() => import("@/pages/fleet-tracking"));
const DataCenter = lazy(() => import("@/pages/data-center"));
const Personnel = lazy(() => import("@/pages/personnel"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Settings = lazy(() => import("@/pages/settings"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
          Loading Mission Control...
        </p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={MissionControl} />
        <Route path="/fleet-tracking" component={FleetTracking} />
        <Route path="/data-center" component={DataCenter} />
        <Route path="/personnel" component={Personnel} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <AgentChat />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
