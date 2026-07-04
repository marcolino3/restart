"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  ClipboardList,
  GraduationCap,
  History,
  Mail,
  Phone,
  Send,
  Users2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { cn } from "@/lib/utils";

import { getAdmissionActivitiesAction } from "../actions/get-admission-activities.action";
import { getAdmissionRemindersAction } from "../actions/get-admission-reminders.action";
import { getAdmissionEmailsAction } from "../actions/get-admission-emails.action";
import type {
  AdmissionApplicationDetail,
  AdmissionDetailContact,
} from "../actions/get-application-detail.action";
import type { AdmissionActivity } from "../actions/get-admission-activities.action";
import type { AdmissionReminder } from "../actions/get-admission-reminders.action";
import type { AdmissionEmail } from "../actions/get-admission-emails.action";
import type { AdmissionRejectionReason, KanbanStage } from "../types";
import { ActivityComposer } from "./ActivityComposer";
import { ActivityTimeline } from "./ActivityTimeline";
import { AdmissionRemindersBlock } from "./AdmissionRemindersBlock";
import { AdmissionEmailHistory } from "./AdmissionEmailHistory";
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
  initialEmails: AdmissionEmail[];
  emailTemplates: SendableTemplate[];
  /** Org memberships for reminder assignee pickers. */
  members: ReminderMember[];
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
  initialEmails,
  emailTemplates,
  members,
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
  const [emails, setEmails] = useState<AdmissionEmail[]>(initialEmails);
  const [sendOpen, setSendOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
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

  const refreshEmails = () => {
    startTransition(async () => {
      const res = await getAdmissionEmailsAction(detail.id);
      if (res.success) setEmails(res.data);
      router.refresh();
    });
  };

  const childName = `${detail.childFirstName} ${detail.childLastName}`;
  const birthYear = detail.childDateOfBirth
    ? detail.childDateOfBirth.slice(0, 4)
    : null;

  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("detailBack")}
          </Button>
          <div className="flex-1" />
          {canSendEmail && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setSendOpen(true)}
            >
              <Send className="h-4 w-4" />
              {t("emailSend")}
            </Button>
          )}
          {canReject && detail.status === "ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => setRejectOpen(true)}
            >
              <Ban className="h-4 w-4" />
              {t("rejectApplication")}
            </Button>
          )}
          {canEnroll && detail.status === "ACTIVE" && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setEnrollOpen(true)}
            >
              <GraduationCap className="h-4 w-4" />
              {t("finalizeEnrollment")}
            </Button>
          )}
          {stage && (
            <Badge
              variant="outline"
              className="text-xs"
              style={
                stage.color
                  ? { borderColor: stage.color, color: stage.color }
                  : undefined
              }
            >
              {stage.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Stage tracker (design: chip row of stages with the active one filled) */}
      {stages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-6">
          {stages.map((s, i) => {
            const done = i < currentStageIndex;
            const active = i === currentStageIndex;
            return (
              <span
                key={s.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
                  active
                    ? "font-semibold"
                    : done
                      ? ""
                      : "border-border text-muted-foreground",
                )}
                style={
                  s.color
                    ? active
                      ? {
                          backgroundColor: s.color,
                          borderColor: s.color,
                          color: "#fff",
                        }
                      : done
                        ? { borderColor: s.color, color: s.color }
                        : undefined
                    : undefined
                }
              >
                {done && "✓ "}
                {s.name}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8">
        {/* Left: Stammdaten */}
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-[68px] lg:max-h-[calc(100vh-90px)] lg:w-80 lg:overflow-y-auto">
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
            <StudentAvatar
              studentId={detail.id}
              firstName={detail.childFirstName}
              lastName={detail.childLastName}
              className="h-14 w-14 shrink-0"
              fallbackClassName="text-base"
            />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold leading-tight">
                {childName}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {birthYear ? `${t("bornAbbr")} ${birthYear}` : "—"}
                {detail.childGender &&
                  ` · ${genderLabel(detail.childGender, t)}`}
              </div>
            </div>
          </div>

          <AdmissionRemindersBlock
            applicationId={detail.id}
            reminders={reminders}
            canEdit={canEdit}
            onChanged={refreshReminders}
            members={members}
            childName={childName}
          />

          <DataCard title={t("tabOverview")}>
            <DataRow
              label={t("desiredGradeLevel")}
              value={detail.desiredGradeLevelName}
              dotColor={detail.desiredGradeLevelColor}
            />
            <DataRow
              label={t("desiredSchoolClass")}
              value={detail.desiredSchoolClassName}
            />
            <DataRow
              label={t("desiredEnrollmentDate")}
              value={detail.desiredEnrollmentDate}
            />
            <DataRow
              label={t("source")}
              value={sourceLabel(detail.source, t)}
            />
            <DataRow
              label={t("childDateOfBirth")}
              value={detail.childDateOfBirth}
            />
          </DataCard>

          <DataCard
            title={`${t("familySection")}${detail.familyName ? ` · ${detail.familyName}` : ""}`}
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
          </DataCard>

          {detail.siblings.length > 0 && (
            <DataCard
              title={t("tabSiblings", { count: detail.siblings.length })}
            >
              <ul className="space-y-1.5">
                {detail.siblings.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs"
                  >
                    <span className="truncate font-medium">
                      {s.childFirstName} {s.childLastName}
                    </span>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px]"
                      style={
                        s.stageColor
                          ? { borderColor: s.stageColor, color: s.stageColor }
                          : undefined
                      }
                    >
                      {s.stageName}
                    </Badge>
                  </li>
                ))}
              </ul>
            </DataCard>
          )}
        </aside>

        {/* Right: Tabs (Activities default) */}
        <main className="min-w-0 flex-1">
          <Tabs defaultValue="activities">
            <TabsList>
              <TabsTrigger value="activities" className="gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                {t("tabActivities")}
                <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {activities.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="emails" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {t("tabEmails")}
                <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {emails.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="family" className="gap-1.5">
                <Users2 className="h-3.5 w-3.5" />
                {t("tabFamily")}
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5">
                <History className="h-3.5 w-3.5" />
                {t("tabAudit")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activities" className="space-y-4 pt-4">
              {canEdit && (
                <ActivityComposer
                  applicationId={detail.id}
                  onSaved={refreshActivities}
                  members={members}
                  onReminderSaved={refreshReminders}
                />
              )}
              <ActivityTimeline
                applicationId={detail.id}
                activities={activities}
                canEdit={canEdit}
                onChanged={refreshActivities}
              />
            </TabsContent>

            <TabsContent value="emails" className="space-y-4 pt-4">
              {canSendEmail && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setSendOpen(true)}
                  >
                    <Send className="h-4 w-4" />
                    {t("emailSend")}
                  </Button>
                </div>
              )}
              <AdmissionEmailHistory
                applicationId={detail.id}
                emails={emails}
                canManage={canSendEmail}
                onChanged={refreshEmails}
              />
            </TabsContent>

            <TabsContent value="family" className="space-y-3 pt-4">
              {detail.contactPersons.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">
                  {t("noContactPersons")}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {detail.contactPersons.map((cp) => (
                    <ContactCardLarge key={cp.id} contact={cp} />
                  ))}
                </div>
              )}
              {detail.familyNotes && (
                <div className="rounded-lg border bg-card p-4 text-sm whitespace-pre-wrap shadow-sm">
                  {detail.familyNotes}
                </div>
              )}
            </TabsContent>

            <TabsContent value="audit" className="space-y-2 pt-4">
              {detail.auditLogs.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">
                  {t("noAuditLogs")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {detail.auditLogs.map((l) => (
                    <li
                      key={l.id}
                      className="space-y-0.5 rounded-md border bg-card p-3 text-xs shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          {l.action}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(l.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {l.action === "STAGE_CHANGED" && (
                        <div className="text-muted-foreground">
                          {l.fromStage?.name ?? "—"} → {l.toStage?.name ?? "—"}
                        </div>
                      )}
                      {l.actorName && (
                        <div className="text-muted-foreground">
                          {t("by")}: {l.actorName}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </main>
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

      {canReject && rejectOpen && (
        <RejectApplicationDialog
          applicationId={detail.id}
          reasons={rejectionReasons}
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1.5 text-sm">{children}</div>
    </section>
  );
}

function DataRow({
  label,
  value,
  dotColor,
}: {
  label: string;
  value: string | null;
  dotColor?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-right">
        {dotColor !== undefined && (
          <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-border"
            style={{ backgroundColor: dotColor ?? "var(--muted)" }}
          />
        )}
        <span>{value}</span>
      </span>
    </div>
  );
}

function ContactCard({ contact }: { contact: AdmissionDetailContact }) {
  return (
    <li className="space-y-1 rounded-md border bg-background/40 p-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-sm">
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
    </li>
  );
}

function ContactCardLarge({ contact }: { contact: AdmissionDetailContact }) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4 text-sm shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">
          {contact.firstName} {contact.lastName}
        </div>
        <div className="flex flex-wrap gap-1">
          {(contact.roles ?? []).map((r) => (
            <Badge key={r} variant="secondary" className="text-[10px]">
              {r}
            </Badge>
          ))}
        </div>
      </div>
      {contact.occupation && (
        <div className="text-xs text-muted-foreground">
          {contact.occupation}
        </div>
      )}
      {contact.email && (
        <a
          href={`mailto:${contact.email}`}
          className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground",
          )}
        >
          <Mail className="h-3.5 w-3.5" />
          {contact.email}
        </a>
      )}
      {(contact.mobile || contact.phone) && (
        <a
          href={`tel:${contact.mobile ?? contact.phone}`}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Phone className="h-3.5 w-3.5" />
          {contact.mobile ?? contact.phone}
        </a>
      )}
    </div>
  );
}

function sourceLabel(source: string, t: (key: string) => string): string {
  switch (source) {
    case "MANUAL":
      return t("sourceManual");
    case "PUBLIC_FORM":
      return t("sourcePublicForm");
    case "OPEN_DAY":
      return t("sourceOpenDay");
    case "REFERRAL":
      return t("sourceReferral");
    case "OTHER":
      return t("sourceOther");
    default:
      return source;
  }
}

function genderLabel(gender: string, t: (key: string) => string): string {
  switch (gender) {
    case "MALE":
      return t("genderMale");
    case "FEMALE":
      return t("genderFemale");
    case "OTHER":
      return t("genderOther");
    default:
      return gender;
  }
}
