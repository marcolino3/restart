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
 * Page heading from the design handoff (`.pagehead`, see `docs/design/styles.css`):
 * a 26px/700 title, a muted 13.5px subtitle baseline-aligned next to it and an
 * action slot on the right.
 *
 * This is the only way a page should render its title — see the sibling test
 * for the type scale.
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
    <p
      className={cn(
        "text-[13.5px] text-muted-foreground",
        stacked ? "pt-1.5" : "pb-[3px]",
      )}
    >
      {subtitle}
    </p>
  ) : null;

  return (
    <div
      className={cn("mb-5 flex flex-wrap items-end gap-4", className)}
    >
      {stacked ? (
        <div>
          {heading}
          {sub}
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          {heading}
          {sub}
        </div>
      )}
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}
