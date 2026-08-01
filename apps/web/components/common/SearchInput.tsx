"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { cn } from "@/lib/utils";

interface SearchInputProps
  extends Omit<React.ComponentPropsWithoutRef<"input">, "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Defaults to the shared `DataTable.searchPlaceholder` message. */
  placeholder?: string;
  /** Renders a clear button once there is input. Defaults to `true`. */
  clearable?: boolean;
  containerClassName?: string;
}

/**
 * Search field from the design handoff (`.search` in `docs/design/styles.css`):
 * a fully rounded pill on `--field` with a leading magnifier.
 *
 * Deliberately different from `Input` (which uses the `--r-ctl` control radius):
 * the handoff styles search as a pill and form fields as rounded rectangles.
 */
export function SearchInput({
  value,
  onValueChange,
  placeholder,
  clearable = true,
  className,
  containerClassName,
  ...props
}: SearchInputProps) {
  const t = useTranslations("DataTable");

  return (
    <div
      className={cn(
        "flex h-9 w-[280px] max-w-full items-center gap-[9px] rounded-full border border-border bg-field px-[14px] text-[13px] text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background",
        containerClassName,
      )}
    >
      <Search className="size-3.5 shrink-0" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder ?? t("searchPlaceholder")}
        aria-label={placeholder ?? t("searchPlaceholder")}
        className={cn(
          "min-w-0 flex-1 border-none bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none",
          className,
        )}
        {...props}
      />
      {clearable && value.length > 0 && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label={t("clearSearch")}
          className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
