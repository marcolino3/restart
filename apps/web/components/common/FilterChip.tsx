"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Filter chip from the design handoff (`.chip` / `.chip.on`): pill-shaped,
 * active = accent background. Used for the single-select filter rows on list
 * screens (e.g. the employees persona filter).
 */
export function FilterChip({
  active,
  onClick,
  children,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-[15px] py-[7px] text-[13px] font-medium transition-colors",
        active
          ? "border-primary bg-primary font-semibold text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
