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
  isSwitzerland,
  socialSecurityNumberMaxLength,
  socialSecurityNumberPlaceholder,
} from "@/lib/forms/social-security-number";

interface Props {
  name: string;
  country?: string | null;
  label?: string;
  description?: string;
  placeholder?: string;
  width?: string;
  className?: string;
  /** i18n namespace for `label` + `description`. Default `"Common"`. */
  namespace?: string;
}

export const SocialSecurityNumberFormField = ({
  name,
  country,
  label = "socialSecurityNumber",
  description,
  placeholder,
  width = "w-full",
  className,
  namespace = "Common",
}: Props) => {
  const t = useTranslations(namespace);
  const { control } = useFormContext();
  const isCh = isSwitzerland(country);

  const maskRef = useMemo(
    () =>
      isCh
        ? withMask("756.9999.9999.99", {
            placeholder: "_",
            showMaskOnHover: false,
            showMaskOnFocus: true,
          })
        : null,
    [isCh],
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
                if (maskRef) maskRef(el);
              }}
              type="text"
              inputMode={isCh ? "numeric" : "text"}
              autoComplete="off"
              maxLength={
                !isCh ? socialSecurityNumberMaxLength(country) : undefined
              }
              placeholder={
                !isCh
                  ? (placeholder ?? socialSecurityNumberPlaceholder(country))
                  : undefined
              }
              onChange={(e) => field.onChange(e.target.value)}
            />
          </FormControl>
          <FormMessage />
          {description && <FormDescription>{t(description)}</FormDescription>}
        </FormItem>
      )}
    />
  );
};
