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
  /** Granularity for `type="number"`, e.g. `0.1` for one decimal place. */
  step?: number;
  width?: string;
  className?: string;
  disabled?: boolean;
  /** Maps to the native `autocomplete` attribute, e.g. `"email"`. */
  autoComplete?: string;
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
  step,
  width = "w-full",
  className,
  disabled = false,
  autoComplete,
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
        <FormItem className={cn(className, width, disabled && "opacity-60")}>
          {label && <FormLabel>{t(label)}</FormLabel>}
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ""}
              type={type}
              step={step}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete={autoComplete}
              onChange={(e) => {
                field.onChange(e);
                onChangeProp?.();
              }}
              onBlur={() => {
                field.onBlur();
                onBlurProp?.();
              }}
            />
          </FormControl>
          {description && <FormDescription>{t(description)}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
