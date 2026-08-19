import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PageHead } from "@/components/common/PageHead";
import { SettingsTabNav } from "@/features/organization-settings/components/SettingsTabNav";

const SettingsLayout = async ({ children }: { children: ReactNode }) => {
  const locale = await getLocale();
  const t = await getTranslations("OrganizationSettings");

  return (
    <div className="space-y-6 p-4">
      <PageHead title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <SettingsTabNav locale={locale} />
      <div>{children}</div>
    </div>
  );
};

export default SettingsLayout;
