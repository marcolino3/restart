"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRangeValue = {
  from: Date | null;
  to: Date | null;
};

type Props = {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  disabledDate?: (date: Date) => boolean;
  /** date-fns format token. Default `dd.MM.yyyy`. */
  displayFormat?: string;
};

export const formatDateRangeLabel = (
  from: Date | null | undefined,
  to: Date | null | undefined,
  displayFormat = "dd.MM.yyyy",
): string | null => {
  if (!from) return null;
  const fmt = (d: Date) => format(d, displayFormat, { locale: de });
  if (!to) return fmt(from);
  return `${fmt(from)} – ${fmt(to)}`;
};

const toRangeValue = (range?: DateRange): DateRangeValue => ({
  from: range?.from ?? null,
  to: range?.to ?? null,
});

/**
 * Standalone (non-RHF) date-range picker — shadcn Calendar in a Popover.
 * Inside a form prefer DateRangePickerFormField.
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  disabledDate,
  displayFormat = "dd.MM.yyyy",
}: Props) {
  const label = formatDateRangeLabel(value.from, value.to, displayFormat);
  const selected: DateRange | undefined =
    value.from || value.to
      ? { from: value.from ?? undefined, to: value.to ?? undefined }
      : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start pl-3 text-left font-normal",
            !label && "text-muted-foreground",
            className,
          )}
        >
          {label ? <span>{label}</span> : <span>{placeholder ?? "—"}</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(range) => onChange(toRangeValue(range))}
          disabled={disabledDate}
          captionLayout="dropdown"
          locale={de}
        />
      </PopoverContent>
    </Popover>
  );
};
