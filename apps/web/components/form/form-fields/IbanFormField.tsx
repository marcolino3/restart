"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { withMask } from "use-mask-input";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  IBAN_MASK,
  IBAN_MAX_LENGTH,
  IBAN_PLACEHOLDER,
} from "@/lib/forms/iban";

interface Props {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  width?: string;
  className?: string;
  /** i18n namespace for `label` + `description`. Default `"Common"`. */
  namespace?: string;
}

export const IbanFormField = ({
  name,
  label = "iban",
  description,
  placeholder,
  width = "w-full",
  className,
  namespace = "Common",
}: Props) => {
  const t = useTranslations(namespace);
  const { control } = useFormContext();

  const maskRef = useMemo(
    () =>
      withMask(IBAN_MASK, {
        placeholder: "_",
        showMaskOnHover: false,
        showMaskOnFocus: true,
      }),
    [],
  );

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
              value={field.value ?? ""}
              ref={(el) => {
                field.ref(el);
                maskRef(el);
              }}
              type="text"
              inputMode="text"
              autoComplete="off"
              maxLength={IBAN_MAX_LENGTH}
              placeholder={placeholder ?? IBAN_PLACEHOLDER}
              onChange={(e) =>
                field.onChange(e.target.value.toUpperCase())
              }
            />
          </FormControl>
          <FormMessage />
          {description && <FormDescription>{t(description)}</FormDescription>}
        </FormItem>
      )}
    />
  );
};
