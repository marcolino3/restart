"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { TimeScrollFormField } from "@/components/form/form-fields/TimeScrollFormField";
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
  /** Vorbelegtes Datum für neue Einträge (z.B. "+ Eintrag" pro Wochentag). */
  defaultDate?: Date;
}

const pad = (n: number) => String(n).padStart(2, "0");

const timeOf = (iso: string): string => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MAX_PAST_DAYS = 7;

const isDateDisabled = (date: Date): boolean => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const earliest = new Date();
  earliest.setDate(earliest.getDate() - MAX_PAST_DAYS);
  earliest.setHours(0, 0, 0, 0);
  return date > today || date < earliest;
};

export const TimeEntryForm = ({ employeeId, entry, defaultDate }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const { close } = useSheet();
  const isEdit = Boolean(entry);

  const baseDate = entry
    ? new Date(entry.entryDate)
    : (defaultDate ?? new Date());
  const defaultValues: TimeEntryFormInput = {
    date: baseDate,
    startTime: entry?.startedAt ? timeOf(entry.startedAt) : "08:00",
    endTime: entry?.endedAt ? timeOf(entry.endedAt) : "17:00",
    breakMinutes: entry?.breakMinutes ?? 30,
    notes: entry?.notes ?? "",
  };

  const form = useForm<TimeEntryFormInput, unknown, TimeEntryFormOutput>({
    resolver: zodResolver(TimeEntryFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: TimeEntryFormOutput) => {
    const result =
      isEdit && entry
        ? await updateTimeEntryAction(entry.id, values)
        : await createTimeEntryAction(employeeId, values);
    if (result.success) {
      toast.success(tc("success"));
      close();
    } else {
      toast.error(
        result.error.includes("TIME_TRACKING_DUPLICATE_DAY")
          ? t("errorDuplicateDay")
          : tc("error")
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
        <DatePickerFormField
          name="date"
          label="date"
          namespace="TimeTracking"
          showWeekday
          disabledDate={isDateDisabled}
        />
        <div className="flex gap-4">
          <TimeScrollFormField
            name="startTime"
            label="startTime"
            namespace="TimeTracking"
          />
          <TimeScrollFormField
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
