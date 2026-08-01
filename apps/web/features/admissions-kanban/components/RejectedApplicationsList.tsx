"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { PersonCell } from "@/components/common/PersonCell";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import { multiSelectFilter } from "@/lib/table/locale-sorting";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";

import type { AdmissionRejectedBy, RejectedApplication } from "../types";

interface Props {
  applications: RejectedApplication[];
}

const rejectedByKey = (by: AdmissionRejectedBy): string => {
  switch (by) {
    case "SCHOOL":
      return "rejectedBySchool";
    case "PARENTS":
      return "rejectedByParents";
    case "OTHER":
    default:
      return "rejectedByOther";
  }
};

/** The reason label falls back to the free-text reason when unset. */
const reasonOf = (a: RejectedApplication): string =>
  a.rejectionReasonLabel ?? a.rejectionReason ?? "";

export function RejectedApplicationsList({ applications }: Props) {
  const t = useTranslations("Admissions");
  const router = useRouter();

  const columns = useMemo<ColumnDef<RejectedApplication>[]>(
    () => [
      {
        id: "child",
        accessorFn: (a) => `${a.childLastName} ${a.childFirstName}`,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("listColChild")} />
        ),
        meta: { labelKey: "listColChild" },
        cell: ({ row }) => {
          const a = row.original;
          return (
            <PersonCell
              avatar={
                <StudentAvatar
                  firstName={a.childFirstName}
                  lastName={a.childLastName}
                  className="size-8"
                  fallbackClassName="text-[11px]"
                />
              }
              name={`${a.childFirstName} ${a.childLastName}`.trim() || "—"}
            />
          );
        },
      },
      {
        id: "family",
        accessorFn: (a) => a.familyName ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("fieldFamilyName")} />
        ),
        meta: { labelKey: "fieldFamilyName" },
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string>() || "—"}</span>
        ),
      },
      {
        id: "gradeLevel",
        accessorFn: (a) => a.assignedGradeLevelName ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("fieldGradeLevel")} />
        ),
        meta: { labelKey: "fieldGradeLevel" },
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string>() || "—"}</span>
        ),
      },
      {
        id: "reason",
        accessorFn: reasonOf,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("rejectionReason")} />
        ),
        meta: { labelKey: "rejectionReason" },
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const a = row.original;
          if (!a.rejectionReasonLabel) {
            return (
              <span className="text-sm text-muted-foreground">
                {a.rejectionReason ?? "—"}
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border"
                style={{
                  backgroundColor: a.rejectionReasonColor ?? "var(--muted)",
                }}
              />
              {a.rejectionReasonLabel}
            </span>
          );
        },
      },
      {
        id: "rejectedBy",
        accessorFn: (a) => a.rejectedBy ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("rejectedByLabel")} />
        ),
        meta: { labelKey: "rejectedByLabel" },
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const by = row.original.rejectedBy;
          if (!by) return <span className="text-sm">—</span>;
          return (
            <Badge variant="outline" className="text-[10px]">
              {t(rejectedByKey(by))}
            </Badge>
          );
        },
      },
      {
        id: "followUpYear",
        accessorFn: (a) => a.followUpYear ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("followUpYearColumn")}
          />
        ),
        meta: { labelKey: "followUpYearColumn" },
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => {
          const year = getValue<string | number>();
          return year ? (
            <Badge variant="secondary" className="text-[10px]">
              {year}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "rejectedAt",
        // Sorted on the timestamp, rendered as a localised date.
        accessorFn: (a) => new Date(a.rejectedAt).getTime() || 0,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("rejectedAtLabel")}
            className="justify-end"
          />
        ),
        meta: { labelKey: "rejectedAtLabel" },
        cell: ({ row }) => {
          const d = new Date(row.original.rejectedAt);
          return (
            <span className="block text-right text-sm text-muted-foreground">
              {Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString()}
            </span>
          );
        },
      },
    ],
    [t],
  );

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: applications,
    columns,
    // Most recent rejections first — the list is read as a history.
    initialSorting: [{ id: "rejectedAt", desc: true }],
  });

  const filterGroups = useMemo<FilterGroup[]>(() => {
    const group = (
      id: string,
      label: string,
      values: { value: string; label: string; color?: string }[],
    ): FilterGroup | null => {
      const seen = new Map<string, { value: string; label: string; color?: string }>();
      for (const v of values) {
        if (v.value && !seen.has(v.value)) seen.set(v.value, v);
      }
      if (seen.size === 0) return null;
      return {
        id,
        label,
        options: Array.from(seen.values()).sort((a, b) =>
          a.label.localeCompare(b.label),
        ),
      };
    };

    return [
      group(
        "gradeLevel",
        t("fieldGradeLevel"),
        applications.map((a) => ({
          value: a.assignedGradeLevelName ?? "",
          label: a.assignedGradeLevelName ?? "",
        })),
      ),
      group(
        "reason",
        t("rejectionReason"),
        applications.map((a) => ({
          value: reasonOf(a),
          label: reasonOf(a),
          color: a.rejectionReasonColor ?? undefined,
        })),
      ),
      group(
        "rejectedBy",
        t("rejectedByLabel"),
        applications.map((a) => ({
          value: a.rejectedBy ?? "",
          label: a.rejectedBy ? t(rejectedByKey(a.rejectedBy)) : "",
        })),
      ),
      group(
        "followUpYear",
        t("followUpYearColumn"),
        applications.map((a) => ({
          value: a.followUpYear ? String(a.followUpYear) : "",
          label: a.followUpYear ? String(a.followUpYear) : "",
        })),
      ),
    ].filter((g): g is FilterGroup => g !== null);
  }, [applications, t]);

  if (applications.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("rejectedListEmpty")}
      </p>
    );
  }

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder={t("rejectedSearchPlaceholder")}
      filterGroups={filterGroups}
      translateColumn={(key) => t(key)}
      onRowClick={(row) => router.push(`/admin/admissions/${row.original.id}`)}
    />
  );
}
