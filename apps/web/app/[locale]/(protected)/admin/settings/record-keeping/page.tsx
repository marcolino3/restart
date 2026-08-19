import { getTranslations } from "next-intl/server";

import { getRecordKeepingSettingsAction } from "@/features/record-keeping-settings/actions/get-record-keeping-settings.action";
import { RecordKeepingSettingsForm } from "@/features/record-keeping-settings/components/RecordKeepingSettingsForm";

const RecordKeepingSettingsPage = async () => {
  const t = await getTranslations("RecordKeepingSettings");

  const res = await getRecordKeepingSettingsAction();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold">{t("pageTitle")}</h3>
        <p className="text-muted-foreground text-sm">{t("pageSubtitle")}</p>
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
