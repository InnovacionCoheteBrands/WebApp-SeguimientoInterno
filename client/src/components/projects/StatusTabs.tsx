/**
 * StatusTabs - Tab navigation by project status with counters
 * Part of Projects View Redesign
 */

import { cn } from "@/lib/utils";

export type ProjectStatusTab = "active" | "on_hold" | "completed";

interface StatusTabsProps {
    activeTab: ProjectStatusTab;
    onTabChange: (tab: ProjectStatusTab) => void;
    counts: {
        active: number;
        on_hold: number;
        completed: number;
    };
}

const tabs: { key: ProjectStatusTab; label: string; color: string }[] = [
    { key: "active", label: "En Desarrollo", color: "bg-green-500" },
    { key: "on_hold", label: "Pausa", color: "bg-yellow-500" },
    { key: "completed", label: "Terminado", color: "bg-red-500" },
];

export function StatusTabs({ activeTab, onTabChange, counts }: StatusTabsProps) {
    return (
        <div className="flex items-center gap-6 px-4 py-3 rounded-lg bg-card/50 border border-border/50">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    className={cn(
                        "flex items-center gap-2 text-sm font-medium transition-colors",
                        activeTab === tab.key
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <span className={cn("w-2.5 h-2.5 rounded-full", tab.color)} />
                    <span>{tab.label}</span>
                    <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        activeTab === tab.key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                        {counts[tab.key]}
                    </span>
                </button>
            ))}
        </div>
    );
}
