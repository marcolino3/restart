"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

type DateTimeCalendarFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  label?: string;
  description?: string;
  /** i18n namespace for `label` + `description`. Default `"Common"`. */
  namespace?: string;
  /** Minute grid for the time slots (default 15). */
  minuteStep?: number;
  /** First / last selectable hour (inclusive), defaults 06:00–21:00. */
  minHour?: number;
  maxHour?: number;
  disabledDate?: (date: Date) => boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Combined date + time picker (shadcn pattern "calendar + time slots"): a
 * single outline trigger opens one popover with the calendar on the left and
 * a narrow scrollable column of "HH:mm" slot buttons on the right. The form
 * value is ONE `Date` holding both day and time (no seconds).
 */
export function DateTimeCalendarFormField<TFormValues extends FieldValues>({
  name,
  label,
  description,
  namespace = "Common",
  minuteStep = 15,
  minHour = 6,
  maxHour = 21,
  disabledDate,
}: DateTimeCalendarFormFieldProps<TFormValues>) {
  const t = useTranslations(namespace);
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const dateFnsLocale = locale === "de" ? de : enUS;
  const form = useFormContext<TFormValues>();

  const slots: { h: number; m: number }[] = [];
  for (let h = minHour; h <= maxHour; h++) {
    for (let m = 0; m < 60; m += minuteStep) {
      slots.push({ h, m });
    }
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const value: Date | undefined = field.value
          ? new Date(field.value)
          : undefined;

        const handleDaySelect = (day: Date | undefined) => {
          if (!day) return;
          const merged = new Date(day);
          if (value) {
            // Keep the already chosen time; only take year/month/day.
            merged.setHours(value.getHours(), value.getMinutes(), 0, 0);
          } else {
            // First pick without a value: default to the first slot ≥ 09:00.
            const defaultHour = Math.min(Math.max(9, minHour), maxHour);
            merged.setHours(defaultHour, 0, 0, 0);
          }
          field.onChange(merged);
        };

        const handleSlotSelect = (h: number, m: number) => {
          const updated = new Date(value ?? new Date());
          updated.setHours(h, m, 0, 0);
          field.onChange(updated);
        };

        return (
          <FormItem className="flex flex-col">
            {label && <FormLabel>{t(label)}</FormLabel>}
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      // Match the Input control background/border so the field
                      // reads as the same control (component-based styling).
                      "h-[38px] w-full border-input bg-field pl-3 text-left font-normal hover:bg-field",
                      !value && "text-muted-foreground",
                    )}
                  >
                    {value ? (
                      format(value, "dd.MM.yyyy HH:mm", {
                        locale: dateFnsLocale,
                      })
                    ) : (
                      <span>{tCommon("pickDateTime")}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleDaySelect}
                    disabled={disabledDate}
                    captionLayout="dropdown"
                    locale={dateFnsLocale}
                  />
                  <div className="border-l">
                    <TimeSlotColumn
                      slots={slots}
                      value={value}
                      onSelect={handleSlotSelect}
                      ariaLabel={tCommon("timeSlotsAria")}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {description && <FormDescription>{t(description)}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function TimeSlotColumn({
  slots,
  value,
  onSelect,
  ariaLabel,
}: {
  slots: { h: number; m: number }[];
  value: Date | undefined;
  onSelect: (h: number, m: number) => void;
  ariaLabel: string;
}) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // Bring the active slot into view when the popover opens.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <ScrollArea className="h-[300px] w-[110px]">
      <div
        className="flex flex-col gap-1 p-2"
        role="listbox"
        aria-label={ariaLabel}
      >
        {slots.map(({ h, m }) => {
          const isActive =
            !!value && value.getHours() === h && value.getMinutes() === m;
          return (
            <Button
              key={`${h}:${m}`}
              ref={isActive ? activeRef : undefined}
              type="button"
              role="option"
              aria-selected={isActive}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className="w-full shrink-0 justify-center font-normal tabular-nums"
              onClick={() => onSelect(h, m)}
            >
              {pad(h)}:{pad(m)}
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
