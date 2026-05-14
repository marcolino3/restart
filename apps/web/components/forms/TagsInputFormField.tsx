"use client";

import { X } from "lucide-react";
import { useState, KeyboardEvent } from "react";
import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  useFormContext,
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
import { useTranslations } from "next-intl";

type Props = {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
};

export function TagsInputFormField({
  name,
  label,
  description,
  placeholder,
}: Props) {
  const t = useTranslations("Common");
  const { control } = useFormContext();
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    field: ControllerRenderProps
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
          {label && <FormLabel htmlFor={name}>{t(label)}</FormLabel>}
          <FormControl>
            <div className="space-y-3">
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
                    className="flex items-center gap-1 rounded-full bg-periparto-green-900 text-white px-3 py-1 text-sm"
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
                      className="ml-1 text-white/70 hover:text-white hover:bg-transparent h-auto p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </FormControl>
          {description && <FormDescription>{t(description)}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
