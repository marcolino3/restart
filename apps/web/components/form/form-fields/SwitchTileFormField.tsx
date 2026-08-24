"use client";

import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label: string;
  description?: string;
  /** Leading icon rendered in a tinted square next to the label. */
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  /** i18n namespace for `label` + `description`. Default `"Common"`. */
  namespace?: string;
}

/**
 * Bordered option tile: icon + label + switch in the first row, help text
 * below. The whole tile highlights while the switch is on.
 */
export const SwitchTileFormField = ({
  name,
  label,
  description,
  icon,
  disabled = false,
  className,
  namespace = "Common",
}: Props) => {
  const { control } = useFormContext();
  const t = useTranslations(namespace);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-3 transition-colors",
            field.value && "border-primary/30 bg-primary/[0.03]",
            disabled && "opacity-60",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            {icon && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary [&>svg]:h-4 [&>svg]:w-4">
                {icon}
              </span>
            )}
            <FormLabel className="min-w-0 flex-1 break-words text-sm font-semibold leading-tight">
              {t(label)}
            </FormLabel>
            <FormControl>
              <Switch
                className="shrink-0"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </div>
          {description && (
            <FormDescription className="text-xs leading-snug">
              {t(description)}
            </FormDescription>
          )}
        </FormItem>
      )}
    />
  );
};
