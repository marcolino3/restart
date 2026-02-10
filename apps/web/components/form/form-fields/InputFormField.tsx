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
}: Props) => {
  const t = useTranslations("Common");
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
            />
          </FormControl>
          <FormMessage />
          {description && <FormDescription>{t(description)}</FormDescription>}
        </FormItem>
      )}
    />
  );
};
