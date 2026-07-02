"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { useSheet } from "@/components/providers/sheet-provider";
import {
  createPaidOvertimeFormSchema,
  type PaidOvertimeFormInput,
  type PaidOvertimeFormOutput,
} from "../schemas/admin-form.schema";
import {
  createEmployeePaidOvertimeAction,
  updateEmployeePaidOvertimeAction,
  type PaidOvertimeEntry,
} from "../actions/paid-overtime.action";
import { toISODate } from "../lib/to-iso-date";

interface Props {
  employeeId: string;
  entry?: PaidOvertimeEntry;
  onSaved: () => void;
}

export const PaidOvertimeForm = ({ employeeId, entry, onSaved }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const { close } = useSheet();

  const schema = useMemo(() => createPaidOvertimeFormSchema(t), [t]);

  const form = useForm<PaidOvertimeFormInput, unknown, PaidOvertimeFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: entry
      ? {
          date: new Date(entry.date),
          hours: Math.floor(entry.minutes / 60),
          minutes: entry.minutes % 60,
          note: entry.note ?? "",
        }
      : { date: new Date(), hours: 0, minutes: 0, note: "" },
  });

  const onSubmit = async (values: PaidOvertimeFormOutput) => {
    const totalMinutes = values.hours * 60 + values.minutes;
    const payload = {
      date: toISODate(values.date),
      minutes: totalMinutes,
      note: values.note || null,
    };
    const { success } = entry
      ? await updateEmployeePaidOvertimeAction({ id: entry.id, ...payload })
      : await createEmployeePaidOvertimeAction({ employeeId, ...payload });
    if (success) {
      toast.success(tc("success"));
      close();
      onSaved();
    } else {
      toast.error(tc("error"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
        <DatePickerFormField
          name="date"
          label="date"
          namespace="TimeTracking"
          disabledDate={() => false}
        />
        <div className="flex gap-4">
          <NumberFormField
            name="hours"
            label="hours"
            namespace="TimeTracking"
            min={0}
            nullable={false}
          />
          <NumberFormField
            name="minutes"
            label="minutes"
            namespace="TimeTracking"
            min={0}
            max={59}
            nullable={false}
          />
        </div>
        <InputFormField name="note" label="note" namespace="TimeTracking" />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {entry ? t("editPaidOvertime") : t("addPaidOvertime")}
        </Button>
      </form>
    </Form>
  );
};
