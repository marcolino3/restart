"use client";

import { FieldPath, FieldValues } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ComboboxFormField } from "./ComboboxFormField";

const COUNTRY_CODES = [
  "DE", "AT", "CH", "BE", "BG", "DK", "EE", "FI", "FR", "GR",
  "IE", "IT", "HR", "LV", "LT", "LU", "MT", "NL", "PL", "PT",
  "RO", "SE", "SK", "SI", "ES", "CZ", "HU", "CY", "NO", "IS",
  "LI", "GB", "US", "CA", "AU", "TR", "JP", "CN", "IN", "BR",
] as const;

type CountryComboboxFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  label?: string;
  className?: string;
  width?: string;
};

export function CountryComboboxFormField<TFormValues extends FieldValues>({
  name,
  label = "country",
  className,
  width,
}: CountryComboboxFormFieldProps<TFormValues>) {
  const t = useTranslations("Countries");

  const options = useMemo(
    () =>
      COUNTRY_CODES.map((code) => ({
        label: t(code),
        value: code,
      })).sort((a, b) => a.label.localeCompare(b.label)),
    [t]
  );

  return (
    <ComboboxFormField<TFormValues>
      name={name}
      label={label}
      options={options}
      placeholder="selectPlaceholder"
      translateOptions={false}
      className={className}
      width={width}
    />
  );
}
