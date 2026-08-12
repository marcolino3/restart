"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileBarChart, FileText, Loader2, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrganizationQuery } from "@restart/shared-types/graphql";
import { OrgLifecycleStatus } from "@restart/shared-schemas/organizations/organization-enums";
import { getOrganizationUsageAction } from "../actions/get-organization-usage.action";
import { exportOrganizationDataAction } from "../actions/export-organization-data.action";
import { reactivateOrganizationAction } from "../actions/reactivate-organization.action";
import { ChangePlanDialog } from "./ChangePlanDialog";
import { SuspendOrganizationDialog } from "./SuspendOrganizationDialog";
import { AuditLogSheet } from "./AuditLogSheet";
import { StartSupportLoginDialog } from "./StartSupportLoginDialog";

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
  const [supportLoginOpen, setSupportLoginOpen] = useState(false);
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
        <CardHeader>
          <CardTitle>{tO("sidebarSubscription")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between gap-3 border-b py-[10px] text-[13.5px] last:border-b-0">
            <span className="text-[12.5px] font-medium text-muted-foreground">
              {tO("sidebarPlan")}
            </span>
            <span className="font-semibold">
              {tO(
                `plan_${organization.plan}` as `plan_${NonNullable<
                  typeof organization.plan
                >}`
              )}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b py-[10px] text-[13.5px] last:border-b-0">
            <span className="text-[12.5px] font-medium text-muted-foreground">
              {tO("sidebarUserLicenses")}
            </span>
            <span className="font-semibold">
              {organization.userLicenseLimit ?? "–"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b py-[10px] text-[13.5px] last:border-b-0">
            <span className="text-[12.5px] font-medium text-muted-foreground">
              {tO("sidebarContractEndsAt")}
            </span>
            <span className="font-semibold">
              {organization.contractEndsAt
                ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                    new Date(organization.contractEndsAt)
                  )
                : "–"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b py-[10px] text-[13.5px] last:border-b-0">
            <span className="text-[12.5px] font-medium text-muted-foreground">
              {tO("sidebarBilling")}
            </span>
            <span className="font-semibold">
              {organization.billingAmountChf != null
                ? `CHF ${organization.billingAmountChf}`
                : "–"}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full justify-center"
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
        <CardContent className="pt-0">
          <div className="mt-[14px] flex flex-col gap-2">
            <span className="flex items-center gap-[10px] text-[12.5px] text-muted-foreground">
              <span className="min-w-[78px]">{tO("usageUsers")}</span>
              <span className="h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${userPct}%` }}
                />
              </span>
              <span className="min-w-[18px] text-right font-mono text-[12px] text-foreground">
                {usage?.userCount ?? "–"}
              </span>
            </span>
            <span className="flex items-center gap-[10px] text-[12.5px] text-muted-foreground">
              <span className="min-w-[78px]">{tO("usageChildren")}</span>
              <span className="h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: usage?.childCount ? "100%" : "0%" }}
                />
              </span>
              <span className="min-w-[18px] text-right font-mono text-[12px] text-foreground">
                {usage?.childCount ?? "–"}
              </span>
            </span>
            <span className="flex items-center gap-[10px] text-[12.5px] text-muted-foreground">
              <span className="min-w-[78px]">{tO("usageStorage")}</span>
              <span className="h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${storagePct}%` }}
                />
              </span>
              <span className="min-w-[18px] text-right font-mono text-[12px] text-foreground">
                {usage?.storageUsedGb ?? "–"} GB
              </span>
            </span>
            <span className="flex items-center gap-[10px] text-[12.5px] text-muted-foreground">
              <span className="min-w-[78px]">{tO("usageActiveUsers30Days")}</span>
              <span className="h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{
                    width: `${
                      usage && organization.userLicenseLimit
                        ? Math.min(
                            100,
                            (usage.activeUsersLast30Days /
                              organization.userLicenseLimit) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </span>
              <span className="min-w-[18px] text-right font-mono text-[12px] text-foreground">
                {usage?.activeUsersLast30Days ?? "–"}
              </span>
            </span>
          </div>
          <p className="mt-[10px] border-t pt-[10px] text-[11.5px] text-muted-foreground">
            {tO("usageLastLogin", {
              date: usage?.lastLoginAt
                ? new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(usage.lastLoginAt))
                : "–",
              avg: usage?.avgLoginsPerDay ?? 0,
            })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tO("sidebarSupportActions")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mt-[6px] flex flex-col">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-[9px] rounded-md py-[5px] text-[13px] font-medium hover:text-foreground"
              onClick={() => setSupportLoginOpen(true)}
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              {tO("sidebarStartSupportLogin")}
              <em className="ml-auto text-[11px] not-italic text-muted-foreground">
                {tO("sidebarLogged")}
              </em>
            </button>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-[9px] rounded-md py-[5px] text-[13px] font-medium hover:text-foreground"
              onClick={() => setAuditLogOpen(true)}
            >
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
              {tO("sidebarOpenAuditLog")}
            </button>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-[9px] rounded-md py-[5px] text-[13px] font-medium hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={isExporting}
              onClick={handleExport}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              {tO("sidebarExportData")}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tO("sidebarStatus")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="mb-[14px] text-[12.5px] text-muted-foreground">
            {isSuspended
              ? tO("sidebarStatusHintSuspended", {
                  reason: organization.suspendedReason ?? "",
                })
              : tO("sidebarStatusHintActive")}
          </p>
          {isSuspended ? (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center"
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
              variant="outline"
              className="w-full justify-center text-destructive hover:text-destructive"
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
      <StartSupportLoginDialog
        organizationId={organization.id}
        open={supportLoginOpen}
        onOpenChange={setSupportLoginOpen}
      />
    </div>
  );
};
