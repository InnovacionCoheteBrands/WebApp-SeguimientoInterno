import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  TrendingUp,
  Settings,
  Target,
  DollarSign,
  Globe,
  FileText,
  CalendarDays,
  BarChart3,
  Shield,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import logoUrl from "@assets/Logo Cohete Brands_1763657286156.png";
import { useQuery } from "@tanstack/react-query";
import { fetchCampaigns } from "@/lib/api";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { QuickCreateMenu } from "@/components/quick-create-menu";

interface AppLayoutProps {
  children: ReactNode;
}

interface NavButtonProps {
  icon: any;
  label: string;
  active?: boolean;
  href?: string;
  collapsed?: boolean;
}

function NavButton({ icon: Icon, label, active = false, href, collapsed = false }: NavButtonProps) {
  const content = (
    <>
      <Icon className={`size-5 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"} transition-all duration-300`} />
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
          className={`font-medium tracking-wide text-sm whitespace-nowrap overflow-hidden ${active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
        >
          {label}
        </motion.span>
      )}
    </>
  );

  const className = `w-full flex items-center gap-3 px-3 py-2 h-10 rounded-full transition-all duration-200 relative group overflow-hidden ${active
    ? "bg-white/10 shadow-lg z-10"
    : "hover:bg-white/5 hover:z-10"
    } ${collapsed ? "justify-center" : "justify-start"}`;

  const tooltip = collapsed ? (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 bg-popover/90 backdrop-blur-md text-popover-foreground text-xs px-3 py-1.5 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-white/10">
      {label}
    </div>
  ) : null;

  if (href) {
    return (
      <Link href={href}>
        <Button variant="ghost" className={className} title={collapsed ? label : undefined}>
          {content}
          {active && !collapsed && (
            <motion.div
              layoutId="active-pill"
              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]"
            />
          )}
          {tooltip}
        </Button>
      </Link>
    );
  }

  return (
    <Button variant="ghost" className={className}>
      {content}
      {tooltip}
    </Button>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location] = useLocation();
  const { t } = useLanguage();
  const { logout } = useAuth();
  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">

      {/* Sidebar - Desktop (Floating & Detached) */}
      <motion.aside
        initial={{ width: 260 }}
        animate={{ width: isCollapsed ? 90 : 260 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 z-30"
      >
        <div className="flex-1 flex flex-col bg-sidebar/70 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden">
          <div className={`p-6 flex items-center ${isCollapsed ? "justify-center" : "justify-between"} h-24`}>
            {!isCollapsed && (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={logoUrl}
                alt="Cohete Brands"
                className="h-10 w-auto object-contain filter brightness-125 contrast-125"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-white/5 rounded-full"
            >
              {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </Button>
          </div>

          <nav className="flex-1 px-4 space-y-3 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <NavButton icon={LayoutDashboard} label={t("dashboard")} active={location === "/"} href="/" collapsed={isCollapsed} />

            <div className="pt-4 mt-2 border-t border-white/5 mx-2 space-y-3">
              {!isCollapsed && (
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-4 py-2 mb-1 opacity-50">
                  {t("mission_control")}
                </p>
              )}
              <NavButton icon={Building2} label={t("clients")} active={location === "/clientes"} href="/clientes" collapsed={isCollapsed} />
              <NavButton icon={FolderKanban} label={t("projects")} active={location === "/proyectos"} href="/proyectos" collapsed={isCollapsed} />
              <NavButton icon={BarChart3} label="Control de Proyectos" active={location === "/control-proyectos"} href="/control-proyectos" collapsed={isCollapsed} />
              <NavButton icon={Users} label={t("team")} active={location === "/equipo"} href="/equipo" collapsed={isCollapsed} />
              <NavButton icon={TrendingUp} label={t("analytics")} active={location === "/kpis"} href="/kpis" collapsed={isCollapsed} />
              <NavButton icon={Target} label="CRM" active={location === "/crm"} href="/crm" collapsed={isCollapsed} />
              <NavButton icon={Globe} label="Digital Assets" active={location === "/digital-assets"} href="/digital-assets" collapsed={isCollapsed} />
              <NavButton icon={DollarSign} label={t("finance")} active={location === "/finanzas"} href="/finanzas" collapsed={isCollapsed} />
              <NavButton icon={FileText} label="POES" active={location === "/poes"} href="/poes" collapsed={isCollapsed} />
              <NavButton icon={CalendarDays} label="Calendario" active={location === "/calendario-pagos"} href="/calendario-pagos" collapsed={isCollapsed} />
              <NavButton icon={Shield} label="Usuarios" active={location === "/usuarios"} href="/usuarios" collapsed={isCollapsed} />
            </div>
          </nav>

          <div className="p-4 mt-auto">
            <div className={`flex items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/5 ${isCollapsed ? "justify-center flex-col" : ""}`}>
              <Link href="/profile" className={isCollapsed ? "" : "flex-1 min-w-0"}>
                <div className={`flex items-center gap-3 cursor-pointer group ${isCollapsed ? "justify-center" : ""}`} data-testid="button-user-profile">
                  <div className="size-8 rounded-full bg-gradient-to-tr from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                    <span className="font-display font-bold text-primary text-xs">CM</span>
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">Marketing Manager</p>
                      <p className="text-[9px] text-muted-foreground truncate uppercase tracking-widest">Admin Access</p>
                    </div>
                  )}
                </div>
              </Link>
              {!isCollapsed && (
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="rounded-full shrink-0 h-8 w-8 hover:bg-white/10 hover:text-primary transition-colors" data-testid="button-settings">
                    <Settings className="size-4" />
                  </Button>
                </Link>
              )}
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full shrink-0 h-8 w-8 hover:bg-white/10 hover:text-destructive transition-colors"
                  data-testid="button-logout"
                  onClick={() => logout()}
                  title="Cerrar Sesión"
                >
                  <LogOut className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.main
        layout
        animate={{ marginLeft: isCollapsed ? 120 : 290 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen relative"
      >
        {/* Top Header - Floating Glass */}
        <header className="h-20 shrink-0 z-20 flex items-center justify-between px-8 bg-gradient-to-b from-background via-background/90 to-transparent">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 rounded-full bg-white/5"
              onClick={() => setCommandOpen(true)}
              data-testid="button-search-mobile"
            >
              <Search className="size-5" />
            </Button>

            <div className="hidden md:flex items-center gap-3 text-muted-foreground bg-white/5 border border-white/5 rounded-full px-4 py-2 w-72 cursor-pointer hover:bg-white/10 transition-colors shadow-inner" onClick={() => setCommandOpen(true)}>
              <Search className="size-4" />
              <input
                type="text"
                placeholder="Buscar en Mission Control..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50 pointer-events-none font-light"
                readOnly
              />
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-black/20 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-primary/80 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              SYSTEM ONLINE
            </div>

            <QuickCreateMenu />

            <Button variant="outline" size="icon" className="rounded-full border-white/5 bg-white/5 hover:bg-white/10 hover:text-primary h-10 w-10 transition-all hover:scale-105" data-testid="button-notifications">
              <Bell className="size-5" />
            </Button>
          </div>
        </header>

        {/* Dynamic Page Content Wrapper */}
        <div className="flex-1 px-4 md:px-8 pb-24 md:pb-8 w-full max-w-[1920px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.main>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Ejecutar comando..." />
        <CommandList className="bg-background/95 backdrop-blur-xl">
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup heading="Campañas Activas">
            {campaigns.map((campaign) => (
              <CommandItem
                key={campaign.id}
                onSelect={() => setCommandOpen(false)}
                className="data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
              >
                <span className="font-mono text-xs mr-2 opacity-50">{campaign.campaignCode}</span>
                <span>{campaign.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Mobile Navigation */}
      <MobileBottomNav />
    </div>
  );
}

