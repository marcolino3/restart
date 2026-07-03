import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** Small muted line under the value; highlight parts via `<StatCardEm>`. */
  sub?: ReactNode;
  className?: string;
}

/**
 * Dashboard stat tile from the design handoff (`.stat`): muted label,
 * large tabular value, muted sub line.
 */
export function StatCard({ label, value, sub, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-card border bg-card px-5 py-[18px] shadow-card",
        className
      )}
    >
      <span className="text-[12.5px] font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-[30px] font-bold tracking-[-0.03em] tabular-nums leading-none">
        {value}
      </span>
      {sub && (
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
