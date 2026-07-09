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
  /** Show a clear (×) button to reset a single-select back to empty. */
  clearable?: boolean;
  /**
   * Render the popover in modal mode — required when the combobox lives inside
   * a Radix Dialog, so focus/scroll stay trapped in the popover.
   */
  modal?: boolean;
  /** i18n namespace for label/description/placeholder/option-labels. Default `"Common"`. */
  namespace?: string;
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
  clearable = false,
  modal = false,
  namespace = "Common",
}: ComboboxFormFieldProps<TFormValues>) {
  const t = useTranslations(namespace);
  const tCommon = useTranslations("Common");
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
            <div className="flex items-center gap-1">
            <Popover modal={modal}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      // Match the Input/Select control background/border so
                      // combobox fields read as the same control. Grows only
                      // when selected chips wrap onto a second line.
                      // rounded-ctl (not the Button default rounded-full) so it
                      // matches Input/Select controls.
                      "h-auto min-h-[38px] w-full items-center justify-between rounded-ctl! border-input bg-field py-1.5 font-normal hover:bg-field",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {multiple && selectedOptions.length > 0 ? (
                      <span className="flex flex-1 flex-wrap items-center gap-1.5 text-left">
                        {selectedOptions.map((option: Option | undefined) => {
                          const optionLabel = translateOptions
                            ? t(option?.label ?? "")
                            : (option?.label ?? "");
                          return (
                            <Badge
                              key={option?.value}
                              variant="accent"
                              className="gap-1 pr-1"
                            >
                              {optionLabel}
                              <button
                                type="button"
                                aria-label={`${tCommon("remove")} ${optionLabel}`}
                                className="inline-flex size-4 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-accent-foreground/15"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (option?.value !== undefined) {
                                    toggleValue(option.value);
                                  }
                                }}
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </span>
                    ) : (
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
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 self-center opacity-50" />
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
            {clearable && !multiple && field.value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => field.onChange(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            </div>

            {description && <FormDescription>{t(description)}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
