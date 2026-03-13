import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-widest active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_25px_-5px_hsl(var(--primary)/0.7)] hover:bg-primary/90 border border-primary/50",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-white/15 ring-1 ring-inset ring-white/5 bg-transparent shadow-sm hover:bg-white/5 hover:text-primary hover:border-white/30 backdrop-blur-sm",
        secondary:
          "bg-secondary/50 text-secondary-foreground shadow-sm hover:bg-secondary/80 backdrop-blur-md border border-white/5",
        ghost: "hover:bg-white/5 hover:text-primary hover:border-white/15 hover:ring-1 hover:ring-inset hover:ring-white/5 hover:shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]",
        link: "text-primary underline-offset-4 hover:underline",
        industrial: "bg-muted/50 text-foreground border-b-2 border-primary hover:bg-muted/80 backdrop-blur-sm",
      },
      size: {
        default: "h-10 px-6 py-2 rounded-full",
        sm: "h-8 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
