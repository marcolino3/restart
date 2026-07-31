"use client";

import { Check, ListFilter, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { normalizeForSearch } from "@/lib/table/locale-sorting";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  /** Optional colour dot shown before the label (status/priority filters). */
  color?: string;
  /** Nesting depth; children are indented under their parent (e.g. Stufen). */
  depth?: number;
}

export interface FilterGroup {
  /** Column id this group filters. */
  id: string;
  /** Already-translated group heading, e.g. "Klasse". */
  label: string;
  options: FilterOption[];
}

interface DataTableFilterProps {
  groups: FilterGroup[];
  /** Current selection per group id. */
  value: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  className?: string;
}

/**
 * Single filter entry point for a table: one pill button that opens a popover
 * containing every filter group, instead of one dropdown per group sitting
 * side by side in the toolbar.
 *
 * Selecting values keeps the popover open (filters are usually set in
 * batches); the trigger shows the total number of active filters.
 */
export function DataTableFilter({
  groups,
  value,
  onChange,
  className,
}: DataTableFilterProps) {
  const t = useTranslations("DataTable");
  const [search, setSearch] = React.useState("");

  const activeCount = Object.values(value).reduce(
    (sum, selected) => sum + selected.length,
    0,
  );

  function toggle(groupId: string, optionValue: string) {
    const current = value[groupId] ?? [];
    const next = current.includes(optionValue)
      ? current.filter((entry) => entry !== optionValue)
      : [...current, optionValue];

    onChange({ ...value, [groupId]: next });
  }

  // Filtering happens here rather than via cmdk's built-in matcher so it stays
  // diacritic-insensitive, consistent with the table search.
  //
  // A nested option (depth > 0) is kept when its own label matches OR when the
  // nearest preceding parent matched, so indented children never end up
  // orphaned under a heading their parent was filtered out of.
  const visibleGroups = groups
    .map((group) => {
      if (!search) return group;

      const needle = normalizeForSearch(search);
      const kept: FilterOption[] = [];
      const matchedAncestorDepth = new Map<number, boolean>();

      for (const option of group.options) {
        const depth = option.depth ?? 0;
        const selfMatches = normalizeForSearch(option.label).includes(needle);
        const parentMatched = depth > 0 && matchedAncestorDepth.get(depth - 1);

        matchedAncestorDepth.set(depth, selfMatches || Boolean(parentMatched));

        if (selfMatches || parentMatched) kept.push(option);
      }

      return { ...group, options: kept };
    })
    .filter((group) => group.options.length > 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 gap-1.5 rounded-full border-dashed px-4 text-[13px]",
            activeCount > 0 && "border-solid",
            className,
          )}
        >
          <ListFilter className="size-3.5" />
          {t("filter")}
          {activeCount > 0 && (
            <Badge variant="accent" className="ml-0.5 px-1.5 py-0 text-[10.5px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("searchPlaceholder")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-80">
            {visibleGroups.length === 0 && (
              <CommandEmpty>{t("noResults")}</CommandEmpty>
            )}

            {visibleGroups.map((group, index) => (
              <React.Fragment key={group.id}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={group.label}>
                  {group.options.map((option) => {
                    const selected = (value[group.id] ?? []).includes(
                      option.value,
                    );

                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => toggle(group.id, option.value)}
                        className="gap-2"
                        style={
                          option.depth
                            ? { paddingLeft: `${8 + option.depth * 16}px` }
                            : undefined
                        }
                      >
                        <div
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {selected && <Check className="size-3" />}
                        </div>
                        {option.color && (
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: option.color }}
                            aria-hidden
                          />
                        )}
                        <span className="truncate">{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}

            {activeCount > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange({})}
                    className="justify-center gap-1.5 text-[13px]"
                  >
                    <X className="size-3.5" />
                    {t("clearFilters")}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
