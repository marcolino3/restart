"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import type { RecordKeepingSettingsDTO } from "../actions/get-record-keeping-settings.action";
import { updateRecordKeepingSettingsAction } from "../actions/update-record-keeping-settings.action";
import {
  recordKeepingSettingsFormSchema,
  type RecordKeepingSettingsFormValues,
} from "../schemas/record-keeping-settings-form.schema";

interface Props {
  initialValues: RecordKeepingSettingsDTO;
}

type FieldKey = keyof RecordKeepingSettingsFormValues;

export function RecordKeepingSettingsForm({ initialValues }: Props) {
  const t = useTranslations("RecordKeepingSettings");
  const [isPending, startTransition] = useTransition();

  const form = useForm<RecordKeepingSettingsFormValues>({
    resolver: zodResolver(recordKeepingSettingsFormSchema),
    defaultValues: initialValues,
  });

  const onSubmit = (values: RecordKeepingSettingsFormValues) => {
    startTransition(async () => {
      const res = await updateRecordKeepingSettingsAction(values);
      if (res.success) {
        toast.success(t("savedToast"));
        form.reset(res.data);
      } else {
        toast.error(res.error ?? t("saveError"));
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumberField
            control={form.control}
            name="introducedStuckDays"
            label={t("introducedStuckDaysLabel")}
            help={t("introducedStuckDaysHelp")}
          />
          <NumberField
            control={form.control}
            name="practicedStuckDays"
            label={t("practicedStuckDaysLabel")}
            help={t("practicedStuckDaysHelp")}
          />
          <NumberField
            control={form.control}
            name="bigGapDays"
            label={t("bigGapDaysLabel")}
            help={t("bigGapDaysHelp")}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface NumberFieldProps {
  control: ReturnType<typeof useForm<RecordKeepingSettingsFormValues>>["control"];
  name: FieldKey;
  label: string;
  help: string;
}

function NumberField({ control, name, label, help }: NumberFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              max={3650}
              value={Number.isFinite(field.value) ? String(field.value) : ""}
              onChange={(e) => {
                const v = e.target.value;
                field.onChange(v === "" ? Number.NaN : Number(v));
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormDescription>{help}</FormDescription>
          {fieldState.error?.message && (
            <FormMessage>{fieldState.error.message}</FormMessage>
          )}
        </FormItem>
      )}
    />
  );
}
