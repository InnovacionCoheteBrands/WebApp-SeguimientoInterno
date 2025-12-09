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
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import logoUrl from "@assets/Logo Cohete Brands_1763657286156.png";
import { useQuery } from "@tanstack/react-query";
import { fetchCampaigns } from "@/lib/api";

interface AppLayoutProps {
  children: ReactNode;
}

function NavButton({ icon: Icon, label, active = false, href }: { icon: any, label: string, active?: boolean, href?: string }) {
  const content = (
    <>
      <Icon className={`size-4 ${active ? "text-primary" : ""}`} />
      <span className="font-medium tracking-wide text-sm">{label}</span>
    </>
  );

  const className = `w-full justify-start gap-3 px-4 py-2 h-11 rounded-sm transition-all duration-200 ${active
    ? "bg-amber-500/10 text-amber-500 border-r-2 border-amber-500"
    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
    }`;

  if (href) {
    return (
      <Link href={href}>
        <Button variant="ghost" className={className}>
          {content}
        </Button>
      </Link>
    );
  }

  return (
    <Button variant="ghost" className={className}>
      {content}
    </Button>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [location] = useLocation();
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
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar fixed left-0 top-0 h-screen z-30">
        <div className="p-6 flex items-center justify-center border-b border-border h-24">
          <img
            src={logoUrl}
            alt="Cohete Brands"
            className="h-16 w-auto object-contain filter invert hue-rotate-180 brightness-110 contrast-125"
          />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavButton icon={LayoutDashboard} label="Dashboard" active={location === "/"} href="/" />

          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-4 py-2">GESTIÓN</p>
            <NavButton icon={Building2} label="Clientes" active={location === "/clientes"} href="/clientes" />
            <NavButton icon={FolderKanban} label="Proyectos" active={location === "/proyectos"} href="/proyectos" />
            <NavButton icon={Users} label="Talento" active={location === "/equipo"} href="/equipo" />
            <NavButton icon={TrendingUp} label="KPIs" active={location === "/kpis"} href="/kpis" />
            <NavButton icon={Megaphone} label="Ads Center" active={location === "/ads"} href="/ads" />
            <NavButton icon={DollarSign} label="Finanzas" active={location === "/finanzas"} href="/finanzas" />
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Link href="/profile" className="flex-1">
              <div className="flex items-center gap-3 p-2 rounded hover:bg-sidebar-accent cursor-pointer transition-colors" data-testid="button-user-profile">
                <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center">
                  <span className="font-display font-bold">CM</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Marketing Manager</p>
                  <p className="text-xs text-muted-foreground truncate">Admin Access</p>
                </div>
              </div>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="rounded-sm shrink-0 h-11 w-11" data-testid="button-settings">
                <Settings className="size-5" />
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar - Hidden, replaced with bottom navigation */}
      <Sheet open={false} onOpenChange={() => { }}>
        <SheetContent side="left" className="hidden w-64 p-0 border-r border-border bg-sidebar flex flex-col">
          <div className="p-6 flex items-center justify-center border-b border-border h-24">
            <img
              src={logoUrl}
              alt="Cohete Brands"
              className="h-16 w-auto object-contain filter invert hue-rotate-180 brightness-110 contrast-125"
            />
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <NavButton icon={LayoutDashboard} label="Dashboard" active={location === "/"} href="/" />
            <div className="pt-2 border-t border-border/50">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-4 py-2">GESTIÓN</p>
              <NavButton icon={Building2} label="Clientes" active={location === "/clientes"} href="/clientes" />
              <NavButton icon={FolderKanban} label="Proyectos" active={location === "/proyectos"} href="/proyectos" />
              <NavButton icon={Users} label="Talento" active={location === "/equipo"} href="/equipo" />
              <NavButton icon={TrendingUp} label="KPIs" active={location === "/kpis"} href="/kpis" />
              <NavButton icon={Megaphone} label="Ads Center" active={location === "/ads"} href="/ads" />
              <NavButton icon={DollarSign} label="Finanzas" active={location === "/finanzas"} href="/finanzas" />
            </div>
          </nav>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex-1">
                <div className="flex items-center gap-3 p-2 rounded hover:bg-sidebar-accent cursor-pointer transition-colors" data-testid="button-user-profile-mobile">
                  <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center">
                    <span className="font-display font-bold">CM</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Marketing Manager</p>
                    <p className="text-xs text-muted-foreground truncate">Admin Access</p>
                  </div>
                </div>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="rounded-sm shrink-0 h-11 w-11" data-testid="button-settings-mobile">
                  <Settings className="size-5" />
                </Button>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-0 md:ml-64">

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
        {children}
      </main>

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
