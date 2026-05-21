import Link from "next/link";
import { ChevronLeft, Sliders } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { getRecordKeepingSettingsAction } from "@/features/record-keeping-settings/actions/get-record-keeping-settings.action";
import { RecordKeepingSettingsForm } from "@/features/record-keeping-settings/components/RecordKeepingSettingsForm";

const RecordKeepingSettingsPage = async () => {
  const t = await getTranslations("RecordKeepingSettings");
  const locale = await getLocale();

  const res = await getRecordKeepingSettingsAction();

  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href={`/${locale}/admin/settings`}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("backToSettings")}
        </Link>
      </Button>
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2">
          <Sliders className="text-primary h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-muted-foreground text-sm">{t("pageSubtitle")}</p>
        </div>
      </div>

      {!res.success ? (
        <div className="bg-destructive/10 text-destructive rounded-md p-4">
          {res.error}
        </div>
      ) : (
        <RecordKeepingSettingsForm initialValues={res.data} />
      )}
    </div>
  );
};

export default RecordKeepingSettingsPage;
