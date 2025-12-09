import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { status?: "default" | "success" | "warning" | "error" | "info" }
>(({ className, status, children, ...props }, ref) => {
  const statusGradients = {
    default: "",
    success: "from-transparent via-green-500 to-transparent",
    warning: "from-transparent via-amber-500 to-transparent",
    error: "from-transparent via-red-500 to-transparent",
    info: "from-transparent via-blue-500 to-transparent",
  }

  const gradientClass = status ? statusGradients[status] : ""

  return (
    <div
      ref={ref}
      className={cn(
        "bg-card text-card-foreground shadow-none border border-border/50 relative overflow-hidden",
        className
      )}
      {...props}
    >
      {status && gradientClass && (
        <div className={cn("absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r opacity-70", gradientClass)} />
      )}
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
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)}
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
    className={cn("font-display text-lg leading-none tracking-wide uppercase", className)}
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
    className={cn("text-xs text-muted-foreground font-mono uppercase tracking-wider", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 sm:p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
