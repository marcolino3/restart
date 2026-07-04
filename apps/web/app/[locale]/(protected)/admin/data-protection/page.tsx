import { ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getConsentPurposesAction } from "@/features/consent/actions/get-consent-purposes.action";
import { ConsentPurposesList } from "@/features/consent/components/ConsentPurposesList";
import { getDataRequestsAction } from "@/features/data-requests/actions/get-data-requests.action";
import { DataRequestsList } from "@/features/data-requests/components/DataRequestsList";
import { getRetentionPoliciesAction } from "@/features/retention/actions/get-retention-policies.action";
import { RetentionPoliciesList } from "@/features/retention/components/RetentionPoliciesList";

const DataProtectionPage = async () => {
  const locale = await getLocale();
  const t = await getTranslations("ConsentManagement");
  const tR = await getTranslations("DataRequests");
  const tRet = await getTranslations("RetentionSettings");
  const userRes = await getCurrentUserAction();

  if (!userRes?.success) {
    redirect(`/${locale}/sign-in`);
  }
  if (!userRes.data.orgId && !userRes.data.isSuperAdmin) {
    redirect(`/${locale}/select-org`);
  }

  const purposesRes = await getConsentPurposesAction();
  const requestsRes = await getDataRequestsAction();
  const retentionRes = await getRetentionPoliciesAction();

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2">
          <ShieldCheck className="text-primary h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("centerTitle")}</h1>
          <p className="text-muted-foreground text-sm">{t("centerSubtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="consent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consent">{t("tabConsent")}</TabsTrigger>
          <TabsTrigger value="requests">{tR("tab")}</TabsTrigger>
          <TabsTrigger value="retention">{tRet("tab")}</TabsTrigger>
          <TabsTrigger value="overview">{t("tabOverview")}</TabsTrigger>
        </TabsList>

        <TabsContent value="consent">
          <ConsentPurposesList initial={purposesRes.data} />
        </TabsContent>

        <TabsContent value="requests">
          <DataRequestsList initial={requestsRes.data} />
        </TabsContent>

        <TabsContent value="retention">
          <RetentionPoliciesList initial={retentionRes.data} />
        </TabsContent>

        <TabsContent value="overview">
          <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-sm">
            {t("overviewPlaceholder")}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataProtectionPage;
