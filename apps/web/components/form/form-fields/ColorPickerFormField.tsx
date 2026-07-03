"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label?: string;
  /**
   * i18n namespace from which `label` is translated. Defaults to `"Common"`
   * for parity with the other FormField wrappers in this folder.
   */
  namespace?: string;
  presets?: string[];
  allowClear?: boolean;
  disabled?: boolean;
  width?: string;
  className?: string;
}

export const ColorPickerFormField = ({
  name,
  label,
  namespace = "Common",
  presets,
  allowClear = true,
  disabled = false,
  width,
  className,
}: Props) => {
  const t = useTranslations(namespace);
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(className, width, disabled && "opacity-60")}
        >
          {label && <FormLabel>{t(label)}</FormLabel>}
          <FormControl>
            <ColorPicker
              value={field.value ?? null}
              onChange={(v) => field.onChange(v ?? null)}
              presets={presets}
              allowClear={allowClear}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
