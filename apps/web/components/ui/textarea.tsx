import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[72px] w-full resize-none rounded-ctl border border-input bg-field px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-card focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-primary/[0.22] disabled:cursor-not-allowed disabled:opacity-50 md:text-[13.5px]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
