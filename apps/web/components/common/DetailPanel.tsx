import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DetailPanelProps {
  title?: ReactNode;
  /** Optional right-aligned slot in the panel header (e.g. an edit button). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Card panel from the design handoff (`.panel`): bordered card with a 15px/650
 * heading. Used for the detail sub-pages (contract, contact, salden, …).
 */
export function DetailPanel({
  title,
  action,
  children,
  className,
}: DetailPanelProps) {
  return (
    <div
      className={cn(
        "rounded-card border bg-card px-[22px] py-5 shadow-xs",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-1 flex items-center gap-2">
          {title && (
            <h3 className="text-[15px] font-[650] tracking-[-0.01em]">
              {title}
            </h3>
          )}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

interface KvRowProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Key/value row from the design handoff (`.kv`): muted label left, bold value
 * right, hairline divider between rows.
 */
export function KvRow({ label, children, className }: KvRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border py-[10px] text-[13.5px] last:border-b-0",
        className,
      )}
    >
      <span className="text-[12.5px] font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-right font-semibold">{children}</span>
    </div>
  );
}

/** Two-column detail layout (`.cols2`): wider left, narrower right. */
export function DetailCols({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3.5 md:grid-cols-[1.35fr_1fr] md:items-start",
        className,
      )}
    >
      {children}
    </div>
  );
}
