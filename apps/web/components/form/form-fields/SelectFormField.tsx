"use client";

import type { ReactNode } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Props {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  /**
   * Option labels are i18n keys (`string`) when `translateOptions` is true
   * (default), or arbitrary rendered content (`ReactNode`) when it is false.
   */
  options: { label: string | ReactNode; value: string }[];
  width?: string;
  /**
   * Whether option labels are i18n keys to translate. `false` for dynamic
   * option labels (names, classes, periods from the DB) or ReactNode labels.
   * Default `true`.
   */
  translateOptions?: boolean;
  /** i18n namespace for `label`, `description`, `placeholder` und option-labels. Default `"Common"`. */
  namespace?: string;
}

export const SelectFormField = ({
  name,
  label,
  description,
  placeholder,
  options,
  width = "w-full",
  translateOptions = true,
  namespace = "Common",
}: Props) => {
  const t = useTranslations(namespace);
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={width}>
          {label && <FormLabel htmlFor={name}>{t(label)}</FormLabel>}
          <FormControl>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id={name}>
                <SelectValue placeholder={t(placeholder || label || "")} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {translateOptions
                      ? t(option.label as string)
                      : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {t(description)}
            </p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
