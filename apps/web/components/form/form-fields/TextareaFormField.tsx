"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  /** Visible rows of the textarea. Falls back to the browser default. */
  rows?: number;
  width?: string;
  className?: string;
  /** i18n namespace for `label` + `description`. Default `"Common"`. */
  namespace?: string;
}

export const TextareaFormField = ({
  name,
  label,
  placeholder,
  description,
  rows,
  width = "w-full",
  className,
  namespace = "Common",
}: Props) => {
  const t = useTranslations(namespace);
  const { control } = useFormContext();

  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className={cn(className, width)}>
          {label && <FormLabel>{t(label)}</FormLabel>}
          <FormControl>
            <Textarea {...field} placeholder={placeholder} rows={rows} />
          </FormControl>
          <FormMessage />
          {description && <FormDescription>{t(description)}</FormDescription>}
        </FormItem>
      )}
    />
  );
};
