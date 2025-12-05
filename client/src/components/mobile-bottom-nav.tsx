import { Link, useLocation } from "wouter";
import { LayoutDashboard, Building2, Users, FolderKanban, Megaphone, DollarSign } from "lucide-react";
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
  { icon: Megaphone, label: "Ads", href: "/ads" },
  { icon: DollarSign, label: "Finanzas", href: "/finanzas" },
];

export function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-border"
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
                  "flex flex-col items-center justify-center gap-1 min-w-16 h-12 rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium uppercase tracking-wider font-display">
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
