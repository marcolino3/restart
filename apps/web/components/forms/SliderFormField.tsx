'use client';

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface SliderFormFieldProps {
  name: string;
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

export const SliderFormField = ({
  name,
  label,
  description,
  min = 0,
  max = 100,
  step = 1,
  className,
  trackClassName,
  rangeClassName,
  thumbClassName,
}: SliderFormFieldProps) => {
  const t = useTranslations('Common');
  const { control, watch } = useFormContext();
  const value = watch(name); // liest aktuellen Wert aus react-hook-form

  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className={cn('flex flex-col gap-2', className)}>
          {label && <FormLabel>{t(label)}</FormLabel>}

          {/* Wert-Anzeige */}
          <div className="text-sm font-medium">
            {value} {t(description ?? '')}
          </div>

          <FormControl>
            <Slider
              value={[field.value ?? 0]}
              onValueChange={(vals: number[]) => field.onChange(vals[0])}
              min={min}
              max={max}
              step={step}
              trackClassName={trackClassName}
              rangeClassName={rangeClassName}
              thumbClassName={thumbClassName}
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};
