import { getLocale, getTranslations } from "next-intl/server";

import { PageHead } from "@/components/common/PageHead";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getSetupStatusAction } from "@/features/setup/actions/get-setup-status.action";
import { SetupChecklist } from "@/features/setup/components/SetupChecklist";

const SetupPage = async () => {
  const t = await getTranslations("Setup");
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12">
        <p>{t("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const [locale, setupRes] = await Promise.all([
    getLocale(),
    getSetupStatusAction(),
  ]);

  if (!setupRes.success) {
    return (
      <div className="text-destructive flex flex-col items-center justify-center gap-2 py-12">
        <p>{t("loadError")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title={t("pageTitle")}
        subtitle={t("pageDescription")}
        stacked
      />
      {/* full: shows completed steps too, so progress stays visible */}
      <SetupChecklist status={setupRes.data} locale={locale} variant="full" />
    </div>
  );
};

export default SetupPage;
