"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { DateTimeCalendarFormField } from "@/components/form/form-fields/DateTimeCalendarFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { cn } from "@/lib/utils";

import type { AdmissionAppointment } from "../actions/get-admission-appointments.action";
import {
  createAdmissionAppointmentAction,
  updateAdmissionAppointmentAction,
} from "../actions/mutate-admission-appointment.action";

export interface AppointmentTypeOption {
  id: string;
  label: string;
  color?: string | null;
}

export interface AppointmentMember {
  id: string;
  name: string;
}

interface Props {
  applicationId: string;
  types: AppointmentTypeOption[];
  /** Assignee options (org memberships). */
  members: AppointmentMember[];
  initial?: AdmissionAppointment | null;
  onSaved: () => void;
  onCancel?: () => void;
  /** Compact variant. */
  compact?: boolean;
  /** Prefills the title of a new appointment (ignored when editing `initial`). */
  defaultTitle?: string;
}

/** Sentinel select value meaning "no type" (→ null over the wire). */
const NO_TYPE = "__none__";

/** Default start for new appointments: today 09:00. */
const defaultScheduledAt = () => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
};

const Schema = z
  .object({
    appointmentTypeId: z.string(),
    title: z.string().max(200).optional(),
    scheduledAt: z.date(),
    // Period end — optional; a period must end after it starts (refined below).
    isPeriod: z.boolean(),
    endAt: z.date().optional(),
    assignedToMembershipIds: z.array(z.string()),
    durationMinutes: z.string().optional(),
    location: z.string().max(500).optional(),
    note: z.string().max(5000).optional(),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULING"]),
  })
  .refine((v) => !v.isPeriod || !!v.endAt, {
    path: ["endAt"],
    message: "required",
  })
  .refine(
    (v) =>
      !v.isPeriod ||
      !v.endAt ||
      v.endAt.getTime() > v.scheduledAt.getTime(),
    { path: ["endAt"], message: "endBeforeStart" },
  );

type FormValues = z.infer<typeof Schema>;

export function AppointmentForm({
  applicationId,
  types,
  members,
  initial,
  onSaved,
  onCancel,
  compact = false,
  defaultTitle,
}: Props) {
  const t = useTranslations("Admissions");
  const isEdit = !!initial;

  const initialAt = initial ? new Date(initial.scheduledAt) : null;
  const initialEnd = initial?.endsAt ? new Date(initial.endsAt) : null;
  const typeOptions = useMemo(
    () => [
      { value: NO_TYPE, label: t("appointmentTypeNone") },
      ...types.map((tp) => ({ value: tp.id, label: tp.label })),
    ],
    [types, t],
  );

  const memberOptions = useMemo(
    () => members.map((m) => ({ value: m.id, label: m.name })),
    [members],
  );

  const durationOptions = useMemo(
    () =>
      [15, 30, 45, 60, 90, 120].map((m) => ({
        value: String(m),
        label: t("appointmentDurationOption", { minutes: m }),
      })),
    [t],
  );

  const statusOptions = useMemo(
    () => [
      { value: "SCHEDULED", label: t("appointmentStatusScheduled") },
      { value: "COMPLETED", label: t("appointmentStatusCompleted") },
      { value: "CANCELLED", label: t("appointmentStatusCancelled") },
      { value: "RESCHEDULING", label: t("appointmentStatusRescheduling") },
    ],
    [t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      appointmentTypeId: initial?.appointmentTypeId ?? NO_TYPE,
      title: initial?.title ?? defaultTitle ?? "",
      scheduledAt: initialAt ?? defaultScheduledAt(),
      isPeriod: !!initialEnd,
      endAt: initialEnd ?? undefined,
      assignedToMembershipIds: initial?.assignedToMembershipIds ?? [],
      durationMinutes:
        initial?.durationMinutes != null
          ? String(initial.durationMinutes)
          : "",
      location: initial?.location ?? "",
      note: initial?.note ?? "",
      status: initial?.status ?? "SCHEDULED",
    },
  });

  const isPeriod = form.watch("isPeriod");
  const scheduledAt = form.watch("scheduledAt");
  // The end of a period can never precede its start: block every day before the
  // selected start date in the end date-picker.
  const startDayFloor = useMemo(() => {
    const d = new Date(scheduledAt ?? new Date());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [scheduledAt]);

  const onSubmit = async (values: FormValues) => {
    const endsAt =
      values.isPeriod && values.endAt ? values.endAt.toISOString() : null;

    const appointmentTypeId =
      values.appointmentTypeId === NO_TYPE ? null : values.appointmentTypeId;
    const title = values.title?.trim() || null;
    const assignedToMembershipIds = values.assignedToMembershipIds;
    const durationMinutes = values.durationMinutes?.trim()
      ? Number(values.durationMinutes)
      : null;

    const res = isEdit
      ? await updateAdmissionAppointmentAction({
          id: initial!.id,
          applicationId,
          appointmentTypeId,
          title,
          scheduledAt: values.scheduledAt.toISOString(),
          endsAt,
          assignedToMembershipIds,
          durationMinutes,
          location: values.location?.trim() || null,
          note: values.note?.trim() || null,
          status: values.status,
        })
      : await createAdmissionAppointmentAction({
          applicationId,
          appointmentTypeId,
          title,
          scheduledAt: values.scheduledAt.toISOString(),
          endsAt,
          assignedToMembershipIds,
          durationMinutes,
          location: values.location?.trim() || null,
          note: values.note?.trim() || null,
        });

    if (!res.success) {
      toast.error(
        res.error ??
          (isEdit ? t("appointmentUpdateError") : t("appointmentCreateError")),
      );
      return;
    }
    toast.success(isEdit ? t("appointmentUpdateOk") : t("appointmentCreateOk"));
    if (!isEdit) {
      form.reset({
        appointmentTypeId: NO_TYPE,
        title: "",
        scheduledAt: defaultScheduledAt(),
        isPeriod: false,
        endAt: undefined,
        assignedToMembershipIds: [],
        durationMinutes: "",
        location: "",
        note: "",
        status: "SCHEDULED",
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
        <div className="grid grid-cols-1 items-start gap-x-4 gap-y-3 sm:grid-cols-2">
          {/* Row 1: type · title */}
          <SelectFormField
            name="appointmentTypeId"
            label="appointmentTypeLabel"
            namespace="Admissions"
            placeholder="appointmentTypeNone"
            options={typeOptions}
            translateOptions={false}
          />
          <InputFormField
            name="title"
            label="appointmentTitleLabel"
            namespace="Admissions"
            placeholder={t("appointmentTitlePlaceholder")}
          />

          {/* Row 2: when · duration + multi-day checkbox */}
          <DateTimeCalendarFormField
            name="scheduledAt"
            label="appointmentWhenLabel"
            namespace="Admissions"
          />
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <SelectFormField
                name="durationMinutes"
                label="appointmentDurationLabel"
                namespace="Admissions"
                placeholder="appointmentDurationPlaceholder"
                options={durationOptions}
                translateOptions={false}
              />
            </div>
            <div className="flex h-9 shrink-0 items-center gap-2">
              <Checkbox
                id="appointment-is-period"
                checked={isPeriod}
                onCheckedChange={(v) => {
                  const checked = v === true;
                  form.setValue("isPeriod", checked, { shouldValidate: true });
                  if (!checked) {
                    form.setValue("endAt", undefined, {
                      shouldValidate: true,
                    });
                  }
                }}
              />
              <Label
                htmlFor="appointment-is-period"
                className="text-xs font-medium text-muted-foreground"
              >
                {t("appointmentPeriodCheckbox")}
              </Label>
            </div>
          </div>

          {/* Period end — only when multi-day is enabled (single column). */}
          {isPeriod && (
            <DateTimeCalendarFormField
              name="endAt"
              label="appointmentEndDateLabel"
              namespace="Admissions"
              disabledDate={(date) => date < startDayFloor}
            />
          )}

          {/* Row 3: assignees · location */}
          <ComboboxFormField
            name="assignedToMembershipIds"
            namespace="Admissions"
            label="appointmentAssignee"
            placeholder="appointmentAssigneeUnassigned"
            searchPlaceholder="appointmentAssigneeSearch"
            emptyText="appointmentAssigneeEmpty"
            options={memberOptions}
            translateOptions={false}
            multiple
            modal
          />
          <InputFormField
            name="location"
            label="appointmentLocationLabel"
            namespace="Admissions"
          />

          {/* Row 4: note across the full width */}
          <div className={cn("sm:col-span-2")}>
            <TextareaFormField
              name="note"
              label="appointmentNoteLabel"
              namespace="Admissions"
            />
          </div>

          {isEdit && (
            <div className={cn("sm:col-span-2")}>
              <SelectFormField
                name="status"
                label="appointmentStatusLabel"
                namespace="Admissions"
                options={statusOptions}
                translateOptions={false}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {t("appointmentHint")}
          </p>
          <div className="flex shrink-0 gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={form.formState.isSubmitting}
              >
                {t("appointmentCancel")}
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
              {isEdit ? t("appointmentSubmit") : t("appointmentNewSubmit")}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
