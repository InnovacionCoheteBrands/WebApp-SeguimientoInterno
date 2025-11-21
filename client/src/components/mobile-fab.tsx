import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileFABProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function MobileFAB({ onClick, label = "New Mission", className }: MobileFABProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "md:hidden fixed bottom-20 right-4 z-40",
        "size-14 rounded-full p-0",
        "bg-primary text-primary-foreground",
        "shadow-[0_0_25px_rgba(255,184,0,0.5),0_0_40px_rgba(255,184,0,0.3)]",
        "hover:shadow-[0_0_35px_rgba(255,184,0,0.6),0_0_50px_rgba(255,184,0,0.4)]",
        "transition-all duration-300",
        "border-2 border-primary/50",
        className
      )}
      data-testid="fab-new-mission"
      aria-label={label}
    >
      <Plus className="size-7" strokeWidth={2.5} />
    </Button>
  );
}
