import { OpenSheetButton } from "@/components/buttons/OpenSheetButton";
import { getOrganizationSettingsAction } from "@/features/organization-settings/actions/get-settings.action";
import { CreateSettingForm } from "@/features/organization-settings/components/CreateSettingForm";
import { SettingsPageClient } from "@/features/organization-settings/components/SettingsPageClient";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { KeyRound, PlusIcon } from "lucide-react";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

const SettingsPage = async () => {
  const userRes = await getCurrentUserAction();
  const locale = await getLocale();

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
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2">
            <KeyRound className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Sichere Speicherung von API-Keys und Credentials
            </p>
          </div>
        </div>
        <OpenSheetButton
          title="Neues Setting"
          description="Erstelle ein neues verschlüsseltes Setting für deine Organisation"
          buttonLabel="Hinzufügen"
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
