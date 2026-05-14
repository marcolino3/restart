"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  options: { label: string; value: string }[];
  width?: string;
}

export const SelectFormFieldWithoutTranslations = ({
  name,
  label,
  description,
  placeholder,
  options,
  width = "w-full",
}: Props) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={width}>
          {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
          <FormControl>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id={name}>
                <SelectValue placeholder={placeholder || label || ""} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
