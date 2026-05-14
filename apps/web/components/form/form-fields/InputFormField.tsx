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
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  type?: string;
  width?: string;
  className?: string;
  onChange?: () => void;
  onBlur?: () => void;
  /**
   * i18n namespace from which `label` and `description` are translated.
   * Defaults to `"Common"` for backwards compatibility. Feature-specific
   * labels (e.g. `nameIt`, `descriptionDe`) belong in the feature namespace
   * (e.g. `Curricula`), not in `Common` — pass `namespace="Curricula"`.
   */
  namespace?: string;
}

export const InputFormField = ({
  name,
  label,
  placeholder,
  description,
  type = "text",
  width = "w-full",
  className,
  onChange: onChangeProp,
  onBlur: onBlurProp,
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
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              onChange={(e) => {
                field.onChange(e);
                onChangeProp?.();
              }}
              onBlur={(e) => {
                field.onBlur();
                onBlurProp?.();
              }}
            />
          </FormControl>
          <FormMessage />
          {description && <FormDescription>{t(description)}</FormDescription>}
        </FormItem>
      )}
    />
  );
};
