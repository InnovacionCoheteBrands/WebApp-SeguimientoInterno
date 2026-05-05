import { Link, useLocation } from "wouter";
import { LayoutDashboard, Building2, FolderKanban, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: Building2, label: "Clientes", href: "/clientes" },
  { icon: FolderKanban, label: "Proyectos", href: "/proyectos" },
  { icon: DollarSign, label: "Finanzas", href: "/finanzas" },
];

export function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] pb-safe-area"
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 min-w-16 h-14 rounded-xl transition-all duration-300",
                  isActive
                    ? "text-primary bg-primary/10 scale-105"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {isActive && (
                  <div className="absolute top-0 inset-x-0 mx-auto w-8 h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] rounded-b-full" />
                )}
                <Icon className={cn("size-5 transition-all duration-300", isActive && "stroke-[2.5] drop-shadow-[0_0_5px_rgba(var(--primary),0.3)]")} />
                <span className={cn(
                  "text-[9px] font-medium uppercase tracking-wider font-display transition-all duration-300",
                  isActive ? "opacity-100 transform translate-y-0" : "opacity-70"
                )}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
