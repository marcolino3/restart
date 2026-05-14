'use client';

import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

type Option = { label: string; value: string };

type ComboboxFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  options: Option[];
  translateOptions?: boolean;
  label?: string;
  description?: string;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  multiple?: boolean;
  width?: string;
  className?: string;
  clearable?: boolean;
};

export function ComboboxFormFieldWithoutTranslation<
  TFormValues extends FieldValues,
>({
  name,
  options,
  translateOptions = false,
  label,
  description,
  placeholder = 'selectPlaceholder',
  emptyText = 'noResults',
  searchPlaceholder = 'searchPlaceholder',
  multiple = false,
  width,
  className,
  clearable = false,
}: ComboboxFormFieldProps<TFormValues>) {
  const t = useTranslations('Common');
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
          <FormItem className={cn(className, 'flex flex-col gap-2')}>
            {label && <FormLabel>{t(label)}</FormLabel>}
            <div className="flex items-center gap-2">
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        width || 'w-[200px]',
                        'justify-between',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {!multiple
                        ? (() => {
                            const selectedOption = options.find((o) => o.value === field.value);
                            if (selectedOption) {
                              return translateOptions ? t(selectedOption.label) : selectedOption.label;
                            }
                            return t(placeholder);
                          })()
                        : t(placeholder)}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
              <PopoverContent className="w-auto min-w-[300px] p-0 z-[100]" sideOffset={4}>
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
                              'ml-auto h-4 w-4',
                              isSelected(option.value)
                                ? 'opacity-100'
                                : 'opacity-0'
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
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => field.onChange(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {multiple && selectedOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedOptions.map((option: Option | undefined) => (
                  <Badge
                    key={option?.value}
                    variant="default"
                    className="flex items-center gap-1 px-2 py-0.5 text-xs bg-periparto-green-900 text-white font-medium hover:bg-periparto-green-800"
                  >
                    {option?.label ? (translateOptions ? t(option.label) : option.label) : ''}
                    <button
                      type="button"
                      className="ml-1 hover:bg-periparto-green-700 rounded-full p-0.5"
                      onClick={() => {
                        if (option?.value !== undefined) {
                          toggleValue(option.value);
                        }
                      }}
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
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
