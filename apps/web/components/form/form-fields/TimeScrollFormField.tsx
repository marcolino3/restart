"use client";

import { useTranslations } from "next-intl";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import { ClockIcon } from "lucide-react";

import { cn } from "@/lib/utils";
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
import { ScrollArea } from "@/components/ui/scroll-area";

type TimeScrollFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  label?: string;
  description?: string;
  /** Minute step for the minute column (default 5). */
  minuteStep?: number;
  minHour?: number;
  maxHour?: number;
  /** i18n namespace for `label` + `description`. Default `"Common"`. */
  namespace?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Popover time picker with two scrollable hour/minute columns, styled like
 * DatePickerFormField (same trigger button classes) instead of a native
 * `<input type="time">` or shadcn Selects. Form value is a `"HH:mm"` string.
 */
export function TimeScrollFormField<TFormValues extends FieldValues>({
  name,
  label,
  description,
  minuteStep = 5,
  minHour = 0,
  maxHour = 23,
  namespace = "Common",
}: TimeScrollFormFieldProps<TFormValues>) {
  const form = useFormContext<TFormValues>();
  const t = useTranslations(namespace);

  const hours = Array.from(
    { length: maxHour - minHour + 1 },
    (_, i) => minHour + i
  );
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, i) => i * minuteStep
  );

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const raw = typeof field.value === "string" ? field.value : "";
        const [h = "", m = ""] = raw.split(":");
        const selectedHour = h === "" ? null : pad(Number(h));
        const selectedMinute = m === "" ? null : pad(Number(m));

        const commit = (nextH: string, nextM: string) => {
          field.onChange(`${nextH}:${nextM}`);
        };

        return (
          <FormItem className="flex flex-col">
            {label && <FormLabel>{t(label)}</FormLabel>}
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-[38px] w-[120px] rounded-ctl! border-input bg-field justify-start pl-3 text-left font-normal hover:bg-field",
                      !raw && "text-muted-foreground"
                    )}
                  >
                    {selectedHour && selectedMinute
                      ? `${selectedHour}:${selectedMinute}`
                      : "--:--"}
                    <ClockIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="flex w-auto gap-0 p-0" align="start">
                <ScrollArea className="h-56 w-16 border-r">
                  <div className="flex flex-col p-1">
                    {hours.map((hr) => {
                      const value = pad(hr);
                      const active = selectedHour === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => commit(value, selectedMinute ?? pad(0))}
                          className={cn(
                            "rounded-ctl px-2 py-1.5 text-center text-sm hover:bg-accent",
                            active &&
                              "bg-primary text-primary-foreground hover:bg-primary"
                          )}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
                <ScrollArea className="h-56 w-16">
                  <div className="flex flex-col p-1">
                    {minutes.map((mn) => {
                      const value = pad(mn);
                      const active = selectedMinute === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => commit(selectedHour ?? pad(0), value)}
                          className={cn(
                            "rounded-ctl px-2 py-1.5 text-center text-sm hover:bg-accent",
                            active &&
                              "bg-primary text-primary-foreground hover:bg-primary"
                          )}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
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
