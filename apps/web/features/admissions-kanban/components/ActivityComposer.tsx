"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CalendarClock,
  Loader2,
  Mail,
  Phone,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { DateTimePickerFormField } from "@/components/form/form-fields/DateTimePickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { cn } from "@/lib/utils";

import { createAdmissionActivityAction } from "../actions/create-admission-activity.action";
import type {
  AdmissionActivity,
  AdmissionActivityDirection,
  AdmissionActivityType,
} from "../actions/get-admission-activities.action";
import { updateAdmissionActivityAction } from "../actions/update-admission-activity.action";
import { ReminderForm, type ReminderMember } from "./ReminderForm";

interface Props {
  applicationId: string;
  initial?: AdmissionActivity | null;
  onSaved: () => void;
  onCancel?: () => void;
  /** Assignee options — enables the "Erinnerung" composer tab when provided. */
  members?: ReminderMember[];
  /** Called after a reminder is created from the composer's Erinnerung tab. */
  onReminderSaved?: () => void;
}

const ACTIVITY_TYPES: Array<{
  value: AdmissionActivityType;
  icon: typeof Phone;
  labelKey: string;
}> = [
  { value: "CALL", icon: Phone, labelKey: "activityTypeCall" },
  { value: "EMAIL", icon: Mail, labelKey: "activityTypeEmail" },
  { value: "MEETING", icon: CalendarClock, labelKey: "activityTypeMeeting" },
  { value: "NOTE", icon: StickyNote, labelKey: "activityTypeNote" },
];

const Schema = z.object({
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE"]),
  occurredAt: z.date(),
  subject: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
  direction: z.enum(["INBOUND", "OUTBOUND"]).nullable().optional(),
  durationMinutes: z.string().regex(/^\d*$/, { message: "numeric" }).optional(),
  location: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof Schema>;

export function ActivityComposer({
  applicationId,
  initial,
  onSaved,
  onCancel,
  members,
  onReminderSaved,
}: Props) {
  const t = useTranslations("Admissions");
  const [reminderMode, setReminderMode] = useState(false);
  // The "Erinnerung" tab is only offered on the create composer (not when
  // editing an existing activity) and only when assignee options are available.
  const showReminderTab = !initial && !!members;

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      type: initial?.type ?? "NOTE",
      occurredAt: initial?.occurredAt
        ? new Date(initial.occurredAt)
        : new Date(),
      subject: initial?.subject ?? "",
      body: initial?.body ?? "",
      direction: (initial?.direction as AdmissionActivityDirection) ?? null,
      durationMinutes:
        initial?.durationMinutes != null ? String(initial.durationMinutes) : "",
      location: initial?.location ?? "",
    },
  });
  const [saving, setSaving] = useState(false);

  const type = form.watch("type");
  const direction = form.watch("direction") ?? null;

  const isEdit = !!initial;
  const showDirection = type === "CALL" || type === "EMAIL";
  const showDuration = type === "CALL" || type === "MEETING";
  const showLocation = type === "MEETING";

  // When type changes, blank out the now-irrelevant inputs so we don't post
  // stale values from a previous selection.
  useEffect(() => {
    if (!showDirection) form.setValue("direction", null);
    if (!showDuration) form.setValue("durationMinutes", "");
    if (!showLocation) form.setValue("location", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const placeholderKey =
    type === "CALL"
      ? "activitySubjectPlaceholderCall"
      : type === "EMAIL"
        ? "activitySubjectPlaceholderEmail"
        : type === "MEETING"
          ? "activitySubjectPlaceholderMeeting"
          : "activitySubjectPlaceholderNote";

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const payload = {
      type: values.type,
      occurredAt: values.occurredAt.toISOString(),
      subject: values.subject?.trim() || null,
      body: values.body?.trim() || null,
      direction: showDirection ? (values.direction ?? null) : null,
      durationMinutes:
        showDuration && values.durationMinutes?.trim()
          ? Number.parseInt(values.durationMinutes, 10) || null
          : null,
      location: showLocation ? values.location?.trim() || null : null,
    };
    const res = isEdit
      ? await updateAdmissionActivityAction({
          id: initial!.id,
          applicationId,
          ...payload,
        })
      : await createAdmissionActivityAction({ applicationId, ...payload });
    setSaving(false);
    if (!res.success) {
      toast.error(
        res.error ?? t(isEdit ? "activityUpdateError" : "activityCreateError"),
      );
      return;
    }
    toast.success(t(isEdit ? "activityUpdateOk" : "activityCreateOk"));
    if (!isEdit) {
      form.reset({
        type: "NOTE",
        occurredAt: new Date(),
        subject: "",
        body: "",
        direction: null,
        durationMinutes: "",
        location: "",
      });
    }
    onSaved();
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      {/* Type segmented control — activity types + optional Erinnerung tab. */}
      <div className="flex flex-wrap gap-1">
        {ACTIVITY_TYPES.map(({ value, icon: Icon, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setReminderMode(false);
              form.setValue("type", value);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
              !reminderMode && type === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(labelKey)}
          </button>
        ))}
        {showReminderTab && (
          <button
            type="button"
            onClick={() => setReminderMode(true)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
              reminderMode
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <Bell className="h-3.5 w-3.5" />
            {t("activityTypeReminder")}
          </button>
        )}
      </div>

      {reminderMode && members ? (
        <ReminderForm
          applicationId={applicationId}
          members={members}
          onSaved={() => onReminderSaved?.()}
          compact
        />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DateTimePickerFormField
                name="occurredAt"
                label="activityOccurredAt"
                namespace="Admissions"
              />
              {showDirection && (
                <div className="space-y-[7px]">
                  <Label className="text-[12.5px] font-semibold">{t("activityDirection")}</Label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        form.setValue(
                          "direction",
                          direction === "INBOUND" ? null : "INBOUND",
                        )
                      }
                      className={cn(
                        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs",
                        direction === "INBOUND"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                      {t("activityDirectionInbound")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        form.setValue(
                          "direction",
                          direction === "OUTBOUND" ? null : "OUTBOUND",
                        )
                      }
                      className={cn(
                        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs",
                        direction === "OUTBOUND"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {t("activityDirectionOutbound")}
                    </button>
                  </div>
                </div>
              )}
              {showDuration && (
                <InputFormField
                  name="durationMinutes"
                  label="activityDuration"
                  namespace="Admissions"
                  type="number"
                  placeholder="15"
                />
              )}
              {showLocation && (
                <div className="sm:col-span-2">
                  <InputFormField
                    name="location"
                    label="activityLocation"
                    namespace="Admissions"
                  />
                </div>
              )}
            </div>

            <InputFormField
              name="subject"
              label="activitySubject"
              namespace="Admissions"
              placeholder={t(placeholderKey)}
            />

            <TextareaFormField
              name="body"
              label="activityBody"
              namespace="Admissions"
              placeholder={t("activityBodyPlaceholder")}
            />

            <div className="flex justify-end gap-2 pt-1">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={saving}
                >
                  {t("activityCancel")}
                </Button>
              )}
              <Button type="submit" size="sm" disabled={saving}>
                {saving && (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                )}
                {t("activitySubmit")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
