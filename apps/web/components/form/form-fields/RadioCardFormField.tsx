"use client";

import { useController, useFormContext } from "react-hook-form";
import { Check } from "lucide-react";

import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioCardFormFieldProps {
  name: string;
  options: RadioCardOption[];
  className?: string;
  /** Grid columns on sm+ screens. Default 2. */
  columns?: 1 | 2;
}

/**
 * Card-style single choice built from the design system primitives (border /
 * accent tokens + form field wiring). Used for the onboarding role picker;
 * mirrors RadioGroupFormField's prop convention.
 */
export const RadioCardFormField = ({
  name,
  options,
  className,
  columns = 2,
}: RadioCardFormFieldProps) => {
  const { control } = useFormContext();
  const { field } = useController({ name, control });

  return (
    <FormField
      name={name}
      control={control}
      render={() => (
        <FormItem>
          <div
            role="radiogroup"
            className={cn(
              "grid gap-2.5",
              columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
              className,
            )}
          >
            {options.map((opt) => {
              const selected = field.value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    "flex flex-col gap-1 rounded-md border px-3.5 py-3 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {opt.label}
                    {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </span>
                  {opt.description && (
                    <span className="text-xs leading-snug text-muted-foreground">
                      {opt.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
