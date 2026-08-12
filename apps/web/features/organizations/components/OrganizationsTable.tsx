"use client";

import * as React from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import {
  type AppTableFeatures,
  useDataTable,
} from "@/components/data-table/use-data-table";
import {
  localeIncludesFilter,
  multiSelectFilter,
} from "@/lib/table/locale-sorting";
import { ROUTES } from "@/constants/routes";
import { FEATURE_CATALOG } from "@/features/organizations/org-feature-catalog";
import { GetOrganizationsOverviewQuery } from "@restart/shared-types/graphql";

interface Props {
  data: GetOrganizationsOverviewQuery["organizationsOverview"]["rows"];
}

type OrganizationRow = Record<string, unknown> &
  GetOrganizationsOverviewQuery["organizationsOverview"]["rows"][number];

const TOTAL_FEATURE_COUNT = Object.keys(FEATURE_CATALOG).length;

const LIFECYCLE_BADGE_VARIANT: Record<string, "green" | "amber" | "rose"> = {
  ACTIVE: "green",
  TRIAL: "amber",
  SUSPENDED: "rose",
};

const formatMonthYear = (date: string | Date, locale: string) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
};

const useColumns = (
  locale: string,
): ColumnDef<AppTableFeatures, OrganizationRow, unknown>[] => {
  const t = useTranslations("Organizations");

  return [
    {
      id: "organization",
      accessorFn: (row) => row.organization.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columnOrganization")} />
      ),
      meta: { labelKey: "columnOrganization" },
      cell: ({ row }) => {
        const { organization, trialDaysRemaining } = row.original;
        const isTrial = organization.lifecycleStatus === "TRIAL";
        const isSuspended = organization.lifecycleStatus === "SUSPENDED";

        let subline = t("sinceDate", {
          date: formatMonthYear(organization.createdAt, locale),
        });
        if (isTrial && trialDaysRemaining != null) {
          subline = t("daysRemaining", { count: trialDaysRemaining });
        } else if (isSuspended && organization.suspendedReason) {
          subline = organization.suspendedReason;
        }

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
                {organization.shortCode ||
                  organization.name?.slice(0, 2) ||
                  "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{organization.name || "–"}</div>
              <div className="text-xs text-muted-foreground">{subline}</div>
            </div>
          </div>
        );
      },
      filterFn: localeIncludesFilter,
    },
    {
      id: "plan",
      accessorFn: (row) => row.organization.plan,
      header: t("columnPlan"),
      cell: ({ row }) => {
        const plan = row.original.organization.plan;
        if (!plan) return <span className="text-muted-foreground">–</span>;
        const key = `plan_${plan}` as const;
        return <Badge variant="secondary">{t.has(key) ? t(key) : plan}</Badge>;
      },
    },
    {
      id: "users",
      accessorFn: (row) => row.memberCount,
      header: t("columnUsers"),
      cell: ({ row }) => {
        const { memberCount, organization } = row.original;
        return (
          <span>
            {memberCount} / {organization.userLicenseLimit ?? "–"}
          </span>
        );
      },
    },
    {
      id: "children",
      accessorFn: (row) => row.childCount,
      header: t("columnChildren"),
      cell: ({ row }) => <span>{row.original.childCount}</span>,
    },
    {
      id: "features",
      accessorFn: (row) => row.enabledFeatureCount,
      header: t("columnFeatures"),
      cell: ({ row }) => (
        <span>
          {row.original.enabledFeatureCount} / {TOTAL_FEATURE_COUNT}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => row.organization.lifecycleStatus,
      header: t("columnStatus"),
      filterFn: multiSelectFilter,
      cell: ({ row }) => {
        const status = row.original.organization.lifecycleStatus;
        if (!status) return <span className="text-muted-foreground">–</span>;
        const key = `lifecycle_${status}` as const;
        return (
          <Badge variant={LIFECYCLE_BADGE_VARIANT[status] ?? "slate"}>
            {t.has(key) ? t(key) : status}
          </Badge>
        );
      },
    },
  ];
};

export const OrganizationsTable = ({ data }: Props) => {
  const t = useTranslations("Organizations");
  const locale = useLocale();
  const router = useRouter();
  const columns = useColumns(locale);

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns,
    getRowId: (row) => row.organization.id,
    initialPageSize: 10,
  });

  const filterGroups: FilterGroup[] = React.useMemo(
    () => [
      {
        id: "status",
        label: t("statusFilterLabel"),
        options: [
          { value: "ACTIVE", label: t("lifecycle_ACTIVE") },
          { value: "TRIAL", label: t("lifecycle_TRIAL") },
          { value: "SUSPENDED", label: t("lifecycle_SUSPENDED") },
        ],
      },
    ],
    [t],
  );

  const handleRowClick = (row: Row<AppTableFeatures, OrganizationRow>) => {
    router.push(
      ROUTES.admin.organizationsEdit(locale, row.original.organization.id),
    );
  };

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      filterGroups={filterGroups}
      translateColumn={(key) => t(key)}
      onRowClick={handleRowClick}
    />
  );
};
