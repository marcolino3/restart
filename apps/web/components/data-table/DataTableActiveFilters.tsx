"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import type { FilterGroup } from "./DataTableFilter";

interface DataTableActiveFiltersProps {
  groups: FilterGroup[];
  value: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
}

/**
 * Chips for the currently active filters, shown next to the filter button so
 * the selection stays visible while the popover is closed.
 */
export function DataTableActiveFilters({
  groups,
  value,
  onChange,
}: DataTableActiveFiltersProps) {
  const t = useTranslations("DataTable");

  const chips = groups.flatMap((group) =>
    (value[group.id] ?? []).map((optionValue) => ({
      groupId: group.id,
      groupLabel: group.label,
      value: optionValue,
      option: group.options.find((o) => o.value === optionValue),
    })),
  );

  if (chips.length === 0) return null;

  function remove(groupId: string, optionValue: string) {
    onChange({
      ...value,
      [groupId]: (value[groupId] ?? []).filter((v) => v !== optionValue),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map(({ groupId, groupLabel, value: optionValue, option }) => (
        <button
          key={`${groupId}:${optionValue}`}
          type="button"
          onClick={() => remove(groupId, optionValue)}
          className="group inline-flex h-7 items-center gap-1.5 rounded-full border bg-card px-3 text-[12.5px] transition-colors hover:bg-row-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {option?.color && (
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: option.color }}
              aria-hidden
            />
          )}
          <span className="text-muted-foreground">{groupLabel}:</span>
          <span className="font-medium">{option?.label ?? optionValue}</span>
          <X className="size-3 text-muted-foreground group-hover:text-foreground" />
        </button>
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-[12.5px]"
        onClick={() => onChange({})}
      >
        {t("clearFilters")}
      </Button>
    </div>
  );
}
