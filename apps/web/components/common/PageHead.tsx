import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeadProps {
  title: ReactNode;
  /** Small muted line next to (or under, with `stacked`) the title. */
  subtitle?: ReactNode;
  /** Right-aligned action slot (e.g. primary button). */
  action?: ReactNode;
  /**
   * `false` (default): title and subtitle sit side by side, bottom-aligned
   * (list pages). `true`: subtitle renders under the title (dashboard).
   */
  stacked?: boolean;
  className?: string;
}

/**
 * Page heading from the design handoff (`.pagehead`): large bold title,
 * muted subtitle and an action slot on the right.
 */
export function PageHead({
  title,
  subtitle,
  action,
  stacked = false,
  className,
}: PageHeadProps) {
  const heading = (
    <h2 className="text-[26px] font-bold leading-none tracking-[-0.025em]">
      {title}
    </h2>
  );
  const sub = subtitle ? (
    <p className={cn("text-[13.5px] text-muted-foreground", stacked && "pt-1.5")}>
      {subtitle}
    </p>
  ) : null;

  return (
    <div className={cn("mb-5 flex flex-wrap items-center gap-4", className)}>
      {stacked ? (
        <div>
          {heading}
          {sub}
        </div>
      ) : (
        <div className="flex items-baseline gap-3">
          {heading}
          {sub}
        </div>
      )}
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}
