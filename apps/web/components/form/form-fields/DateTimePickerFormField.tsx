"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { Input } from "@/components/ui/input";

type DateTimePickerFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  label?: string;
  description?: string;
  disabledDate?: (date: Date) => boolean;
  /** i18n namespace for `label`. Default `"Common"`. */
  namespace?: string;
};

export function DateTimePickerFormField<TFormValues extends FieldValues>({
  name,
  label,
  description,
  disabledDate = (date) =>
    date > new Date("2100-01-01") || date < new Date("1900-01-01"),
  namespace = "Common",
}: DateTimePickerFormFieldProps<TFormValues>) {
  const t = useTranslations(namespace);
  const form = useFormContext<TFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const value: Date | undefined = field.value;
        const date = value ? new Date(value) : undefined;
        const time = value ? format(value, "HH:mm") : "";

        const handleDateChange = (newDate: Date | undefined) => {
          if (!newDate) return;
          const merged = new Date(newDate);
          if (value) {
            merged.setHours(value.getHours());
            merged.setMinutes(value.getMinutes());
            merged.setSeconds(value.getSeconds());
          }
          field.onChange(merged);
        };

        const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const [hours, minutes, seconds] = e.target.value
            .split(":")
            .map(Number);
          if (!date) return;
          const updated = new Date(date);
          updated.setHours(hours || 0);
          updated.setMinutes(minutes || 0);
          updated.setSeconds(seconds || 0);
          field.onChange(updated);
        };

        return (
          <FormItem className="flex flex-col gap-3">
            {label && <FormLabel>{t(label)}</FormLabel>}
            <div className="flex gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {date ? (
                        format(date, "PPP", { locale: de })
                      ) : (
                        <span>{t("pickADate")}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    disabled={disabledDate}
                    captionLayout="dropdown"
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                step="1"
                value={time}
                onChange={handleTimeChange}
                className="w-[120px] bg-background"
              />
            </div>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
