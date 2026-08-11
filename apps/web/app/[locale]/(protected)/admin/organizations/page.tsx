import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/common/StatCard";
import { ROUTES } from "@/constants/routes";
import { getOrganizationsOverviewAction } from "@/features/organizations/actions/get-organizations-overview.action";
import { OrganizationsTable } from "@/features/organizations/components/OrganizationsTable";

const OrganizationsPage = async () => {
  const [t, locale, response] = await Promise.all([
    getTranslations("Organizations"),
    getLocale(),
    getOrganizationsOverviewAction(),
  ]);

  if (!response.success) {
    return (
      <div className="p-4 text-sm text-destructive">{t("loadError")}</div>
    );
  }

  const { stats, rows } = response.data;
  const orgCount = rows.length;
  const childCount = rows.reduce((sum, row) => sum + row.childCount, 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("pageTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("pageSubtitle", {
              orgCount,
              userCount: stats.totalUserCount,
              childCount,
            })}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.admin.organizationsCreate(locale)}>
            <PlusIcon />
            {t("createOrganization")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("statActive")} value={stats.activeCount} />
        <StatCard label={t("statTrial")} value={stats.trialCount} />
        <StatCard
          label={t("statTotalUsers")}
          value={stats.totalUserCount}
        />
        <StatCard label={t("statSuspended")} value={stats.suspendedCount} />
      </div>

      <OrganizationsTable data={rows} />
    </div>
  );
};

export default OrganizationsPage;
