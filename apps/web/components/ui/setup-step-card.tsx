import * as React from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface SetupStepCardProps {
  /** 1-based position, shown when the step is still open. */
  index: number;
  title: string;
  description: string;
  href: string;
  done: boolean;
  required: boolean;
  /** Rendered next to the title, e.g. "4 Stufen" or "3 offen". */
  countLabel?: string;
  optionalLabel: string;
  actionLabel: string;
}

/**
 * One step of the initial setup. Deliberately not a linear stepper: the steps
 * are independent, so each renders its own state and links straight to the
 * page that resolves it. Only two of them actually depend on each other
 * (classes need stages, the cycle link needs both), and that is expressed in
 * the copy rather than by locking the UI.
 */
export function SetupStepCard({
  index,
  title,
  description,
  href,
  done,
  required,
  countLabel,
  optionalLabel,
  actionLabel,
}: SetupStepCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-colors",
        done
          ? "border-border/60 bg-muted/30"
          : "border-border hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
          done
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-muted-foreground/30 text-muted-foreground",
        )}
      >
        {done ? <Check className="size-3.5" /> : index}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              done && "text-muted-foreground",
            )}
          >
            {title}
          </span>
          {!required && (
            <Badge variant="outline" className="text-[10px]">
              {optionalLabel}
            </Badge>
          )}
          {countLabel && (
            <span className="text-muted-foreground text-xs">{countLabel}</span>
          )}
        </span>
        <span className="text-muted-foreground text-xs">{description}</span>
      </span>

      {!done && (
        <span className="text-muted-foreground group-hover:text-foreground mt-0.5 flex shrink-0 items-center gap-1 text-xs">
          {actionLabel}
          <ChevronRight className="size-3.5" />
        </span>
      )}
    </Link>
  );
}

/** Thin progress bar over the required steps. */
export function SetupProgress({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label: string;
}) {
  const pct = total === 0 ? 100 : Math.round((done / total) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {done}/{total}
        </span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}
