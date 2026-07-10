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
  Paperclip,
  Phone,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentUploadDialog } from "@/components/common/DocumentUploadDialog";
import { DateTimeCalendarFormField } from "@/components/form/form-fields/DateTimeCalendarFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { API_URL } from "@/constants/api-url";
import { cn } from "@/lib/utils";

import { createAdmissionActivityAction } from "../actions/create-admission-activity.action";
import type {
  AdmissionActivity,
  AdmissionActivityDirection,
  AdmissionActivityType,
} from "../actions/get-admission-activities.action";
import { updateAdmissionActivityAction } from "../actions/update-admission-activity.action";
import type { AdmissionAppointmentType } from "../types";
import {
  AppointmentForm,
  type AppointmentMember,
} from "./AppointmentForm";
import {
  EmailComposerForm,
  type EmailComposerDraft,
} from "./EmailComposerForm";
import { ReminderForm, type ReminderMember } from "./ReminderForm";
import type { SendableContact, SendableTemplate } from "./SendEmailDialog";

/** A contact person offered in the call "Mit" (with whom) dropdown. */
export interface WithOption {
  id: string;
  /** Display name shown in the dropdown and stored as the activity subject. */
  name: string;
  /** Optional role label, e.g. "Mutter", shown muted next to the name. */
  role?: string | null;
}

/** Sentinel value for the "andere" (other) option — opens a free input. */
const WITH_OTHER = "__other__";

interface Props {
  applicationId: string;
  initial?: AdmissionActivity | null;
  onSaved: () => void;
  onCancel?: () => void;
  /**
   * Contact persons of the application, offered in the call "Mit" dropdown.
   * When present, the "Mit" field becomes a select (contacts + "andere");
   * "andere" reveals a free text input. Falls back to a plain input if empty.
   */
  withOptions?: WithOption[];
  /** Assignee options — enables the "Erinnerung" + "Termin" composer tabs when provided. */
  members?: ReminderMember[];
  /** Called after a reminder is created from the composer's Erinnerung tab. */
  onReminderSaved?: () => void;
  /** Appointment types — enables the "Termin" composer tab when provided. */
  appointmentTypes?: AdmissionAppointmentType[];
  /** Called after an appointment is created from the composer's Termin tab. */
  onAppointmentSaved?: () => void;
  /**
   * Called after a document is attached from the Notiz tab, so the parent can
   * reload the documents block. When omitted, the attach button is hidden.
   */
  onDocumentUploaded?: () => void;
  /** Email templates — enables the "E-Mail" composer tab when provided. */
  emailTemplates?: SendableTemplate[];
  /** Contact persons with an email address, for the "E-Mail" tab recipient. */
  emailContacts?: SendableContact[];
  /** Called after an email is sent from the composer's E-Mail tab. */
  onEmailSent?: () => void;
  /** Opens the full SendEmailDialog prefilled with the inline draft. */
  onEmailPreview?: (draft: EmailComposerDraft) => void;
}

const ACTIVITY_TYPES: Array<{
  value: AdmissionActivityType;
  icon: typeof Phone;
  labelKey: string;
}> = [
  // "MEETING" (Termin) intentionally not offered here — real appointments are
  // created via the dedicated "Termin" (appointment) tab below. Existing MEETING
  // activities still render in the timeline; the enum keeps the value.
  // "EMAIL" is likewise a dedicated tab (the send form), not an activity type
  // logged here — see the EmailComposerForm tab below.
  // Order mirrors the design: Notiz · Anruf first.
  { value: "NOTE", icon: StickyNote, labelKey: "activityTypeNote" },
  { value: "CALL", icon: Phone, labelKey: "activityTypeCall" },
];

/**
 * Call outcome — UI-only for now. There is no `outcome`/`callResult` field on
 * `AdmissionActivity` in the backend (entity/DTO checked: only
 * type/occurredAt/subject/body/direction/durationMinutes/location exist), so
 * this selection is NOT persisted yet. Adding it requires a backend enum
 * migration (`AdmissionActivityOutcome`: REACHED/NOT_REACHED/CALLBACK_ARRANGED)
 * — deliberately left out of this PR per the "no enum migration mixed with UI
 * work" rule. TODO: once the backend field exists, wire this into the submit
 * payload the same way `direction` is wired below.
 */
const CALL_OUTCOMES: Array<{ value: string; labelKey: string }> = [
  { value: "REACHED", labelKey: "activityOutcomeReached" },
  { value: "NOT_REACHED", labelKey: "activityOutcomeNotReached" },
  { value: "CALLBACK_ARRANGED", labelKey: "activityOutcomeCallbackArranged" },
];
type CallOutcome = (typeof CALL_OUTCOMES)[number]["value"];

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
  withOptions,
  members,
  onReminderSaved,
  appointmentTypes,
  onAppointmentSaved,
  onDocumentUploaded,
  emailTemplates,
  emailContacts,
  onEmailSent,
  onEmailPreview,
}: Props) {
  const t = useTranslations("Admissions");
  const tDoc = useTranslations("Documents");
  const [reminderMode, setReminderMode] = useState(false);
  const [appointmentMode, setAppointmentMode] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  // The "E-Mail"/"Erinnerung"/"Termin" tabs are only offered on the create
  // composer (not when editing an existing activity) and only when their
  // options are given.
  const showReminderTab = !initial && !!members;
  const showAppointmentTab = !initial && !!members && !!appointmentTypes;
  const showEmailTab =
    !initial && !!emailTemplates && !!emailContacts && !!onEmailPreview;

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
  // UI-only — see CALL_OUTCOMES comment above; not sent to the backend yet.
  const [callOutcome, setCallOutcome] = useState<CallOutcome | null>(null);

  const hasWithOptions = !!withOptions && withOptions.length > 0;
  // The call "Mit" dropdown selection: a contact id, WITH_OTHER (free input),
  // or "" (nothing chosen yet). Only used when hasWithOptions.
  const initialWithId =
    initial?.subject && hasWithOptions
      ? (withOptions!.find((o) => o.name === initial.subject)?.id ?? WITH_OTHER)
      : "";
  const [withSelection, setWithSelection] = useState<string>(initialWithId);
  const withIsOther = withSelection === WITH_OTHER;

  const type = form.watch("type");
  const direction = form.watch("direction") ?? null;

  const isEdit = !!initial;
  // A note is deliberately minimal (design BF): just the body textarea + submit,
  // no subject/date/direction fields. occurredAt stays at "now".
  const isNote = type === "NOTE";
  const showWith = type === "CALL";
  // The outcome (Erreicht/Nicht erreicht/Rückruf vereinbart) only makes sense
  // for an OUTBOUND call — on an inbound call the contact already reached us.
  const showOutcome = type === "CALL" && direction === "OUTBOUND";
  const showDirection = type === "CALL" || type === "EMAIL";
  const showDuration = type === "CALL" || type === "MEETING";
  const showLocation = type === "MEETING";
  // Follow-up after an outbound call, chosen by outcome:
  //  - "Nicht erreicht"      → schedule a Reminder (call again later)
  //  - "Rückruf vereinbart"  → schedule a concrete Appointment
  const showFollowUpReminder = showOutcome && callOutcome === "NOT_REACHED";
  const showFollowUpAppointment =
    showOutcome && callOutcome === "CALLBACK_ARRANGED";
  // Prefill the appointment title with the "Mit" contact when known.
  const followUpTitle = form.watch("subject")?.trim() || undefined;

  // When type changes, blank out the now-irrelevant inputs so we don't post
  // stale values from a previous selection.
  useEffect(() => {
    if (!showDirection) form.setValue("direction", null);
    if (!showDuration) form.setValue("durationMinutes", "");
    if (!showLocation) form.setValue("location", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Clear the outcome whenever the outcome field is hidden (type change or a
  // non-outbound direction), so a stale selection can't linger.
  useEffect(() => {
    if (!showOutcome) setCallOutcome(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOutcome]);

  const placeholderKey =
    type === "CALL"
      ? "activityWithPlaceholder"
      : type === "EMAIL"
        ? "activitySubjectPlaceholderEmail"
        : type === "MEETING"
          ? "activitySubjectPlaceholderMeeting"
          : "activitySubjectPlaceholderNote";

  // Attach a document from the Notiz tab — same endpoint as the documents
  // block (multipart POST scoped by applicationId), then let the parent reload.
  const doUploadDocument = async (data: {
    file: File;
    title: string;
    tags: string[];
  }): Promise<boolean> => {
    try {
      const fd = new FormData();
      fd.append("file", data.file);
      const params = new URLSearchParams({ applicationId });
      if (data.title) params.set("title", data.title);
      if (data.tags.length > 0) params.set("tags", data.tags.join(","));
      const res = await fetch(
        `${API_URL}/admission-documents?${params.toString()}`,
        { method: "POST", body: fd, credentials: "include" },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        toast.error(body?.message ?? tDoc("uploadError"));
        return false;
      }
      toast.success(tDoc("uploadOk"));
      onDocumentUploaded?.();
      return true;
    } catch {
      toast.error(tDoc("uploadError"));
      return false;
    }
  };

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
      setCallOutcome(null);
      setWithSelection("");
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
              setAppointmentMode(false);
              setEmailMode(false);
              form.setValue("type", value);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
              !reminderMode && !appointmentMode && !emailMode && type === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(labelKey)}
          </button>
        ))}
        {showEmailTab && (
          <button
            type="button"
            onClick={() => {
              setReminderMode(false);
              setAppointmentMode(false);
              setEmailMode(true);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
              emailMode
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <Mail className="h-3.5 w-3.5" />
            {t("activityTypeEmail")}
          </button>
        )}
        {showReminderTab && (
          <button
            type="button"
            onClick={() => {
              setAppointmentMode(false);
              setEmailMode(false);
              setReminderMode(true);
            }}
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
        {showAppointmentTab && (
          <button
            type="button"
            onClick={() => {
              setReminderMode(false);
              setEmailMode(false);
              setAppointmentMode(true);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
              appointmentMode
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {t("activityTypeAppointment")}
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
      ) : appointmentMode && members && appointmentTypes ? (
        <AppointmentForm
          applicationId={applicationId}
          types={appointmentTypes}
          members={members as AppointmentMember[]}
          onSaved={() => onAppointmentSaved?.()}
        />
      ) : emailMode && emailTemplates && emailContacts && onEmailPreview ? (
        <EmailComposerForm
          applicationId={applicationId}
          templates={emailTemplates}
          contacts={emailContacts}
          onSent={() => onEmailSent?.()}
          onPreview={onEmailPreview}
        />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {!isNote && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {showWith ? (
                <div className="space-y-[7px]">
                  <Label className="text-[12.5px] font-semibold">
                    {t("activityWith")}
                  </Label>
                  {hasWithOptions ? (
                    <div className="space-y-2">
                      <Select
                        value={withSelection}
                        onValueChange={(v) => {
                          setWithSelection(v);
                          if (v === WITH_OTHER) {
                            form.setValue("subject", "");
                          } else {
                            const opt = withOptions!.find((o) => o.id === v);
                            form.setValue("subject", opt?.name ?? "");
                          }
                        }}
                      >
                        <SelectTrigger className="rounded-ctl!">
                          <SelectValue placeholder={t("activityWithSelect")} />
                        </SelectTrigger>
                        <SelectContent>
                          {withOptions!.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.name}
                              {o.role ? (
                                <span className="ml-1.5 text-muted-foreground">
                                  · {o.role}
                                </span>
                              ) : null}
                            </SelectItem>
                          ))}
                          <SelectItem value={WITH_OTHER}>
                            {t("activityWithOther")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {withIsOther && (
                        <Input
                          autoFocus
                          value={form.watch("subject") ?? ""}
                          onChange={(e) =>
                            form.setValue("subject", e.target.value)
                          }
                          placeholder={t("activityWithOtherPlaceholder")}
                          className="rounded-ctl!"
                        />
                      )}
                    </div>
                  ) : (
                    <InputFormField
                      name="subject"
                      namespace="Admissions"
                      placeholder={t(placeholderKey)}
                    />
                  )}
                </div>
              ) : (
                <InputFormField
                  name="subject"
                  label="activitySubject"
                  namespace="Admissions"
                  placeholder={t(placeholderKey)}
                />
              )}
              <DateTimeCalendarFormField
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
            )}

            {showOutcome && (
              <div className="space-y-[7px]">
                <Label className="text-[12.5px] font-semibold">
                  {t("activityOutcome")}
                </Label>
                <div className="flex flex-wrap gap-1">
                  {CALL_OUTCOMES.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setCallOutcome(callOutcome === value ? null : value)
                      }
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition",
                        callOutcome === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up (separate save from the call activity):
                - "Nicht erreicht"     → a Reminder to call again.
                - "Rückruf vereinbart" → a concrete Appointment, prefilled
                  with the "Mit" contact as its title. */}
            {showFollowUpReminder && members && (
              <div className="space-y-2 rounded-md border border-dashed bg-muted/30 p-3">
                <Label className="text-[12.5px] font-semibold">
                  {t("activityFollowUpReminder")}
                </Label>
                <ReminderForm
                  applicationId={applicationId}
                  members={members}
                  onSaved={() => {
                    onReminderSaved?.();
                    toast.success(t("reminderCreateOk"));
                  }}
                  compact
                />
              </div>
            )}
            {showFollowUpAppointment && members && appointmentTypes && (
              <div className="space-y-2 rounded-md border border-dashed bg-muted/30 p-3">
                <Label className="text-[12.5px] font-semibold">
                  {t("activityFollowUpAppointment")}
                </Label>
                <AppointmentForm
                  applicationId={applicationId}
                  types={appointmentTypes}
                  members={members as AppointmentMember[]}
                  defaultTitle={followUpTitle}
                  onSaved={() => {
                    onAppointmentSaved?.();
                    toast.success(t("appointmentCreateOk"));
                  }}
                />
              </div>
            )}

            <TextareaFormField
              name="body"
              label={isNote ? undefined : "activityBody"}
              namespace="Admissions"
              placeholder={t(
                isNote
                  ? "activityNotePlaceholder"
                  : type === "CALL"
                    ? "activityCallNotePlaceholder"
                    : "activityBodyPlaceholder",
              )}
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              {isNote && onDocumentUploaded && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mr-auto"
                  onClick={() => setUploadOpen(true)}
                  disabled={saving}
                >
                  <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                  {t("activityAttachDocument")}
                </Button>
              )}
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
                {t(type === "CALL" ? "activityLogSubmit" : "activitySubmit")}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {onDocumentUploaded && (
        <DocumentUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onSubmit={doUploadDocument}
          namespace="Documents"
        />
      )}
    </div>
  );
}
