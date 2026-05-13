"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface SliderFormFieldProps {
  name: string;
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

export const SliderFormField = ({
  name,
  label,
  description,
  min = 0,
  max = 100,
  step = 1,
  className,
  trackClassName,
  rangeClassName,
  thumbClassName,
}: SliderFormFieldProps) => {
  const t = useTranslations("Common");
  const { control, watch } = useFormContext();
  const value = watch(name);

  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col gap-2", className)}>
          {label && <FormLabel>{t(label)}</FormLabel>}

          <div className="text-sm font-medium">
            {value} {description ? t(description) : ""}
          </div>

          <FormControl>
            <Slider
              value={[field.value ?? 0]}
              onValueChange={(vals: number[]) => field.onChange(vals[0])}
              min={min}
              max={max}
              step={step}
              trackClassName={trackClassName}
              rangeClassName={rangeClassName}
              thumbClassName={thumbClassName}
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};
