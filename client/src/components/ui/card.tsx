import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { status?: "default" | "success" | "warning" | "error" | "info" }
>(({ className, status, children, ...props }, ref) => {
  const statusGradients = {
    default: "",
    success: "from-green-500/20 via-green-500/5 to-transparent",
    warning: "from-amber-500/20 via-amber-500/5 to-transparent",
    error: "from-red-500/20 via-red-500/5 to-transparent",
    info: "from-blue-500/20 via-blue-500/5 to-transparent",
  }

  const gradientClass = status ? statusGradients[status] : ""

  return (
    <div
      ref={ref}
      className={cn(
        // Base Glassmorphism & Geometry
        "rounded-[2rem] border border-white/5 bg-card/60 backdrop-blur-xl text-card-foreground shadow-2xl relative overflow-hidden transition-all duration-300",
        // Hover Effects
        "hover:border-white/10 hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]",
        className
      )}
      {...props}
    >
      {/* Subtle Gradient Overlay for Status */}
      {status && gradientClass && (
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", gradientClass)} />
      )}

      {/* Shine Effect */}
      <div className="absolute -inset-[100%] top-0 block h-[200%] w-[50%] -rotate-45 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {children}
    </div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 sm:p-8", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-display text-xl leading-none tracking-tight text-white", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground font-light leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 sm:p-8 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 sm:p-8 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
