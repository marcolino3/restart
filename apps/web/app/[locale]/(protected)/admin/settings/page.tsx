import { OpenSheetButton } from "@/components/buttons/OpenSheetButton";
import { getOrganizationSettingsAction } from "@/features/organization-settings/actions/get-settings.action";
import { CreateSettingForm } from "@/features/organization-settings/components/CreateSettingForm";
import { SettingsPageClient } from "@/features/organization-settings/components/SettingsPageClient";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { PlusIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

const SettingsPage = async () => {
  const userRes = await getCurrentUserAction();
  const locale = await getLocale();
  const t = await getTranslations("OrganizationSettings");

  if (!userRes?.success) {
    redirect(`/${locale}/sign-in`);
  }

  const organizationId = userRes.data.orgId;
  if (!organizationId) {
    redirect(`/${locale}/select-org`);
  }

  const response = await getOrganizationSettingsAction(organizationId);

  if (!response.success) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 text-destructive rounded-md p-4">
          Fehler: {response.error}
        </div>
      </div>
    );
  }

  const settings = response.data;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <OpenSheetButton
          title={t("createTitle")}
          description={t("createDescription")}
          buttonLabel={t("createButton")}
          icon={<PlusIcon className="h-4 w-4" />}
        >
          <CreateSettingForm organizationId={organizationId} />
        </OpenSheetButton>
      </div>

      <SettingsPageClient settings={settings} organizationId={organizationId} />
    </div>
  );
};

export default SettingsPage;
