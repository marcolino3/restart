"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

interface Props {
  name: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  /** i18n namespace for `label` + `description`. Default `"Common"`. */
  namespace?: string;
}

export const SwitchCardFormField = ({
  name,
  label,
  description,
  disabled = false,
  namespace = "Common",
}: Props) => {
  const { control } = useFormContext();
  const t = useTranslations(namespace);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5">
            {label && (
              <FormLabel className="text-sm font-medium leading-none">
                {t(label)}
              </FormLabel>
            )}
            {description && (
              <FormDescription className="text-sm text-muted-foreground">
                {t(description)}
              </FormDescription>
            )}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-readonly={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
