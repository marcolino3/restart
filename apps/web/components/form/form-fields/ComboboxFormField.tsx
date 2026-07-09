"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  // `triggerRef` = the visible control (observed for width). `measureRef` = a
  // hidden mirror that always renders the chips single-line, giving a stable
  // content-width to compare against (no observer oscillation).
  const triggerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

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

        const selectedCount = selectedOptions.length;

        // Overflow detection via a SEPARATE, always-hidden mirror element that
        // renders the chips single-line and full-width. Because the mirror never
        // changes with `isOverflowing`, its measurement is stable — this avoids
        // the classic ResizeObserver oscillation (measure → toggle → relayout →
        // measure again → flicker). We only observe the visible trigger's WIDTH
        // and compare it to the mirror's natural content width.
        // eslint-disable-next-line react-hooks/rules-of-hooks -- render() is the RHF render-prop body, not a nested component.
        useLayoutEffect(() => {
          const trigger = triggerRef.current;
          const mirror = measureRef.current;
          if (!trigger || !mirror || !multiple || selectedCount === 0) {
            setIsOverflowing(false);
            return;
          }
          const measure = () => {
            // Available inner width of the trigger minus the chevron/gap.
            const available = trigger.clientWidth - 28;
            const needed = mirror.scrollWidth;
            const next = needed > available;
            setIsOverflowing((prev) => (prev === next ? prev : next));
          };
          measure();
          // Observe only the trigger's width — the mirror is width-fixed to it,
          // so it never feeds its own change back into the measurement.
          const observer = new ResizeObserver(measure);
          observer.observe(trigger);
          return () => observer.disconnect();
          // `multiple` is a prop, not reactive state worth tracking here.
        }, [selectedCount]);

        const renderChip = (option: Option | undefined) => {
          const optionLabel = translateOptions
            ? t(option?.label ?? "")
            : (option?.label ?? "");
          return (
            <Badge key={option?.value} variant="accent" className="gap-1 pr-1">
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
        };

        return (
          <FormItem className={cn(className, width || "w-full", "min-w-0 flex flex-col gap-2")}>
            {label && <FormLabel>{t(label)}</FormLabel>}
            <div className="flex items-center gap-1">
            <Popover modal={modal}>
              <PopoverTrigger asChild>
                <FormControl>
                  {/*
                    A <div role="combobox"> — NOT a <button> — because the
                    selected chips contain their own <button> (the × remove
                    control), and a button cannot be nested inside a button
                    (invalid HTML → hydration crash). Keyboard-openable via
                    Enter/Space.
                  */}
                  <div
                    ref={triggerRef}
                    role="combobox"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).click();
                      }
                    }}
                    className={cn(
                      // Match the Input/Select control background/border/radius
                      // so combobox fields read as the same control. Single line;
                      // switches to a compact "N selected" label on overflow.
                      "relative flex h-[38px] w-full cursor-pointer items-center justify-between rounded-ctl border border-input bg-field px-3 py-1.5 text-[13.5px] font-normal outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/[0.22]",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {multiple && selectedCount > 0 ? (
                      isOverflowing ? (
                        <span className="flex-1 truncate text-left text-foreground">
                          {tCommon("nSelected", { count: selectedCount })}
                        </span>
                      ) : (
                        <span className="flex flex-1 items-center gap-1.5 overflow-hidden text-left">
                          {selectedOptions.map((o: Option | undefined) =>
                            renderChip(o),
                          )}
                        </span>
                      )
                    ) : (
                      <span className="truncate">
                        {!multiple
                          ? (() => {
                              const opt = options.find(
                                (o) => o.value === field.value,
                              );
                              return opt
                                ? translateOptions
                                  ? t(opt.label)
                                  : opt.label
                                : t(placeholder);
                            })()
                          : t(placeholder)}
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 self-center opacity-50" />

                    {/* Hidden mirror: always renders all chips single-line to
                        measure their natural width, independent of the visible
                        state — this is what keeps the observer stable. */}
                    {multiple && selectedCount > 0 && (
                      <span
                        ref={measureRef}
                        aria-hidden
                        className="pointer-events-none invisible absolute left-3 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        {selectedOptions.map((o: Option | undefined) =>
                          renderChip(o),
                        )}
                      </span>
                    )}
                  </div>
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

            {multiple && isOverflowing && selectedOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedOptions.map((option: Option | undefined) =>
                  renderChip(option)
                )}
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
