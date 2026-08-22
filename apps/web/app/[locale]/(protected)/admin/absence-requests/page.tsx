import { getTranslations } from "next-intl/server";

import { PageHead } from "@/components/common/PageHead";
import { getPendingAbsenceRequestsAction } from "@/features/employee-absences/actions/employee-absences.actions";
import AbsenceRequestsTable from "@/features/employee-absences/components/AbsenceRequestsTable";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

/**
 * Approval queue for absence requests. The backend scopes the list: admins and
 * HR see the whole organization, team leads only their own teams.
 */
const AbsenceRequestsPage = async () => {
  const tE = await getTranslations("Employees");
  const userRes = await getCurrentUserAction();

  // A SuperAdmin browsing without an active org has no org-scoped queue: say so
  // instead of rendering an empty table.
  if (!userRes?.data?.orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{tE("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const requestsRes = await getPendingAbsenceRequestsAction();

  return (
    <div className="space-y-6 p-4">
      <PageHead
        title={tE("absence.requestsTitle")}
        subtitle={tE("absence.requestsDescription")}
      />
      <AbsenceRequestsTable requests={requestsRes.data} />
    </div>
  );
};

export default AbsenceRequestsPage;
