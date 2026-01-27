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
  Lightbulb,
  Search,
  Bell,
  Megaphone,
  DollarSign,
  Globe,
  UserPlus,
  FileText,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import logoUrl from "@assets/Logo Cohete Brands_1763657286156.png";
import { useQuery } from "@tanstack/react-query";
import { fetchCampaigns } from "@/lib/api";
import { useLanguage } from "@/components/language-provider";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      <Icon className={`size-5 ${active ? "text-primary" : ""} transition-all duration-300`} />
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
          className="font-medium tracking-wide text-sm whitespace-nowrap overflow-hidden"
        >
          {label}
        </motion.span>
      )}
    </>
  );

  const className = `w-full flex items-center gap-3 px-3 py-2 h-11 rounded-md transition-all duration-200 relative group overflow-hidden ${active
    ? "bg-primary/10 text-primary"
    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
    } ${collapsed ? "justify-center" : "justify-start"}`;

  const tooltip = collapsed ? (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-border">
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
              className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
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
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">

      {/* Sidebar - Desktop */}
      <motion.aside
        initial={{ width: 256 }}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col border-r border-border bg-sidebar/50 backdrop-blur-xl fixed left-0 top-0 h-screen z-30 shadow-sm"
      >
        <div className={`p-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"} border-b border-border/50 h-20`}>
          {!isCollapsed && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={logoUrl}
              alt="Cohete Brands"
              className="h-12 w-auto object-contain filter invert hue-rotate-180 brightness-110 contrast-125"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 text-muted-foreground"
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          <NavButton icon={LayoutDashboard} label={t("dashboard")} active={location === "/"} href="/" collapsed={isCollapsed} />

          <div className="pt-2 mt-2 border-t border-border/50">
            {!isCollapsed && (
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-4 py-2 mb-1 opacity-70">
                {t("mission_control")}
              </p>
            )}
            <NavButton icon={Building2} label={t("clients")} active={location === "/clientes"} href="/clientes" collapsed={isCollapsed} />
            <NavButton icon={FolderKanban} label={t("projects")} active={location === "/proyectos"} href="/proyectos" collapsed={isCollapsed} />
            <NavButton icon={Users} label={t("team")} active={location === "/equipo"} href="/equipo" collapsed={isCollapsed} />
            <NavButton icon={TrendingUp} label={t("analytics")} active={location === "/kpis"} href="/kpis" collapsed={isCollapsed} />
            <NavButton icon={Megaphone} label="Ads Center" active={location === "/ads"} href="/ads" collapsed={isCollapsed} />
            <NavButton icon={Globe} label="Digital Assets" active={location === "/digital-assets"} href="/digital-assets" collapsed={isCollapsed} />
            <NavButton icon={DollarSign} label={t("finance")} active={location === "/finanzas"} href="/finanzas" collapsed={isCollapsed} />
            <NavButton icon={UserPlus} label="Leads" active={location === "/leads"} href="/leads" collapsed={isCollapsed} />
            <NavButton icon={FileText} label="POES" active={location === "/poes"} href="/poes" collapsed={isCollapsed} />
            <NavButton icon={CalendarDays} label="Calendario" active={location === "/calendario-pagos"} href="/calendario-pagos" collapsed={isCollapsed} />
            <NavButton icon={BarChart3} label="Control" active={location === "/control-proyectos"} href="/control-proyectos" collapsed={isCollapsed} />
          </div>
        </nav>

        <div className="p-3 border-t border-border/50 bg-sidebar/50">
          <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center flex-col" : ""}`}>
            <Link href="/profile" className={isCollapsed ? "" : "flex-1 min-w-0"}>
              <div className={`flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent cursor-pointer transition-all duration-200 group ${isCollapsed ? "justify-center" : ""}`} data-testid="button-user-profile">
                <div className="size-9 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center shrink-0 ring-2 ring-transparent group-hover:ring-primary/10 transition-all">
                  <span className="font-display font-bold text-primary text-xs">CM</span>
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">Marketing Manager</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">Admin Access</p>
                  </div>
                )}
              </div>
            </Link>
            {!isCollapsed && (
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="rounded-md shrink-0 h-9 w-9 hover:bg-sidebar-accent hover:text-primary transition-colors" data-testid="button-settings">
                  <Settings className="size-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar - Removed (replaced by bottom nav) */}

      {/* Main Content */}
      <motion.main
        layout
        animate={{ marginLeft: isCollapsed ? 80 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-0 md:ml-64"
      >

        {/* Top Bar */}
        <header className="h-14 sm:h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-11 w-11"
              onClick={() => setCommandOpen(true)}
              data-testid="button-search-mobile"
            >
              <Search className="size-5" />
            </Button>
            <div className="hidden md:flex items-center gap-2 text-muted-foreground bg-card border border-input rounded-sm px-3 py-1.5 w-64 cursor-pointer" onClick={() => setCommandOpen(true)}>
              <Search className="size-4" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50 pointer-events-none"
                readOnly
              />
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              TODAS LAS CAMPAÑAS ACTIVAS
            </div>
            <Button variant="outline" size="icon" className="rounded-sm border-border hover:bg-accent hover:text-accent-foreground h-11 w-11" data-testid="button-notifications">
              <Bell className="size-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Buscar campañas..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup heading="Campañas">
            {campaigns.map((campaign) => (
              <CommandItem
                key={campaign.id}
                onSelect={() => {
                  setCommandOpen(false);
                }}
              >
                <span className="font-mono text-xs mr-2">{campaign.campaignCode}</span>
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
