import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** Small muted addendum; highlight parts via `<StatCardEm>`. Placed under the value, or inline after it when `inline` is set. */
  sub?: ReactNode;
  className?: string;
  /** Renders as a plain column without its own border/shadow, for use inside a shared frame (e.g. a stat row). */
  bare?: boolean;
  /** Renders `sub` inline next to `value` instead of on its own line below. */
  inline?: boolean;
}

/**
 * Dashboard stat tile from the design handoff (`.stat`): muted label,
 * large tabular value, muted sub line.
 */
export function StatCard({
  label,
  value,
  sub,
  className,
  bare,
  inline,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        bare
          ? undefined
          : "rounded-card border bg-card px-5 py-[18px] shadow-card",
        className
      )}
    >
      <span className="text-[12.5px] font-medium text-muted-foreground">
        {label}
      </span>
      {inline ? (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[30px] font-bold tracking-[-0.03em] tabular-nums leading-none">
            {value}
          </span>
          {sub && <span className="text-sm">{sub}</span>}
        </span>
      ) : (
        <span className="text-[30px] font-bold tracking-[-0.03em] tabular-nums leading-none">
          {value}
        </span>
      )}
      {!inline && sub && (
        <span className="text-xs text-muted-foreground">{sub}</span>
      )}
    </div>
  );
}

/** Accent-colored highlight inside a `StatCard` sub line. */
export function StatCardEm({ children }: { children: ReactNode }) {
  return (
    <b className="font-semibold text-accent-foreground">{children}</b>
  );
}
