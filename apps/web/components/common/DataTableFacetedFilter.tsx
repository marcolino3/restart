"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
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

export interface FacetedFilterOption {
  /** The raw filter value stored on the table column. */
  value: string;
  /** Rendered inside the command list (may contain icons/badges). */
  label: React.ReactNode;
  /** Text the command search matches against; defaults to `value`. */
  searchValue?: string;
}

interface Props {
  /** Trigger label (already translated). */
  title: string;
  options: FacetedFilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchPlaceholder?: string;
}

/**
 * Searchable multi-select filter for data tables (Popover + cmdk), mirrored
 * from Periparto's language filter: dashed trigger with a selection count,
 * checkbox indicators and a footer to clear the facet. Wire it to a TanStack
 * column via `getFilterValue()` / `setFilterValue(next.length ? next : undefined)`.
 */
export function DataTableFacetedFilter({
  title,
  options,
  selected,
  onChange,
  searchPlaceholder,
}: Props) {
  const t = useTranslations("Common");
  const selectedSet = new Set(selected);

  const toggle = (value: string) => {
    onChange(
      selectedSet.has(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 border-dashed">
          {title}
          {selected.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 rounded-sm px-1 font-normal"
            >
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? t("search")} />
          <CommandList>
            <CommandEmpty>{t("noResults")}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.searchValue ?? option.value}
                    onSelect={() => toggle(option.value)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    {t("resetFilters")}
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
