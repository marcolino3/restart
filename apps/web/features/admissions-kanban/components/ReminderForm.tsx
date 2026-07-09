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
import {
  DateTimeCalendarFormField,
  type DateTimePreset,
} from "@/components/form/form-fields/DateTimeCalendarFormField";
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
  dueAt: z.date(),
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

  // Quick-select presets rendered inside the date-time popover (left column).
  const presets = useMemo<DateTimePreset[]>(
    () =>
      PRESETS.map((p) => ({
        key: p.key,
        label: t(p.labelKey),
        resolve: () => addDays(new Date(), p.days),
      })),
    [t],
  );

  const defaultDueAt = () => {
    const d = addDays(new Date(), 7);
    d.setHours(9, 0, 0, 0);
    return d;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      title: initial?.title ?? "",
      dueAt: initialDue ?? defaultDueAt(),
      assignedToMembershipId: initial?.assignedToMembershipId ?? UNASSIGNED,
      note: initial?.note ?? "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const due = new Date(values.dueAt);
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
        dueAt: defaultDueAt(),
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

        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
          <DateTimeCalendarFormField
            name="dueAt"
            label="reminderDueLabel"
            namespace="Admissions"
            presets={presets}
            disabledDate={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
          />

          <SelectFormField
            name="assignedToMembershipId"
            label="reminderAssignee"
            namespace="Admissions"
            placeholder="reminderAssigneeUnassigned"
            options={memberOptions}
            translateOptions={false}
          />
        </div>

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
