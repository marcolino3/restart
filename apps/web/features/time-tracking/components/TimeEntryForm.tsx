"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { TimePickerFormField } from "@/components/form/form-fields/TimePickerFormField";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { useSheet } from "@/components/providers/sheet-provider";
import {
  TimeEntryFormSchema,
  type TimeEntryFormInput,
  type TimeEntryFormOutput,
} from "../schemas/time-entry-form.schema";
import {
  createTimeEntryAction,
  updateTimeEntryAction,
} from "../actions/mutate-time-entry.action";
import type { TimeEntry } from "../types";

interface Props {
  employeeId: string;
  entry?: TimeEntry;
}

const isoAt = (base: Date, hour: number, minute = 0): string => {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const TimeEntryForm = ({ employeeId, entry }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const { close } = useSheet();
  const isEdit = Boolean(entry);

  const baseDate = entry ? new Date(entry.entryDate) : new Date();
  const defaultValues: TimeEntryFormInput = {
    date: baseDate,
    startTime: entry?.startedAt ?? isoAt(baseDate, 8),
    endTime: entry?.endedAt ?? isoAt(baseDate, 17),
    breakMinutes: entry?.breakMinutes ?? 30,
    notes: entry?.notes ?? "",
  };

  const form = useForm<TimeEntryFormInput, unknown, TimeEntryFormOutput>({
    resolver: zodResolver(TimeEntryFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: TimeEntryFormOutput) => {
    const { success } =
      isEdit && entry
        ? await updateTimeEntryAction(entry.id, values)
        : await createTimeEntryAction(employeeId, values);
    if (success) {
      toast.success(tc("success"));
      close();
    } else {
      toast.error(tc("error"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
        <DatePickerFormField name="date" label="date" namespace="TimeTracking" />
        <div className="flex gap-4">
          <TimePickerFormField
            name="startTime"
            label="startTime"
            namespace="TimeTracking"
          />
          <TimePickerFormField
            name="endTime"
            label="endTime"
            namespace="TimeTracking"
          />
        </div>
        <NumberFormField
          name="breakMinutes"
          label="breakMinutes"
          namespace="TimeTracking"
          min={0}
          max={600}
          nullable={false}
        />
        <TextareaFormField name="notes" label="note" namespace="TimeTracking" />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {isEdit ? t("saveEntry") : t("addEntry")}
        </Button>
      </form>
    </Form>
  );
};
