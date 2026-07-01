"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Standalone (non-RHF) single-date picker — shadcn Calendar in a Popover.
 * Use for date fields outside a react-hook-form context; inside a form prefer
 * DatePickerFormField. Allows past and future dates.
 */
export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
}: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start pl-3 text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? (
            format(value, "dd.MM.yyyy", { locale: de })
          ) : (
            <span>{placeholder ?? "—"}</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => onChange(d ?? null)}
          captionLayout="dropdown"
          locale={de}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Date → ISO date string (YYYY-MM-DD), local-time safe. */
export function toIsoDate(date: Date | null): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** ISO date string → Date (or null). */
export function fromIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
