import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MissionControl from "@/pages/dashboard";
import FleetTracking from "@/pages/fleet-tracking";
import DataCenter from "@/pages/data-center";
import Personnel from "@/pages/personnel";
import Analytics from "@/pages/analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MissionControl} />
      <Route path="/fleet-tracking" component={FleetTracking} />
      <Route path="/data-center" component={DataCenter} />
      <Route path="/personnel" component={Personnel} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
