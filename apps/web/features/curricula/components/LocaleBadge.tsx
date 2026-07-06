import { cn } from "@/lib/utils";
import type { CurriculumLocale } from "../types";

interface LocaleBadgeProps {
  locale: CurriculumLocale;
  /** Whether a translation exists for this locale (active = green, inactive = dimmed). */
  active: boolean;
  className?: string;
}

/**
 * Small locale chip from the design handoff (`.loc`): 9.5px/650 uppercase,
 * green when the translation exists, dimmed field-tone otherwise.
 */
export function LocaleBadge({ locale, active, className }: LocaleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-[5px] px-[5px] py-[3px] text-[9.5px] font-[650] uppercase leading-none tracking-[0.06em]",
        active
          ? "bg-status-green text-status-green-foreground"
          : "bg-field text-muted-foreground opacity-60",
        className,
      )}
    >
      {locale}
    </span>
  );
}
