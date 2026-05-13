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
import { Input } from '../ui/input'
import { useFormContext } from 'react-hook-form'
import { cn } from '../../lib/utils'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface Props {
  name: string
  label?: string
  /** Raw label without translation */
  rawLabel?: string
  /** Placeholder as translation key */
  placeholder?: string
  /** Raw placeholder without translation */
  rawPlaceholder?: string
  description?: string
  type?: string
  width?: string
  className?: string
  onBlurValue?: (value: string) => void
  disabled?: boolean
  /** Action-Button rechts im Feld; wird nur gerendert, wenn gesetzt */
  onActionClick?: (currentValue: string) => Promise<void> | void
  actionAriaLabel?: string
}

export const InputFormField = ({
  name,
  label,
  rawLabel,
  placeholder,
  rawPlaceholder,
  description,
  type = 'text',
  width = 'w-full',
  className,
  onBlurValue,
  disabled,
  onActionClick,
  actionAriaLabel = 'Aktion ausfuehren',
}: Props) => {
  const t = useTranslations('Common')
  const { control } = useFormContext()
  const [loading, setLoading] = useState(false)

  return (
    <FormField
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormItem className={cn(className, width)}>
          {(label || rawLabel) && <FormLabel htmlFor={name}>{rawLabel || (label ? t(label) : '')}</FormLabel>}
          <div className="relative">
            <FormControl>
              <Input
                {...field}
                id={name}
                type={type}
                value={field.value ?? ''}
                disabled={disabled}
                placeholder={rawPlaceholder ?? (placeholder ? t(placeholder) : undefined)}
                onBlur={(e) => {
                  field.onBlur()
                  onBlurValue?.(e.currentTarget.value)
                }}
                className={cn(
                  onActionClick && 'pr-10',
                  fieldState.error &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
            </FormControl>

            {onActionClick && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                aria-label={actionAriaLabel}
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true)
                    await onActionClick(field.value ?? '')
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          <FormMessage />
          {description && <FormDescription>{t(description)}</FormDescription>}
        </FormItem>
      )}
    />
  )
}
