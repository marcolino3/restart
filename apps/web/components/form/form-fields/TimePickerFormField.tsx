"use client";

import { useFormContext, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

type TimePickerFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  label?: string;
  description?: string;
  stepsInSeconds?: number;
};

// Hilfsfunktion zum sicheren Type Narrowing
function isDate(value: unknown): value is Date {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.toString.call(value) === "[object Date]" &&
    !isNaN((value as Date).getTime())
  );
}

export function TimePickerFormField<TFormValues extends FieldValues>({
  name,
  label,
  description,
  stepsInSeconds = 60,
}: TimePickerFormFieldProps<TFormValues>) {
  const form = useFormContext<TFormValues>();
  const t = useTranslations("Common");

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const rawValue = field.value;
        const currentValue =
          typeof rawValue === "string"
            ? new Date(rawValue)
            : isDate(rawValue)
            ? rawValue
            : null;

        const timeString = currentValue
          ? currentValue.toISOString().substring(11, 16) // "HH:mm"
          : "";

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const [hours, minutes] = e.target.value.split(":").map(Number);
          const date = currentValue ?? new Date();

          date.setHours(hours || 0);
          date.setMinutes(minutes || 0);
          date.setSeconds(0);
          date.setMilliseconds(0);

          field.onChange(date.toISOString()); // Übergabe als gültiger ISO-String
        };

        return (
          <FormItem>
            {label && <FormLabel>{t(label)}</FormLabel>}
            <FormControl>
              <Input
                type="time"
                step={stepsInSeconds}
                value={timeString}
                onChange={handleChange}
                className="w-[100px] flex items-center justify-end"
              />
            </FormControl>
            {description && <FormDescription>{t(description)}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
