import { getTranslations } from "next-intl/server";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getOrgAdmissionRemindersAction } from "@/features/admissions-kanban/actions/get-org-admission-reminders.action";
import type { AdmissionReminderListFilter } from "@/features/admissions-kanban/actions/get-org-admission-reminders.action";
import { RemindersListPage } from "@/features/admissions-kanban/components/RemindersListPage";

const has = (permissions: string[], code: string, isSuperAdmin: boolean) =>
  isSuperAdmin || permissions.includes(code);

const FILTERS: AdmissionReminderListFilter[] = [
  "OVERDUE",
  "TODAY",
  "WEEK",
  "OPEN",
  "COMPLETED",
];

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function AdmissionRemindersListRoute({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const filter: AdmissionReminderListFilter = FILTERS.includes(
    params.filter as AdmissionReminderListFilter,
  )
    ? (params.filter as AdmissionReminderListFilter)
    : "OPEN";

  const t = await getTranslations("Admissions");
  const [user, reminders] = await Promise.all([
    getCurrentUserAction(),
    getOrgAdmissionRemindersAction(filter),
  ]);

  if (!user?.success) {
    return (
      <div className="p-6 text-sm text-destructive">{t("notAuthenticated")}</div>
    );
  }
  if (!reminders.success) {
    return (
      <div className="p-6 text-sm text-destructive">
        {reminders.error ?? t("loadError")}
      </div>
    );
  }

  const isSuperAdmin = user.data.isSuperAdmin ?? false;
  const permissions = user.data.permissions ?? [];

  return (
    <RemindersListPage
      initialFilter={filter}
      initialReminders={reminders.data}
      canEdit={has(permissions, "ADMISSION_APPLICATION_WRITE", isSuperAdmin)}
    />
  );
}
