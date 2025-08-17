// components/form/text-input-form-field.tsx
"use client";

import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type TextInputFormFieldProps<T extends FieldValues> = {
  name: FieldPath<T>;
  control: UseFormReturn<T>["control"];
  label?: string;
  description?: string;
  placeholder?: string;
  type?: string;
};

export function TextInputFormField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  placeholder,
  type = "text",
}: TextInputFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({
        field,
      }: {
        field: ControllerRenderProps<T, FieldPath<T>>;
      }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input {...field} placeholder={placeholder} type={type} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
