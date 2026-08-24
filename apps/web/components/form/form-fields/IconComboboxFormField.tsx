"use client";

import { useState } from "react";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { useTranslations } from "next-intl";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { cn } from "@/lib/utils";

/**
 * Curated Lucide icons offered for absence categories and similar labels.
 * Names are validated against `IconName`, so a renamed icon fails typecheck
 * instead of rendering nothing at runtime.
 */
export const CURATED_ICON_NAMES: IconName[] = [
  "thermometer",
  "heart-pulse",
  "stethoscope",
  "pill",
  "syringe",
  "bandage",
  "hand-heart",
  "ambulance",
  "hospital",
  "bed",
  "baby",
  "users",
  "graduation-cap",
  "book-open",
  "briefcase",
  "flower",
  "church",
  "truck",
  "house",
  "shield",
  "shield-check",
  "clock",
  "plane",
  "sun",
  "tree-palm",
  "umbrella",
  "calendar",
  "car",
  "bus",
  "train-front",
  "tent",
  "mountain",
  "party-popper",
  "gift",
  "gem",
  "coffee",
  "scale",
  "landmark",
  "gavel",
  "hammer",
  "wrench",
  "phone",
  "star",
  "circle-help",
];

const iconNameSet = new Set<string>(CURATED_ICON_NAMES);

/** Type guard: only names in the curated list render via `DynamicIcon`. */
export function isCuratedIconName(value: unknown): value is IconName {
  return typeof value === "string" && iconNameSet.has(value);
}

type IconComboboxFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  label?: string;
  description?: string;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  /** Show a clear (×) button to reset the icon back to none. */
  clearable?: boolean;
  /** Icons to offer; defaults to {@link CURATED_ICON_NAMES}. */
  icons?: IconName[];
  /** i18n namespace for label/description/placeholder. Default `"Common"`. */
  namespace?: string;
};

/**
 * Single-select combobox over Lucide icon names with a rendered preview of
 * every option and of the selected value. Stores the icon name (or null).
 */
export function IconComboboxFormField<TFormValues extends FieldValues>({
  name,
  label,
  description,
  placeholder = "selectPlaceholder",
  emptyText = "noResults",
  searchPlaceholder = "searchPlaceholder",
  className,
  clearable = true,
  icons = CURATED_ICON_NAMES,
  namespace = "Common",
}: IconComboboxFormFieldProps<TFormValues>) {
  const t = useTranslations(namespace);
  const tCommon = useTranslations("Common");
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = isCuratedIconName(field.value) ? field.value : null;
        return (
          <FormItem className={className}>
            {label && <FormLabel>{t(label)}</FormLabel>}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {selected ? (
                        <>
                          <DynamicIcon name={selected} className="h-4 w-4" />
                          {selected}
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          {tCommon(placeholder)}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      {clearable && selected && (
                        <X
                          className="h-4 w-4 opacity-50 hover:opacity-100"
                          aria-label={tCommon("remove")}
                          onClick={(e) => {
                            e.stopPropagation();
                            field.onChange(null);
                          }}
                        />
                      )}
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </span>
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder={tCommon(searchPlaceholder)} />
                  <CommandList>
                    <CommandEmpty>{tCommon(emptyText)}</CommandEmpty>
                    <CommandGroup>
                      {icons.map((icon) => (
                        <CommandItem
                          key={icon}
                          value={icon}
                          onSelect={() => {
                            field.onChange(icon);
                            setOpen(false);
                          }}
                        >
                          <DynamicIcon name={icon} className="h-4 w-4" />
                          <span className="truncate">{icon}</span>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selected === icon ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {description && <FormDescription>{t(description)}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
