"use client";

import { FieldPath, FieldValues, useFormContext } from "react-hook-form";
import { Check, ChevronsUpDown, X } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

type Option = { label: string; value: string };

type ComboboxFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  options: Option[];
  label?: string;
  description?: string;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  multiple?: boolean;
  width?: string;
  className?: string;
  translateOptions?: boolean;
};

export function ComboboxFormField<TFormValues extends FieldValues>({
  name,
  options,
  label,
  description,
  placeholder = "selectPlaceholder",
  emptyText = "noResults",
  searchPlaceholder = "searchPlaceholder",
  multiple = false,
  width,
  className,
  translateOptions = true,
}: ComboboxFormFieldProps<TFormValues>) {
  const t = useTranslations("Common");
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const isSelected = (value: string) =>
          multiple
            ? Array.isArray(field.value) && field.value.includes(value)
            : field.value === value;

        const toggleValue = (value: string) => {
          if (!multiple) return field.onChange(value);
          const current: string[] = Array.isArray(field.value)
            ? field.value
            : [];
          field.onChange(
            current.includes(value)
              ? current.filter((v) => v !== value)
              : [...current, value]
          );
        };

        const selectedOptions = multiple
          ? Array.isArray(field.value)
            ? field.value
                .map((val: string) => options.find((o) => o.value === val))
                .filter(Boolean)
            : []
          : [];

        return (
          <FormItem className={cn(className, width || "w-full", "min-w-0 flex flex-col gap-2")}>
            {label && <FormLabel>{t(label)}</FormLabel>}
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {!multiple
                        ? (() => {
                            const opt = options.find((o) => o.value === field.value);
                            return opt
                              ? translateOptions ? t(opt.label) : opt.label
                              : t(placeholder);
                          })()
                        : t(placeholder)}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder={t(searchPlaceholder)}
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>{t(emptyText)}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => toggleValue(option.value)}
                        >
                          {translateOptions ? t(option.label) : option.label}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              isSelected(option.value)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {multiple && selectedOptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedOptions.map((option: Option | undefined) => (
                  <Badge
                    key={option?.value}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {translateOptions ? t(option?.label ?? "") : option?.label ?? ""}
                    <Button
                      variant={"ghost"}
                      onClick={() => {
                        if (option?.value !== undefined) {
                          toggleValue(option.value);
                        }
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {description && <FormDescription>{t(description)}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
