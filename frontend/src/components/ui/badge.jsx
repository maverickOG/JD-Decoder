import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: 
          "text-foreground border-border bg-transparent",
        mustHave:
          "border-transparent bg-destructive/10 text-destructive font-medium hover:bg-destructive/15",
        niceToHave:
          "border-transparent bg-primary/10 text-primary font-medium hover:bg-primary/15",
        keywords:
          "border-transparent bg-success/10 text-success font-medium hover:bg-success/15",
        insights:
          "border-transparent bg-warning/15 text-warning font-medium hover:bg-warning/20",
        pill:
          "border-border bg-card text-foreground shadow-sm hover:bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
