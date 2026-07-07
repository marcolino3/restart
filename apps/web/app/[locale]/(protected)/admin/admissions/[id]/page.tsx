import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getApplicationDetailAction } from "@/features/admissions-kanban/actions/get-application-detail.action";
import { getAdmissionActivitiesAction } from "@/features/admissions-kanban/actions/get-admission-activities.action";
import { getAdmissionRemindersAction } from "@/features/admissions-kanban/actions/get-admission-reminders.action";
import { getAdmissionAppointmentsAction } from "@/features/admissions-kanban/actions/get-admission-appointments.action";
import { getAdmissionAppointmentTypesAction } from "@/features/admissions-kanban/actions/appointment-types-actions";
import { getAdmissionsDataAction } from "@/features/admissions-kanban/actions/get-admissions-data.action";
import { getAdmissionEmailsAction } from "@/features/admissions-kanban/actions/get-admission-emails.action";
import { getEmailTemplatesAction } from "@/features/email-templates/actions/get-email-templates.action";
import { getOrgMembershipsAction } from "@/features/projects/actions/get-org-memberships.action";
import { AdmissionDetailPage } from "@/features/admissions-kanban/components/AdmissionDetailPage";
import { mapReminderMembers } from "@/features/admissions-kanban/lib/map-reminder-members";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function AdmissionDetailRoute({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("Admissions");

  const [
    user,
    detail,
    activities,
    reminders,
    appointments,
    appointmentTypes,
    kanbanData,
    emails,
    templates,
  ] = await Promise.all([
    getCurrentUserAction(),
    getApplicationDetailAction(id),
    getAdmissionActivitiesAction(id),
    getAdmissionRemindersAction(id),
    getAdmissionAppointmentsAction(id),
    // Bare array + can throw (no {success} wrapper) — swallow to a safe [].
    getAdmissionAppointmentTypesAction().catch(() => []),
    getAdmissionsDataAction(),
    getAdmissionEmailsAction(id),
    getEmailTemplatesAction("ADMISSION"),
  ]);

  if (!user?.success) {
    return (
      <div className="p-6 text-sm text-destructive">
        {t("notAuthenticated")}
      </div>
    );
  }
  if (!detail.success) {
    if (detail.error?.toLowerCase().includes("not found")) notFound();
    return (
      <div className="p-6 text-sm text-destructive">
        {detail.error ?? t("loadError")}
      </div>
    );
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const permissions = user.data.permissions ?? [];
  const stages = kanbanData.success ? kanbanData.data.stages : [];
  const rejectionReasons = kanbanData.success
    ? kanbanData.data.rejectionReasons
    : [];

  const membersRes = user.data.orgId
    ? await getOrgMembershipsAction(user.data.orgId)
    : null;
  const members = mapReminderMembers(
    membersRes?.success ? membersRes.data : [],
  );

  return (
    <AdmissionDetailPage
      detail={detail.data}
      stages={stages}
      rejectionReasons={rejectionReasons}
      members={members}
      initialActivities={activities.success ? activities.data : []}
      initialReminders={reminders.success ? reminders.data : []}
      initialAppointments={appointments.success ? appointments.data : []}
      appointmentTypes={appointmentTypes}
      initialEmails={emails.success ? emails.data : []}
      emailTemplates={
        templates.success
          ? templates.data.map((tpl) => ({ id: tpl.id, name: tpl.name }))
          : []
      }
      canEdit={has(permissions, "ADMISSION_APPLICATION_WRITE", isSuperAdmin)}
      canEnroll={has(permissions, "ADMISSION_APPLICATION_ENROLL", isSuperAdmin)}
      canSendEmail={has(permissions, "ADMISSION_EMAIL_SEND", isSuperAdmin)}
      canReject={has(permissions, "ADMISSION_APPLICATION_DELETE", isSuperAdmin)}
    />
  );
}
