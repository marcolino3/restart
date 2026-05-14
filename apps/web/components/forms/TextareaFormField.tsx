'use client'

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'
import { cn } from '../../lib/utils'
import { useState } from 'react'
import { Textarea } from '../ui/textarea'

interface Props {
  name: string
  label?: string
  placeholder?: string
  description?: string
  width?: string
  className?: string
  rows?: number
  maxLength?: number
  onBlurValue?: (value: string) => void
}

export const TextareaFormField = ({
  name,
  label,
  placeholder,
  description,
  width = 'w-full',
  className,
  rows = 4,
  maxLength,
  onBlurValue,
}: Props) => {
  const t = useTranslations('Common')
  const { control } = useFormContext()
  const [value, setValue] = useState('')

  return (
    <FormField
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const currentLength = (field.value ?? '').length
        const isOverLimit = maxLength && currentLength > maxLength

        return (
          <FormItem className={cn(className, width)}>
            {label && <FormLabel htmlFor={name}>{t(label)}</FormLabel>}
            <FormControl>
              <Textarea
                {...field}
                id={name}
                rows={rows}
                maxLength={maxLength}
                value={field.value ?? ''}
                placeholder={placeholder ? t(placeholder) : undefined}
                onChange={(e) => {
                  field.onChange(e)
                  setValue(e.currentTarget.value)
                }}
                onBlur={(e) => {
                  field.onBlur()
                  onBlurValue?.(e.currentTarget.value)
                }}
                className={cn(
                  'w-full px-3 py-2 border rounded-md',
                  fieldState.error &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
            </FormControl>

            <div className="flex justify-between items-start">
              <div>
                <FormMessage />
                {description && <FormDescription>{t(description)}</FormDescription>}
              </div>
              {maxLength && (
                <span className={cn(
                  'text-xs text-muted-foreground ml-2 whitespace-nowrap',
                  isOverLimit && 'text-destructive'
                )}>
                  {currentLength}/{maxLength}
                </span>
              )}
            </div>
          </FormItem>
        )
      }}
    />
  )
}
