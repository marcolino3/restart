"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface CheckboxOption {
  value: string;
  label: string;
}

interface Props {
  name: string;
  label?: string;
  options: CheckboxOption[];
  className?: string;
  disabledValues?: string[];
  requiredValues?: string[];
  translateLabels?: boolean;
}

export const CheckboxGroupFormField = ({
  name,
  label,
  options,
  className,
  disabledValues = [],
  requiredValues = [],
  translateLabels = true,
}: Props) => {
  const t = useTranslations("Common");
  const { control } = useFormContext();

  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className={cn(className, "flex flex-col gap-4")}>
          {label && <FormLabel>{translateLabels ? t(label) : label}</FormLabel>}
          <div className="flex flex-col gap-2">
            {options.map((option) => {
              const isDisabled = disabledValues.includes(option.value);
              return (
                <div key={option.value} className="flex items-center gap-3">
                  <FormControl>
                    <Checkbox
                      id={`${name}-${option.value}`}
                      checked={field.value?.includes(option.value)}
                      disabled={isDisabled}
                      onCheckedChange={(checked) => {
                        let currentValue: string[] = field.value || [];
                        if (checked) {
                          currentValue = [...currentValue, option.value];
                        } else {
                          currentValue = currentValue.filter(
                            (val) => val !== option.value,
                          );
                        }
                        for (const required of requiredValues) {
                          if (!currentValue.includes(required)) {
                            currentValue.push(required);
                          }
                        }
                        field.onChange(currentValue);
                      }}
                    />
                  </FormControl>
                  <label
                    htmlFor={`${name}-${option.value}`}
                    className={cn(
                      "text-sm cursor-pointer",
                      isDisabled && "opacity-70 cursor-not-allowed",
                    )}
                  >
                    {translateLabels ? t(option.label) : option.label}
                  </label>
                </div>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
