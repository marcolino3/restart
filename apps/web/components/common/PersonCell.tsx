import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PersonCellProps {
  /** Leading avatar node (e.g. `StudentAvatar` or an initials `Avatar`). */
  avatar: ReactNode;
  /** Primary line (name), rendered bold. */
  name: ReactNode;
  /** Optional muted second line (e.g. email or birthdate · age). */
  subtitle?: ReactNode;
  className?: string;
}

/**
 * Person table cell from the design handoff (`.pcell`): a leading avatar next
 * to a bold name with an optional muted subtitle. Shared by the employees and
 * students lists — keep the avatar source per feature (initials vs. DiceBear).
 */
export function PersonCell({
  avatar,
  name,
  subtitle,
  className,
}: PersonCellProps) {
  return (
    <div className={cn("flex items-center gap-[11px]", className)}>
      {avatar}
      <div className="min-w-0">
        <div className="truncate font-semibold">{name}</div>
        {subtitle != null && (
          <div className="truncate text-[11.5px] text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
