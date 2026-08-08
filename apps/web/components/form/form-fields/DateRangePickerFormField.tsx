"use client";

import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DateRange } from "react-day-picker";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { formatDateRangeLabel } from "@/components/form/DateRangePicker";

type DateRangePickerFormFieldProps<TFormValues extends FieldValues> = {
  startName: FieldPath<TFormValues>;
  endName: FieldPath<TFormValues>;
  label?: string;
  description?: string;
  disabledDate?: (date: Date) => boolean;
  width?: string;
  /** i18n namespace for `label` and placeholder. Default `"Common"`. */
  namespace?: string;
};

const preserveTime = (date: Date): Date => {
  const now = new Date();
  const copy = new Date(date);
  copy.setHours(
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
  return copy;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

export function DateRangePickerFormField<TFormValues extends FieldValues>({
  startName,
  endName,
  label,
  description,
  disabledDate = (date) => date > new Date() || date < new Date("1900-01-01"),
  width = "w-full",
  namespace = "Common",
}: DateRangePickerFormFieldProps<TFormValues>) {
  const t = useTranslations(namespace);
  const tCommon = useTranslations("Common");
  const form = useFormContext<TFormValues>();
  const startValue = form.watch(startName);
  const endValue = form.watch(endName);
  const from = toDate(startValue);
  const to = toDate(endValue);
  const displayLabel = formatDateRangeLabel(from, to, "PPP");
  const selected: DateRange | undefined =
    from || to ? { from: from ?? undefined, to: to ?? undefined } : undefined;

  const handleRangeChange = (range?: DateRange) => {
    if (!range?.from) {
      form.setValue(startName, null as never, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue(endName, null as never, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    form.setValue(startName, preserveTime(range.from) as never, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (range.to) {
      form.setValue(endName, preserveTime(range.to) as never, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      form.setValue(endName, null as never, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <FormField
      control={form.control}
      name={endName}
      render={() => (
        <FormItem className={cn("flex flex-col", width)}>
          {label && <FormLabel>{t(label)}</FormLabel>}
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-[38px] w-full rounded-ctl! border-input bg-field pl-3 text-left font-normal hover:bg-field",
                    !displayLabel && "text-muted-foreground",
                  )}
                >
                  {displayLabel ? (
                    displayLabel
                  ) : (
                    <span>{tCommon("pickADateRange")}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={selected}
                onSelect={handleRangeChange}
                disabled={disabledDate}
                captionLayout="dropdown"
                startMonth={new Date(1900, 0)}
                endMonth={new Date(new Date().getFullYear() + 10, 11)}
                locale={de}
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
