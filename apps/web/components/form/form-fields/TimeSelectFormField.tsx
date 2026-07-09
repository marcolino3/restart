"use client";

import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeSelectFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  label?: string;
  description?: string;
  /** Minute step for the minute dropdown (default 15). Use 5 for finer grain. */
  minuteStep?: number;
  /** First / last selectable hour (inclusive), default full day 0–23. */
  minHour?: number;
  maxHour?: number;
  /** i18n namespace for `label` + `description`. Default `"Common"`. */
  namespace?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Reusable time picker built from two shadcn Selects (hour · minute) instead of
 * a native `<input type="time">`, for a consistent look across browsers. The
 * form value is a `"HH:mm"` string. Reuse everywhere a time is entered.
 */
export function TimeSelectFormField<TFormValues extends FieldValues>({
  name,
  label,
  description,
  minuteStep = 15,
  minHour = 0,
  maxHour = 23,
  namespace = "Common",
}: TimeSelectFormFieldProps<TFormValues>) {
  const form = useFormContext<TFormValues>();
  const t = useTranslations(namespace);

  const hours = Array.from(
    { length: maxHour - minHour + 1 },
    (_, i) => minHour + i,
  );
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, i) => i * minuteStep,
  );

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const raw = typeof field.value === "string" ? field.value : "";
        const [h = "", m = ""] = raw.split(":");
        // Snap the current minute onto the nearest available step so an existing
        // value like "09:07" still shows a selected option.
        const currentMinute = m === "" ? "" : pad(Number(m));
        const minuteInList = minutes.map(pad).includes(currentMinute);

        const commit = (nextH: string, nextM: string) => {
          if (nextH === "" || nextM === "") {
            field.onChange(`${nextH}:${nextM}`);
            return;
          }
          field.onChange(`${nextH}:${nextM}`);
        };

        return (
          <FormItem>
            {label && <FormLabel>{t(label)}</FormLabel>}
            <FormControl>
              <div className="flex items-center gap-1.5">
                <Select
                  value={h === "" ? undefined : pad(Number(h))}
                  onValueChange={(v) => commit(v, currentMinute || pad(0))}
                >
                  <SelectTrigger className="w-[72px]" aria-label="Stunde">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hr) => (
                      <SelectItem key={hr} value={pad(hr)}>
                        {pad(hr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">:</span>
                <Select
                  value={minuteInList ? currentMinute : undefined}
                  onValueChange={(v) => commit(h === "" ? pad(0) : pad(Number(h)), v)}
                >
                  <SelectTrigger className="w-[72px]" aria-label="Minute">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((mn) => (
                      <SelectItem key={mn} value={pad(mn)}>
                        {pad(mn)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormControl>
            {description && <FormDescription>{t(description)}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
