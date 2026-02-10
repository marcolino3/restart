"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label?: string;
  description?: string;
  width?: string;
  className?: string;
}

export const SwitchFormField = ({
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
          <div className="flex items-center space-x-3">
            <FormControl>
              <Switch
                id={name}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="grid gap-1.5">
              {label && (
                <FormLabel
                  htmlFor={name}
                  className="text-sm font-medium leading-none"
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
