"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** Accessible name of the group. */
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Compact pill switch for 2–3 mutually exclusive choices (single vs. several
 * days, morning / afternoon). Plain controlled component; wrap in a form field
 * where the value belongs to the form.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  disabled = false,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "bg-muted inline-flex w-full rounded-md p-1",
        disabled && "opacity-60",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
