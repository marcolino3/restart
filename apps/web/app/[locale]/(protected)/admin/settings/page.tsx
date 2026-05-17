import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OpenSheetButton } from "@/components/buttons/OpenSheetButton";
import { getOrganizationSettingsAction } from "@/features/organization-settings/actions/get-settings.action";
import { CreateSettingForm } from "@/features/organization-settings/components/CreateSettingForm";
import { SettingsPageClient } from "@/features/organization-settings/components/SettingsPageClient";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { KeyRound, PlusIcon, Sliders } from "lucide-react";
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

      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Link
          href={`/${locale}/admin/settings/record-keeping`}
          className="hover:bg-accent flex items-start gap-3 rounded-lg border p-4 transition-colors"
        >
          <Sliders className="text-primary mt-0.5 h-5 w-5" />
          <div>
            <div className="font-medium">Aufmerksamkeits-Schwellen</div>
            <p className="text-muted-foreground text-sm">
              Tage-Schwellen für die «Braucht-Aufmerksamkeit»-Liste in den
              Fortschritts-Ansichten.
            </p>
          </div>
        </Link>
        <Link
          href={`/${locale}/admin/settings/country-templates`}
          className="hover:bg-accent flex items-start gap-3 rounded-lg border p-4 transition-colors"
        >
          <KeyRound className="text-primary mt-0.5 h-5 w-5" />
          <div>
            <div className="font-medium">Länder-Templates</div>
            <p className="text-muted-foreground text-sm">
              Telefon-, AHV- und Land-spezifische Eingabe-Masken.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default SettingsPage;
