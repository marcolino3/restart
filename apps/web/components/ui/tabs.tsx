"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Tab variants from the design handoff (`docs/design/styles.css`):
 *
 * - `segment` (default) — the pill switcher (`.seg`): rounded container on
 *   `--panel`, active pill filled with the accent colour.
 * - `underline` — the page-level tabs (`.pf-tabs`): no container, active tab
 *   marked by a 3px bottom border.
 */
const tabsListVariants = cva("inline-flex items-center", {
  variants: {
    variant: {
      segment:
        "justify-center gap-0.5 rounded-full border border-border bg-card p-[3px] text-muted-foreground",
      underline:
        "h-auto justify-start gap-[22px] rounded-none border-b border-border bg-transparent p-0",
    },
  },
  defaultVariants: {
    variant: "segment",
  },
})

const tabsTriggerVariants = cva(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-semibold leading-none ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        segment:
          "rounded-full px-[14px] py-[5px] text-[12.5px] text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
        underline:
          "rounded-none border-b-[3px] border-transparent bg-transparent px-0 pb-[13px] text-[13.5px] font-[550] text-muted-foreground data-[state=active]:border-primary data-[state=active]:font-[650] data-[state=active]:text-foreground",
      },
    },
    defaultVariants: {
      variant: "segment",
    },
  },
)

type TabsVariant = VariantProps<typeof tabsListVariants>["variant"]

/**
 * Lets `TabsTrigger` inherit the variant from its `TabsList`, so call sites
 * only set it once on the list.
 */
const TabsVariantContext = React.createContext<TabsVariant>("segment")

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
    VariantProps<typeof tabsListVariants>
>(({ className, variant, ...props }, ref) => (
  <TabsVariantContext.Provider value={variant ?? "segment"}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  </TabsVariantContext.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
    VariantProps<typeof tabsTriggerVariants>
>(({ className, variant, ...props }, ref) => {
  const inherited = React.useContext(TabsVariantContext)

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        tabsTriggerVariants({ variant: variant ?? inherited }),
        className,
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * Count badge next to a tab label (`.tabn`): tabular mono digits on the soft
 * accent background.
 */
const TabsBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "ml-1 rounded-full bg-accent px-[7px] py-px font-mono text-[10.5px] font-semibold tabular-nums text-accent-foreground",
      className,
    )}
    {...props}
  />
))
TabsBadge.displayName = "TabsBadge"

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsBadge }
