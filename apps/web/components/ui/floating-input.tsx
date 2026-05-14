import * as React from "react"

import { cn } from "@/lib/utils"

const FloatingInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { label: string }
>(({ className, type, label, id, ...props }, ref) => {
  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        ref={ref}
        placeholder=" "
        className={cn(
          "peer h-14 w-full rounded-xl border border-input bg-background px-4 pt-5 pb-2 text-base text-foreground outline-none transition-all",
          "placeholder-shown:pt-4",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "aria-invalid:border-destructive aria-invalid:focus:ring-destructive/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground transition-all duration-200 origin-left",
          "peer-focus:top-3.5 peer-focus:translate-y-0 peer-focus:scale-75 peer-focus:text-primary peer-focus:font-medium",
          "peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:font-medium",
          "peer-aria-invalid:text-destructive"
        )}
      >
        {label}
      </label>
    </div>
  )
})
FloatingInput.displayName = "FloatingInput"

export { FloatingInput }
