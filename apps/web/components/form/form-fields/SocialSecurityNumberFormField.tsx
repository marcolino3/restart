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
import { useCountryTemplate } from "@/features/country-input-templates/CountryInputTemplatesProvider";

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
  const template = useCountryTemplate(country, "SSN");

  const maskRef = useMemo(() => {
    if (!template?.mask) return null;
    const mask = template.prefix
      ? template.prefix + template.mask.slice(template.prefix.length)
      : template.mask;
    return withMask(mask, {
      placeholder: "_",
      showMaskOnHover: false,
      showMaskOnFocus: true,
    });
  }, [template]);

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
              inputMode={template ? "numeric" : "text"}
              autoComplete="off"
              maxLength={template?.maxLength ?? undefined}
              placeholder={
                template
                  ? (placeholder ?? template.placeholder ?? undefined)
                  : placeholder
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
