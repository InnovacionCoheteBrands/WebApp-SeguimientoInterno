/**
 * ViewToggle - Grid/List view toggle buttons
 * Part of Projects View Redesign
 */

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
    view: "grid" | "list";
    onViewChange: (view: "grid" | "list") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-8 w-8 p-0 transition-all",
                    view === "grid" && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => onViewChange("grid")}
                aria-label="Vista de cuadrícula"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-8 w-8 p-0 transition-all",
                    view === "list" && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => onViewChange("list")}
                aria-label="Vista de lista"
            >
                <List className="h-4 w-4" />
            </Button>
        </div>
    );
}
