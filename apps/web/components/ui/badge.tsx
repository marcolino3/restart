import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-full border px-[11px] py-1 text-[11px] font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status-Pills aus dem Design-Handoff (theme-aware über --st-* Tokens)
        accent: "border-transparent bg-accent text-accent-foreground",
        slate:
          "border-transparent bg-status-slate text-status-slate-foreground",
        sky: "border-transparent bg-status-sky text-status-sky-foreground",
        amber:
          "border-transparent bg-status-amber text-status-amber-foreground",
        green:
          "border-transparent bg-status-green text-status-green-foreground",
        rose: "border-transparent bg-status-rose text-status-rose-foreground",
        // Zugriffsstufen-Skala (Kein/Lesen/Bearbeiten/Vollzugriff) fuer Rollen & Berechtigungen
        level0: "border-transparent bg-level-0 text-level-0-foreground",
        level1: "border-transparent bg-level-1 text-level-1-foreground",
        level2: "border-transparent bg-level-2 text-level-2-foreground",
        level3: "border-transparent bg-level-3 text-level-3-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
