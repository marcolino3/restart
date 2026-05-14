"use client";

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
  options: { label: string; value: string }[];
  width?: string;
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
                    {t(option.label)}
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
