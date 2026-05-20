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
  disabled?: boolean;
  /** i18n namespace for `label` + `description`. Default `"Common"`. */
  namespace?: string;
}

export const SwitchFormField = ({
  name,
  label,
  description,
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
        <FormItem
          className={cn(
            className,
            width,
            "flex flex-col gap-2",
            disabled && "opacity-60",
          )}
        >
          <div className="flex items-center space-x-3">
            <FormControl>
              <Switch
                id={name}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
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
                <p className="text-muted-foreground text-sm">
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
