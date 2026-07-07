"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { cn } from "@/lib/utils";

import type { AdmissionReminder } from "../actions/get-admission-reminders.action";
import {
  createAdmissionReminderAction,
  updateAdmissionReminderAction,
} from "../actions/mutate-admission-reminder.action";

export interface ReminderMember {
  id: string;
  name: string;
}

interface Props {
  applicationId: string;
  members: ReminderMember[];
  initial?: AdmissionReminder | null;
  onSaved: () => void;
  onCancel?: () => void;
  /** Compact variant used inside the activity composer tab. */
  compact?: boolean;
}

/** Sentinel select value meaning "assign to me" (→ null over the wire). */
const UNASSIGNED = "__unassigned__";

const PRESETS: Array<{ key: string; days: number; labelKey: string }> = [
  { key: "1d", days: 1, labelKey: "reminderPreset1d" },
  { key: "3d", days: 3, labelKey: "reminderPreset3d" },
  { key: "1w", days: 7, labelKey: "reminderPreset1w" },
  { key: "2w", days: 14, labelKey: "reminderPreset2w" },
];

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

const Schema = z.object({
  title: z.string().trim().min(1, { message: "required" }),
  dueDate: z.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  assignedToMembershipId: z.string(),
  note: z.string().max(5000).optional(),
});

type FormValues = z.infer<typeof Schema>;

export function ReminderForm({
  applicationId,
  members,
  initial,
  onSaved,
  onCancel,
  compact = false,
}: Props) {
  const t = useTranslations("Admissions");
  const isEdit = !!initial;

  const initialDue = initial ? new Date(initial.dueAt) : null;
  const memberOptions = useMemo(
    () => [
      { value: UNASSIGNED, label: t("reminderAssigneeUnassigned") },
      ...members.map((m) => ({ value: m.id, label: m.name })),
    ],
    [members, t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      title: initial?.title ?? "",
      dueDate: initialDue ?? addDays(new Date(), 7),
      time: initialDue
        ? initialDue.toLocaleTimeString("de-CH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "09:00",
      assignedToMembershipId: initial?.assignedToMembershipId ?? UNASSIGNED,
      note: initial?.note ?? "",
    },
  });

  const applyPreset = (days: number) => {
    form.setValue("dueDate", addDays(new Date(), days), {
      shouldValidate: true,
    });
  };

  const onSubmit = async (values: FormValues) => {
    const [hh, mm] = values.time.split(":").map(Number);
    const due = new Date(values.dueDate);
    due.setHours(hh || 9, mm || 0, 0, 0);
    const assignedToMembershipId =
      values.assignedToMembershipId === UNASSIGNED
        ? null
        : values.assignedToMembershipId;

    const res = isEdit
      ? await updateAdmissionReminderAction({
          id: initial!.id,
          applicationId,
          dueAt: due.toISOString(),
          title: values.title.trim(),
          note: values.note?.trim() || null,
          assignedToMembershipId,
        })
      : await createAdmissionReminderAction({
          applicationId,
          dueAt: due.toISOString(),
          title: values.title.trim(),
          note: values.note?.trim() || null,
          assignedToMembershipId,
        });

    if (!res.success) {
      toast.error(res.error ?? t("reminderCreateError"));
      return;
    }
    toast.success(t("reminderCreateOk"));
    if (!isEdit) {
      form.reset({
        title: "",
        dueDate: addDays(new Date(), 7),
        time: "09:00",
        assignedToMembershipId: UNASSIGNED,
        note: "",
      });
    }
    onSaved();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4", compact && "space-y-3")}
      >
        <InputFormField
          name="title"
          label="reminderTitle"
          namespace="Admissions"
          placeholder={t("reminderTitlePlaceholder")}
        />

        <div className="grid grid-cols-2 gap-3">
          <DatePickerFormField
            name="dueDate"
            label="reminderDueLabel"
            namespace="Admissions"
            disabledDate={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
          />
          <div className="space-y-[7px]">
            <Label className="text-[12.5px] font-semibold">{t("reminderTimeLabel")}</Label>
            <Input type="time" {...form.register("time")} />
          </div>
        </div>

        <div className="space-y-[7px]">
          <Label className="text-[12.5px] font-semibold">{t("reminderQuickSelect")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.days)}
                className="inline-flex h-7 items-center rounded-full border border-border bg-background px-3 text-[11px] font-medium text-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <SelectFormField
          name="assignedToMembershipId"
          label="reminderAssignee"
          namespace="Admissions"
          placeholder="reminderAssigneeUnassigned"
          options={memberOptions}
          translateOptions={false}
        />

        <TextareaFormField
          name="note"
          label="reminderNoteLabel"
          namespace="Admissions"
          placeholder={t("reminderNotePlaceholder")}
        />

        <div className="flex items-center gap-3 rounded-md border border-dashed bg-muted/30 px-3 py-2">
          <span className="flex-1 text-[11.5px] leading-snug text-muted-foreground">
            {t("reminderAutoTaskHint")}
          </span>
          <Badge variant="green" className="shrink-0">
            {t("reminderAutoTaskBadge")}
          </Badge>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              {t("reminderCancel")}
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            )}
            {isEdit ? t("reminderSubmit") : t("reminderNewSubmit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
