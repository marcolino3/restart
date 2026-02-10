"use client";

import {
  Controller,
  FieldPath,
  FieldValues,
  useFormContext,
} from "react-hook-form";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Tiptap from "@/components/editor/tiptap";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type TiptapFormFieldProps<TFormValues extends FieldValues> = {
  name: FieldPath<TFormValues>;
  label?: string;
  className?: string;
};

export function EditorFormField<TFormValues extends FieldValues>({
  name,
  label,
  className,
}: TiptapFormFieldProps<TFormValues>) {
  const t = useTranslations("Common");
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className={cn(className, "flex flex-col gap-2")}>
          {label && <FormLabel>{t(label)}</FormLabel>}
          <FormControl>
            <Tiptap description={field.value} onChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
