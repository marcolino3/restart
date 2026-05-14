'use client';

import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

export type FocalPoint = 'top' | 'center' | 'bottom';

interface FocalPointSelectorProps {
  name: string;
  label?: string;
  imageUrl?: string;
  className?: string;
}

export const FocalPointSelector = ({
  name,
  label,
  imageUrl,
  className,
}: FocalPointSelectorProps) => {
  const t = useTranslations('Common');
  const { control } = useFormContext();

  const focalPoints: { value: FocalPoint; label: string; icon: string }[] = [
    { value: 'top', label: t('focalPoint.top'), icon: '⬆' },
    { value: 'center', label: t('focalPoint.center'), icon: '⬤' },
    { value: 'bottom', label: t('focalPoint.bottom'), icon: '⬇' },
  ];

  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{t(label)}</FormLabel>}
          <FormControl>
            <div className="flex flex-col gap-3">
              {/* Visual Preview with focal point indicator */}
              {imageUrl && (
                <div className="relative w-[200px] h-[120px] rounded-lg overflow-hidden border shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className={cn(
                      'w-full h-full object-cover transition-all duration-300',
                      field.value === 'top' && 'object-top',
                      field.value === 'center' && 'object-center',
                      field.value === 'bottom' && 'object-bottom'
                    )}
                  />
                  {/* Focal point indicator line */}
                  <div
                    className={cn(
                      'absolute left-0 right-0 h-0.5 bg-primary/70 transition-all duration-300',
                      field.value === 'top' && 'top-4',
                      field.value === 'center' && 'top-1/2 -translate-y-1/2',
                      field.value === 'bottom' && 'bottom-4'
                    )}
                  />
                </div>
              )}

              {/* Focal point buttons */}
              <div className="flex gap-2">
                {focalPoints.map((fp) => (
                  <button
                    key={fp.value}
                    type="button"
                    onClick={() => field.onChange(fp.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-all',
                      field.value === fp.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-input'
                    )}
                  >
                    <span>{fp.icon}</span>
                    <span>{fp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};
