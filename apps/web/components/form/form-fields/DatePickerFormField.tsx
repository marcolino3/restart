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

type DatePickerFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  label?: string;
  description?: string;
  disabledDate?: (date: Date) => boolean;
  width?: string;
  /** i18n namespace for `label`. Default `"Common"`. */
  namespace?: string;
};

export function DatePickerFormField<TFormValues extends FieldValues>({
  name,
  label,
  description,
  disabledDate = (date) => date > new Date() || date < new Date("1900-01-01"),
  width = "w-full",
  namespace = "Common",
}: DatePickerFormFieldProps<TFormValues>) {
  const t = useTranslations(namespace);
  const form = useFormContext<TFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const value = field.value ? new Date(field.value) : undefined;

        const handleDateChange = (selectedDate: Date | undefined) => {
          if (!selectedDate) {
            field.onChange(null);
            return;
          }

          const now = new Date();
          selectedDate.setHours(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
          );

          field.onChange(selectedDate);
        };

        return (
          <FormItem className={cn("flex flex-col", width)}>
            {label && <FormLabel>{t(label)}</FormLabel>}
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !value && "text-muted-foreground"
                    )}
                  >
                    {value ? (
                      format(value, "PPP", { locale: de })
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
                  selected={value}
                  onSelect={handleDateChange}
                  disabled={disabledDate}
                  captionLayout="dropdown"
                  locale={de}
                />
              </PopoverContent>
            </Popover>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
