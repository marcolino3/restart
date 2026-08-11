"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { OrganizationQuery } from "@restart/shared-types/graphql";
import { OrgLifecycleStatus } from "@restart/shared-schemas/organizations/organization-enums";
import { getOrganizationUsageAction } from "../actions/get-organization-usage.action";
import { exportOrganizationDataAction } from "../actions/export-organization-data.action";
import { reactivateOrganizationAction } from "../actions/reactivate-organization.action";
import { ChangePlanDialog } from "./ChangePlanDialog";
import { SuspendOrganizationDialog } from "./SuspendOrganizationDialog";
import { AuditLogSheet } from "./AuditLogSheet";

interface OrganizationUsage {
  userCount: number;
  childCount: number;
  storageUsedGb: number;
  activeUsersLast30Days: number;
  lastLoginAt?: string | null;
  avgLoginsPerDay: number;
}

interface OrganizationSidebarProps {
  organization: OrganizationQuery["organization"];
  usage: OrganizationUsage | null;
}

export const OrganizationSidebar = ({
  organization,
  usage: initialUsage,
}: OrganizationSidebarProps) => {
  const tO = useTranslations("Organizations");
  const locale = useLocale();
  const [usage, setUsage] = useState(initialUsage);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [lifecycleStatus, setLifecycleStatus] = useState(
    organization.lifecycleStatus ?? OrgLifecycleStatus.ACTIVE
  );

  const refreshUsage = async () => {
    const result = await getOrganizationUsageAction(organization.id);
    if (result.success) setUsage(result.data);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const result = await exportOrganizationDataAction(organization.id);
    setIsExporting(false);

    if (result.success) {
      toast.success(tO("exportStarted"));
    } else {
      toast.error(tO("exportError"), { description: result.error });
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    const result = await reactivateOrganizationAction(organization.id);
    setIsReactivating(false);

    if (result.success) {
      setLifecycleStatus(OrgLifecycleStatus.ACTIVE);
      toast.success(tO("reactivateSuccess"));
    } else {
      toast.error(tO("reactivateError"), { description: result.error });
    }
  };

  const isSuspended = lifecycleStatus === OrgLifecycleStatus.SUSPENDED;

  const storagePct = usage
    ? Math.min(
        100,
        organization.storageLimitGb
          ? (usage.storageUsedGb / organization.storageLimitGb) * 100
          : 0
      )
    : 0;
  const userPct =
    usage && organization.userLicenseLimit
      ? Math.min(100, (usage.userCount / organization.userLicenseLimit) * 100)
      : 0;

  return (
    <div className="space-y-6 lg:sticky lg:top-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{tO("sidebarSubscription")}</CardTitle>
          <Badge variant="secondary">
            {tO(
              `plan_${organization.plan}` as `plan_${NonNullable<
                typeof organization.plan
              >}`
            )}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {tO("sidebarUserLicenses")}
            </span>
            <span>{organization.userLicenseLimit ?? "–"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {tO("sidebarContractEndsAt")}
            </span>
            <span>
              {organization.contractEndsAt
                ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                    new Date(organization.contractEndsAt)
                  )
                : "–"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tO("sidebarBilling")}</span>
            <span>
              {organization.billingAmountChf != null
                ? `CHF ${organization.billingAmountChf}`
                : "–"}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setChangePlanOpen(true)}
          >
            {tO("sidebarChangePlan")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tO("sidebarUsage")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tO("usageUsers")}</span>
              <span>
                {usage?.userCount ?? "–"} / {organization.userLicenseLimit ?? "–"}
              </span>
            </div>
            <Progress value={userPct} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tO("usageChildren")}</span>
              <span>{usage?.childCount ?? "–"}</span>
            </div>
            <Progress value={usage?.childCount ? 100 : 0} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tO("usageStorage")}</span>
              <span>
                {usage?.storageUsedGb ?? "–"} / {organization.storageLimitGb ?? "–"} GB
              </span>
            </div>
            <Progress value={storagePct} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {tO("usageActiveUsers30Days")}
              </span>
              <span>{usage?.activeUsersLast30Days ?? "–"}</span>
            </div>
            <Progress
              value={
                usage && organization.userLicenseLimit
                  ? Math.min(
                      100,
                      (usage.activeUsersLast30Days / organization.userLicenseLimit) *
                        100
                    )
                  : 0
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tO("sidebarSupportActions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => setAuditLogOpen(true)}
          >
            {tO("sidebarOpenAuditLog")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            disabled={isExporting}
            onClick={handleExport}
          >
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tO("sidebarExportData")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tO("sidebarStatus")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isSuspended
              ? tO("sidebarStatusHintSuspended", {
                  reason: organization.suspendedReason ?? "",
                })
              : tO("sidebarStatusHintActive")}
          </p>
          <Separator />
          {isSuspended ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isReactivating}
              onClick={handleReactivate}
            >
              {isReactivating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {tO("sidebarReactivate")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => setSuspendOpen(true)}
            >
              {tO("sidebarSuspend")}
            </Button>
          )}
        </CardContent>
      </Card>

      <ChangePlanDialog
        organizationId={organization.id}
        currentPlan={organization.plan ?? "STARTER"}
        currentUserLicenseLimit={organization.userLicenseLimit}
        currentContractEndsAt={organization.contractEndsAt}
        currentBillingInterval={organization.billingInterval}
        currentBillingAmountChf={organization.billingAmountChf}
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        onSuccess={refreshUsage}
      />
      <SuspendOrganizationDialog
        organizationId={organization.id}
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        onSuccess={() => setLifecycleStatus(OrgLifecycleStatus.SUSPENDED)}
      />
      <AuditLogSheet
        organizationId={organization.id}
        open={auditLogOpen}
        onOpenChange={setAuditLogOpen}
      />
    </div>
  );
};
