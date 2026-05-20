"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Allow null when the input is cleared. Default true. */
  nullable?: boolean;
  width?: string;
  className?: string;
  disabled?: boolean;
  namespace?: string;
}

/**
 * Number input that:
 * - Respects HTML min/max/step attributes (blocks step-down past min, etc.).
 * - Strips leading "-" if min >= 0 (defaults so).
 * - Stores number | null in the form, never a string or NaN.
 */
export const NumberFormField = ({
  name,
  label,
  placeholder,
  description,
  min = 0,
  max,
  step = 1,
  nullable = true,
  width = "w-full",
  className,
  disabled = false,
  namespace = "Common",
}: Props) => {
  const t = useTranslations(namespace);
  const { control } = useFormContext();

  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className={cn(className, width, disabled && "opacity-60")}>
          {label && <FormLabel>{t(label)}</FormLabel>}
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              value={
                field.value === null || field.value === undefined
                  ? ""
                  : String(field.value)
              }
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  field.onChange(nullable ? null : min);
                  return;
                }
                const parsed = Number(raw);
                if (!Number.isFinite(parsed)) {
                  field.onChange(nullable ? null : min);
                  return;
                }
                // Hartes Minimum durchsetzen — kein negativer Wert wenn min >= 0
                let clamped = parsed < min ? min : parsed;
                if (typeof max === "number" && clamped > max) clamped = max;
                field.onChange(clamped);
              }}
              onKeyDown={(e) => {
                if (min >= 0 && (e.key === "-" || e.key === "e" || e.key === "E")) {
                  e.preventDefault();
                }
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
          {description && <FormDescription>{t(description)}</FormDescription>}
        </FormItem>
      )}
    />
  );
};
