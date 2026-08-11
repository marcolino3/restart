'use client'

import * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import {
  Controller,
  FormProvider,
  type ControllerProps,
  type FieldPath,
  type ControllerFieldState,
  type FieldValues,
} from 'react-hook-form'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useFieldAccess } from '@/components/form/field-resource-context'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslations } from 'next-intl'

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
  fieldState?: ControllerFieldState
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: ControllerProps<TFieldValues, TName>
) => {
  return (
    <Controller
      {...props}
      render={({ field, fieldState, formState }) => (
        <FormFieldContext.Provider value={{ name: props.name, fieldState }}>
          {props.render?.({ field, fieldState, formState })}
        </FormFieldContext.Provider>
      )}
    />
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const access = useFieldAccess(fieldContext.name)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error: fieldContext.fieldState?.error,
    isTouched: fieldContext.fieldState?.isTouched,
    isDirty: fieldContext.fieldState?.isDirty,
    fieldVisible: access.visible,
    fieldEditable: access.editable,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()
  const fieldContext = React.useContext(FormFieldContext)
  const access = useFieldAccess(fieldContext.name)

  return (
    <FormItemContext.Provider value={{ id }}>
      {access.visible ? (
        <div
          data-slot="form-item"
          className={cn('relative grid gap-2', className)}
          {...props}
        />
      ) : null}
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      // Match the design handoff form-field label (.fld label): 12.5px / 600,
      // instead of the base Label's larger text-base.
      className={cn("text-[12.5px] font-semibold", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ children, ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId, fieldEditable } = useFormField()
  const t = useTranslations('Common')

  const slot = (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    >
      {/* cloneElement's own props win over the child's, unlike Slot's merge —
          this is the only way to force-disable a control that already sets
          its own `disabled` prop (every form-field component does). */}
      {!fieldEditable && React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ disabled?: boolean }>, {
            disabled: true,
          })
        : children}
    </Slot>
  )

  if (fieldEditable) return slot

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block w-full" tabIndex={0}>
          {slot}
        </span>
      </TooltipTrigger>
      <TooltipContent>{t('fieldPermissionDenied')}</TooltipContent>
    </Tooltip>
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? '') : props.children
  if (!body) {
    return null
  }

  // Positioned absolutely just below the control so it lives in the existing
  // gap between fields — the field height stays constant, so showing/hiding a
  // validation message never shifts the layout (and keeps grid columns aligned).
  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn(
        'absolute left-0 top-full mt-0.5 text-destructive text-xs leading-tight',
        className,
      )}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
}
