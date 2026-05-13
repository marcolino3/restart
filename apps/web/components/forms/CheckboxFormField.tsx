"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label?: string;
  description?: string;
  width?: string;
  className?: string;
}

export const CheckboxFormField = ({
  name,
  label,
  description,
  width = "w-full",
  className,
}: Props) => {
  const t = useTranslations("Common");
  const { control } = useFormContext();

  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className={cn(className, width, "flex flex-col gap-2")}>
          <div className="flex items-start gap-3 space-y-0">
            <FormControl>
              <Checkbox
                className="mt-0.5"
                checked={field.value}
                onCheckedChange={field.onChange}
                id={name}
              />
            </FormControl>
            <div className="grid gap-1.5">
              {label && (
                <FormLabel
                  htmlFor={name}
                  className="text-sm/5 font-medium cursor-pointer"
                >
                  {t(label)}
                </FormLabel>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">
                  {t(description)}
                </p>
              )}
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
