"use client";

import { FieldPath, FieldValues } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ComboboxFormField } from "./ComboboxFormField";
import { TIMEZONE_CODES } from "@/features/organizations/constants/timezone-options";

type TimezoneComboboxFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  label?: string;
  className?: string;
  width?: string;
};

export function TimezoneComboboxFormField<TFormValues extends FieldValues>({
  name,
  label = "timezone",
  className,
  width,
}: TimezoneComboboxFormFieldProps<TFormValues>) {
  const t = useTranslations("Timezones");

  const options = useMemo(
    () =>
      TIMEZONE_CODES.map((code) => ({
        label: t(code),
        value: code,
      })),
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
