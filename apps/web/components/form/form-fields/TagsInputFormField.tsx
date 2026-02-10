// components/form/tags-input-form-field.tsx
"use client";

import { X } from "lucide-react";
import { useState, KeyboardEvent } from "react";
import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Props<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  control: UseFormReturn<TFormValues>["control"];
  label?: string;
  description?: string;
  placeholder?: string;
};

export function TagsInputFormField<TFormValues extends FieldValues>({
  name,
  control,
  label,
  description,
  placeholder,
}: Props<TFormValues>) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    field: ControllerRenderProps<TFormValues, FieldPath<TFormValues>>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = inputValue.trim();
      if (!value || field.value?.includes(value)) return;
      field.onChange([...(field.value ?? []), value]);
      setInputValue("");
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <div className="space-y-2">
              <Input
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, field)}
              />
              <div className="flex flex-wrap gap-2">
                {(field.value ?? []).map((tag: string) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    {tag}
                    <Button
                      variant={"ghost"}
                      type="button"
                      onClick={() =>
                        field.onChange(
                          field.value.filter((t: string) => t !== tag)
                        )
                      }
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
