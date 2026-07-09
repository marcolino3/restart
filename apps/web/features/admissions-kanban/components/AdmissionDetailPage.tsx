"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  GraduationCap,
  Mail,
  Mars,
  Pencil,
  Phone,
  Plus,
  Send,
  Users2,
  Venus,
  VenusAndMars,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getAdmissionActivitiesAction } from "../actions/get-admission-activities.action";
import { getAdmissionRemindersAction } from "../actions/get-admission-reminders.action";
import { getAdmissionAppointmentsAction } from "../actions/get-admission-appointments.action";
import { getAdmissionDocumentsAction } from "../actions/get-admission-documents.action";
import { getAdmissionEmailsAction } from "../actions/get-admission-emails.action";
import type {
  AdmissionApplicationDetail,
  AdmissionDetailContact,
} from "../actions/get-application-detail.action";
import type { AdmissionActivity } from "../actions/get-admission-activities.action";
import type { AdmissionReminder } from "../actions/get-admission-reminders.action";
import type { AdmissionAppointment } from "../actions/get-admission-appointments.action";
import type { AdmissionDocument } from "../actions/get-admission-documents.action";
import type { AdmissionEmail } from "../actions/get-admission-emails.action";
import type {
  AdmissionAppointmentType,
  AdmissionRejectionReason,
  AdmissionSource,
  KanbanStage,
} from "../types";
import { ActivityComposer } from "./ActivityComposer";
import { ActivityTimeline } from "./ActivityTimeline";
import { AdmissionRemindersBlock } from "./AdmissionRemindersBlock";
import { AdmissionAppointmentsBlock } from "./AdmissionAppointmentsBlock";
import { AdmissionDocumentsBlock } from "./AdmissionDocumentsBlock";
import { AdmissionEmailHistory } from "./AdmissionEmailHistory";
import type { GradeLevelOption } from "./CreateApplicationDialog";
import {
  EditApplicationDetailsDialog,
  type SchoolClassOption,
} from "./EditApplicationDetailsDialog";
import { RejectApplicationDialog } from "./RejectApplicationDialog";
import { FinalizeEnrollmentDialog } from "./FinalizeEnrollmentDialog";
import { SendEmailDialog, type SendableTemplate } from "./SendEmailDialog";
import type { ReminderMember } from "./ReminderForm";

interface Props {
  detail: AdmissionApplicationDetail;
  stages: KanbanStage[];
  rejectionReasons: AdmissionRejectionReason[];
  initialActivities: AdmissionActivity[];
  initialReminders: AdmissionReminder[];
  initialAppointments: AdmissionAppointment[];
  appointmentTypes: AdmissionAppointmentType[];
  initialDocuments: AdmissionDocument[];
  initialEmails: AdmissionEmail[];
  emailTemplates: SendableTemplate[];
  /** Org memberships for reminder assignee pickers. */
  members: ReminderMember[];
  /** Org grade levels (flat, incl. subgroups) for the edit-details dialog. */
  gradeLevels: GradeLevelOption[];
  /** Org school classes for the edit-details dialog. */
  schoolClasses: SchoolClassOption[];
  /** Org intake channels ("Eingangskanäle") for the edit-details dialog. */
  sources: AdmissionSource[];
  canEdit: boolean;
  canEnroll: boolean;
  canSendEmail: boolean;
  canReject: boolean;
}

export function AdmissionDetailPage({
  detail,
  stages,
  rejectionReasons,
  initialActivities,
  initialReminders,
  initialAppointments,
  appointmentTypes,
  initialDocuments,
  initialEmails,
  emailTemplates,
  members,
  gradeLevels,
  schoolClasses,
  sources,
  canEdit,
  canEnroll,
  canSendEmail,
  canReject,
}: Props) {
  const t = useTranslations("Admissions");
  const router = useRouter();
  const [activities, setActivities] =
    useState<AdmissionActivity[]>(initialActivities);
  const [reminders, setReminders] =
    useState<AdmissionReminder[]>(initialReminders);
  const [appointments, setAppointments] =
    useState<AdmissionAppointment[]>(initialAppointments);
  const [documents, setDocuments] =
    useState<AdmissionDocument[]>(initialDocuments);
  const [emails, setEmails] = useState<AdmissionEmail[]>(initialEmails);
  const [sendOpen, setSendOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [, startTransition] = useTransition();

  const stage = stages.find((s) => s.id === detail.admissionStageId);
  const currentStageIndex = stages.findIndex(
    (s) => s.id === detail.admissionStageId,
  );
  const emailContacts = detail.contactPersons
    .filter((c) => c.email)
    .map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email as string,
      role: c.roles?.[0] ?? null,
    }));
  const defaultContact = emailContacts[0] ?? null;
  // "Mit" options for the call composer: every contact person of the
  // application (name stored as the activity subject) plus "andere".
  const withOptions = detail.contactPersons.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`.trim(),
    role: c.roles?.[0] ? t(contactRoleKey(c.roles[0])) : null,
  }));

  const refreshActivities = () => {
    startTransition(async () => {
      const res = await getAdmissionActivitiesAction(detail.id);
      if (res.success) setActivities(res.data);
      router.refresh();
    });
  };

  const refreshReminders = () => {
    startTransition(async () => {
      const res = await getAdmissionRemindersAction(detail.id);
      if (res.success) setReminders(res.data);
      router.refresh();
    });
  };

  const refreshAppointments = () => {
    startTransition(async () => {
      const res = await getAdmissionAppointmentsAction(detail.id);
      if (res.success) setAppointments(res.data);
      router.refresh();
    });
  };

  const refreshDocuments = () => {
    startTransition(async () => {
      const res = await getAdmissionDocumentsAction(detail.id);
      if (res.success) setDocuments(res.data);
      router.refresh();
    });
  };

  const refreshEmails = () => {
    startTransition(async () => {
      const res = await getAdmissionEmailsAction(detail.id);
      if (res.success) setEmails(res.data);
      router.refresh();
    });
  };

  const childName = `${detail.childFirstName} ${detail.childLastName}`;
  const swissBirthDate = detail.childDateOfBirth
    ? detail.childDateOfBirth.slice(0, 10).split("-").reverse().join(".")
    : null;
  // Header subtitle dates — long German form ("29. Juni 2025"), Swiss locale.
  const longDate = (iso: string | null): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("de-CH", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Zurich",
    });
  };
  const receivedDate = longDate(detail.createdAt) ?? "—";
  const desiredEntry = longDate(detail.desiredEnrollmentDate);
  // "Gewünschter Eintritt" in the Angaben card shows month + year ("August
  // 2027"), matching the design's coarser granularity.
  const desiredEntryMonth = detail.desiredEnrollmentDate
    ? (() => {
        const d = new Date(detail.desiredEnrollmentDate);
        return Number.isNaN(d.getTime())
          ? null
          : d.toLocaleDateString("de-CH", {
              month: "long",
              year: "numeric",
              timeZone: "Europe/Zurich",
            });
      })()
    : null;
  const childAge =
    detail.childDateOfBirth &&
    !Number.isNaN(new Date(detail.childDateOfBirth).getTime())
      ? Math.floor(
          (Date.now() - new Date(detail.childDateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        )
      : null;
  // Kind row: "Name · geb. dd.mm.yyyy · N J." (age/birthdate only when known).
  const childLine = [
    childName,
    swissBirthDate ? `${t("bornAbbr")} ${swissBirthDate}` : null,
    childAge !== null ? t("ageYears", { count: childAge }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  // Stufe / Klasse: "<Stufe> · <Klasse>", falling back to "offen" for an
  // unassigned class (matches the design's "Unterstufe · offen").
  const stufeKlasse =
    detail.assignedGradeLevelName || detail.desiredSchoolClassName
      ? [
          detail.assignedGradeLevelName ?? "—",
          detail.desiredSchoolClassName ?? t("classOpen"),
        ].join(" · ")
      : null;
  // Primary contact for the Angaben card (first listed), with role + phone.
  const primaryContact = detail.contactPersons[0] ?? null;
  const primaryContactLine = primaryContact
    ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim() +
      (primaryContact.roles?.[0]
        ? ` (${t(contactRoleKey(primaryContact.roles[0]))})`
        : "")
    : null;
  const primaryContactPhone = primaryContact?.phone ?? null;
  const primaryContactMobile = primaryContact?.mobile ?? null;
  // Days the application has spent in the current stage (client-only; Date.now
  // differs between SSR and hydration, but this renders inside the client tree).
  const daysInStage = detail.stageEnteredAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(detail.stageEnteredAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* Header — title + stage badge · subtitle · actions (design: no avatar) */}
      <div className="px-4 pt-6 sm:px-6">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-bold leading-none tracking-[-0.02em]">
                {childName}
              </h1>
              {stage && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 text-[12px] font-[600]"
                  style={
                    stage.color
                      ? {
                          backgroundColor: `${stage.color}1f`,
                          color: stage.color,
                        }
                      : undefined
                  }
                >
                  {stage.name}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              {t("applicationReceivedOn", { date: receivedDate })}
              {desiredEntry && ` · ${t("desiredEntryLabel", { date: desiredEntry })}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToKanban")}
            </Button>
            {canReject && detail.status === "ACTIVE" && (
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => setRejectOpen(true)}
              >
                {t("rejectApplication")}
              </Button>
            )}
            {canSendEmail && (
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => setSendOpen(true)}
              >
                <Send className="h-4 w-4" />
                {t("emailSend")}
              </Button>
            )}
            {canEnroll && detail.status === "ACTIVE" && (
              <Button className="gap-1.5" onClick={() => setEnrollOpen(true)}>
                <GraduationCap className="h-4 w-4" />
                {t("enroll")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stage tabs — large pills, active one filled with days-in-stage. */}
      {stages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-6">
          {stages.map((s, i) => {
            const active = i === currentStageIndex;
            return (
              <span
                key={s.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-[600]",
                  active
                    ? "border-transparent text-white"
                    : "border-border bg-card text-muted-foreground",
                )}
                // Active pill is filled with its stage colour (falls back to the
                // neutral foreground when the stage has none).
                style={
                  active
                    ? {
                        backgroundColor: s.color ?? "var(--foreground)",
                        color: s.color ? "#fff" : "var(--background)",
                      }
                    : undefined
                }
              >
                {s.name}
                {active && daysInStage !== null && (
                  <span className="font-mono tabular-nums opacity-80">
                    · {daysInStage}d
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
        {/* Left: Aktivitäten (composer + timeline) */}
        <main className="min-w-0">
          <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              {t("tabActivities")}
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {activities.length}
              </span>
            </h3>
            {canEdit && (
              <div className="mb-4">
                <ActivityComposer
                  applicationId={detail.id}
                  onSaved={refreshActivities}
                  withOptions={withOptions}
                  members={members}
                  onReminderSaved={refreshReminders}
                  appointmentTypes={appointmentTypes}
                  onAppointmentSaved={refreshAppointments}
                />
              </div>
            )}
            <ActivityTimeline
              applicationId={detail.id}
              activities={activities}
              canEdit={canEdit}
              onChanged={refreshActivities}
            />
          </section>
        </main>

        {/* Right: Angaben / Bezugspersonen / Erinnerungen / E-Mail-Verlauf */}
        <aside className="flex w-full min-w-0 flex-col gap-4 lg:sticky lg:top-[68px] lg:max-h-[calc(100vh-90px)] lg:overflow-y-auto">
          {/* Angaben — design card: Kind · Eintritt · Stufe/Klasse · Kontakt. */}
          <DataCard
            title={t("detailsSection")}
            headerAction={
              canEdit ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-auto h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label={t("editDetails")}
                  onClick={() => setEditDetailsOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : undefined
            }
          >
            <DataRow label={t("fieldChild")} value={childLine} />
            <DataRow
              label={t("childGender")}
              value={genderBadge(detail.childGender, t)}
            />
            <DataRow
              label={t("desiredEnrollmentDate")}
              value={desiredEntryMonth}
            />
            <DataRow
              label={t("stufeKlasse")}
              value={stufeKlasse}
              dotColor={detail.assignedGradeLevelColor}
            />
            <DataRow
              label={t("intakeChannel")}
              value={detail.admissionSource?.name ?? null}
              dotColor={detail.admissionSource?.color ?? undefined}
            />
            <DataRow
              label={t("contactPersonLabel")}
              value={primaryContactLine}
            />
            {/* Phone/Mobile as separate rows, each only when present; if the
                contact has neither, keep one placeholder phone row. */}
            {(primaryContactPhone || !primaryContactMobile) && (
              <DataRow label={t("phone")} value={primaryContactPhone} />
            )}
            {primaryContactMobile && (
              <DataRow label={t("mobile")} value={primaryContactMobile} />
            )}
            <DataRow
              label={t("email")}
              value={
                primaryContact?.email ? (
                  <a
                    href={`mailto:${primaryContact.email}`}
                    className="hover:underline"
                  >
                    {primaryContact.email}
                  </a>
                ) : null
              }
            />
          </DataCard>

          <DataCard
            title={`${t("familySection")}${detail.familyName ? ` · ${detail.familyName}` : ""}`}
            icon={<Users2 className="h-3.5 w-3.5 text-muted-foreground" />}
            count={detail.contactPersons.length || undefined}
          >
            {detail.contactPersons.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">
                {t("noContactPersons")}
              </p>
            ) : (
              <ul className="space-y-2">
                {detail.contactPersons.map((cp) => (
                  <ContactCard key={cp.id} contact={cp} />
                ))}
              </ul>
            )}
            {detail.familyNotes && (
              <p className="mt-2 border-t pt-2 text-xs whitespace-pre-wrap text-muted-foreground">
                {detail.familyNotes}
              </p>
            )}
          </DataCard>

          <AdmissionRemindersBlock
            applicationId={detail.id}
            reminders={reminders}
            canEdit={canEdit}
            onChanged={refreshReminders}
            members={members}
            childName={childName}
          />

          <AdmissionAppointmentsBlock
            applicationId={detail.id}
            appointments={appointments}
            types={appointmentTypes}
            members={members}
            canEdit={canEdit}
            onChanged={refreshAppointments}
            childName={childName}
          />

          <AdmissionDocumentsBlock
            applicationId={detail.id}
            documents={documents}
            canEdit={canEdit}
            onChanged={refreshDocuments}
          />

          {/* E-Mail-Verlauf */}
          <section className="rounded-lg border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[15px] font-[650] tracking-[-0.01em]">
                  {t("tabEmails")}
                </span>
                {emails.length > 0 && (
                  <span className="rounded-full bg-accent px-[9px] py-0.5 font-mono text-[11px] font-[600] leading-none tabular-nums text-accent-foreground">
                    {emails.length}
                  </span>
                )}
              </div>
              {canSendEmail && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 px-2 text-xs"
                  onClick={() => setSendOpen(true)}
                >
                  <Send className="h-3.5 w-3.5" />
                  {t("emailSend")}
                </Button>
              )}
            </div>
            <div className="p-4">
              <AdmissionEmailHistory
                applicationId={detail.id}
                emails={emails}
                canManage={canSendEmail}
                onChanged={refreshEmails}
              />
            </div>
          </section>

          {(detail.siblings.length > 0 || canEdit) && (
            <DataCard
              title={t("tabSiblings", { count: detail.siblings.length })}
            >
              {detail.siblings.length > 0 && (
                <ul className="space-y-1.5">
                  {detail.siblings.map((s) => {
                    const birth = s.childDateOfBirth
                      ? s.childDateOfBirth
                          .slice(0, 10)
                          .split("-")
                          .reverse()
                          .join(".")
                      : null;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/admin/admissions/${s.id}`)
                          }
                          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {s.childFirstName} {s.childLastName}
                            </span>
                            {birth && (
                              <span className="block text-[10px] text-muted-foreground">
                                {birth}
                              </span>
                            )}
                          </span>
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px]"
                            style={
                              s.stageColor
                                ? {
                                    borderColor: s.stageColor,
                                    color: s.stageColor,
                                  }
                                : undefined
                            }
                          >
                            {s.stageName}
                          </Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() =>
                    router.push(
                      `/admin/admissions/kanban?newSiblingOf=${detail.familyId}`,
                    )
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t("addSibling")}
                </Button>
              )}
            </DataCard>
          )}
        </aside>
      </div>

      {canSendEmail && sendOpen && (
        <SendEmailDialog
          open
          onOpenChange={setSendOpen}
          applicationId={detail.id}
          templates={emailTemplates}
          contacts={emailContacts}
          defaultToEmail={defaultContact?.email ?? null}
          defaultToName={defaultContact?.name ?? null}
          onSent={refreshEmails}
        />
      )}

      {canEdit && editDetailsOpen && (
        <EditApplicationDetailsDialog
          detail={detail}
          gradeLevels={gradeLevels}
          schoolClasses={schoolClasses}
          sources={sources}
          onClose={() => setEditDetailsOpen(false)}
        />
      )}

      {canReject && rejectOpen && (
        <RejectApplicationDialog
          applicationId={detail.id}
          reasons={rejectionReasons}
          childName={childName}
          onClose={() => setRejectOpen(false)}
        />
      )}

      {canEnroll && enrollOpen && (
        <FinalizeEnrollmentDialog
          applicationId={detail.id}
          childName={childName}
          defaultDate={detail.desiredEnrollmentDate}
          onClose={() => setEnrollOpen(false)}
          onSuccess={() => {
            setEnrollOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function DataCard({
  title,
  icon,
  count,
  headerAction,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  /** Optional action rendered at the right edge of the card header. */
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border bg-card px-[22px] py-5 shadow-sm">
      <h3 className="mb-1 flex items-center gap-[9px] text-[15px] font-[650] tracking-[-0.01em]">
        {icon}
        {title}
        {count !== undefined && (
          <span className="ml-auto rounded-full bg-accent px-[9px] py-0.5 font-mono text-[11px] font-[600] leading-none tabular-nums text-accent-foreground">
            {count}
          </span>
        )}
        {headerAction}
      </h3>
      <div className="mt-1">{children}</div>
    </section>
  );
}

/**
 * Key-value row (.kv): label (soft, 500, 12.5px) left · value (600, 13.5px)
 * right, 1px divider between rows. Renders even when empty as a muted "—" so
 * editable fields always show a slot.
 */
function DataRow({
  label,
  value,
  dotColor,
  placeholder = "—",
}: {
  label: string;
  /** Plain string or richer content (badge, link); null renders the placeholder. */
  value: React.ReactNode | null;
  dotColor?: string | null;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 text-[13.5px] last:border-b-0">
      <span className="shrink-0 font-[500] text-[12.5px] text-muted-foreground">
        {label}
      </span>
      <span className="inline-flex items-center gap-1.5 text-right font-[600]">
        {dotColor !== undefined && value && (
          <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-border"
            style={{ backgroundColor: dotColor ?? "var(--muted)" }}
          />
        )}
        <span className={value ? "" : "font-normal text-muted-foreground"}>
          {value ?? placeholder}
        </span>
      </span>
    </div>
  );
}

function ContactCard({ contact }: { contact: AdmissionDetailContact }) {
  return (
    <li className="flex items-center gap-3 rounded-[calc(var(--radius-card)-5px)] border bg-muted px-[13px] py-2.5 text-xs">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">
            {contact.firstName} {contact.lastName}
          </span>
          {(contact.roles ?? []).slice(0, 1).map((r) => (
            <Badge key={r} variant="secondary" className="shrink-0 text-[10px]">
              {r}
            </Badge>
          ))}
        </div>
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-1.5 truncate text-muted-foreground hover:text-foreground"
          >
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{contact.email}</span>
          </a>
        )}
        {(contact.mobile || contact.phone) && (
          <a
            href={`tel:${contact.mobile ?? contact.phone}`}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Phone className="h-3 w-3 shrink-0" />
            {contact.mobile ?? contact.phone}
          </a>
        )}
      </div>
    </li>
  );
}

/**
 * Gender pill for the Angaben card — icon + label on the status color
 * tokens (sky = male, rose = female, neutral = other). Centralized here so
 * the colors stay semantic instead of per-instance styling.
 */
const GENDER_BADGE: Record<
  string,
  { icon: LucideIcon; className: string; labelKey: string }
> = {
  MALE: {
    icon: Mars,
    className: "bg-status-sky text-status-sky-foreground",
    labelKey: "genderMale",
  },
  FEMALE: {
    icon: Venus,
    className: "bg-status-rose text-status-rose-foreground",
    labelKey: "genderFemale",
  },
  OTHER: {
    icon: VenusAndMars,
    className: "bg-muted text-muted-foreground",
    labelKey: "genderOther",
  },
};

function genderBadge(
  gender: string | null,
  t: (key: string) => string,
): React.ReactNode | null {
  const meta = gender ? GENDER_BADGE[gender] : undefined;
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-[600]",
        meta.className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {t(meta.labelKey)}
    </span>
  );
}


/** Maps a contact-person role code to its i18n key (falls back to the raw code). */
function contactRoleKey(role: string): string {
  switch (role) {
    case "MOTHER":
      return "roleMother";
    case "FATHER":
      return "roleFather";
    case "LEGAL_GUARDIAN":
      return "roleLegalGuardian";
    case "OTHER":
      return "roleOther";
    default:
      return role;
  }
}
