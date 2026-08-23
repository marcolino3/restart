"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import {
  type AppTableFeatures,
  useDataTable,
} from "@/components/data-table/use-data-table";
import { multiSelectFilter } from "@/lib/table/locale-sorting";
import { ROUTES } from "@/constants/routes";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { DetailPanel, KvRow } from "@/components/common/DetailPanel";
import { pickAbsenceCategoryName } from "@/features/employee-absence-categories/types";
import {
  absenceIncludesTime,
  formatAbsenceDateTime,
} from "@restart/shared-schemas/employee-absences/absence-date";
import {
  absenceDocumentAccessUrl,
  normalizeAbsenceDocuments,
} from "@restart/shared-schemas/employee-absences/absence-document";

import type { EmployeeAbsence } from "../actions/employee-absences.actions";
import {
  deleteEmployeeAbsenceAction,
  withdrawMyEmployeeAbsenceRequestAction,
} from "../actions/employee-absences.actions";
import { AbsenceStatusBadge } from "./AbsenceStatusBadge";

type CategorySummary = {
  categoryId: string;
  name?: string | null;
  color?: string | null;
  totalDays: number;
};

interface Props {
  employeeId: string;
  absences: EmployeeAbsence[];
  categorySummary?: CategorySummary[];
  editable?: boolean;
  /** `false` when the surrounding page already carries the heading. */
  showHeading?: boolean;
  /** `true` on the self-service page: pending own requests can be withdrawn. */
  allowWithdraw?: boolean;
}

export default function EmployeeAbsencesTab({
  employeeId,
  absences,
  categorySummary = [],
  editable,
  showHeading = true,
  allowWithdraw = false,
}: Props) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();

  const formatDateTime = (
    start?: string | null,
    end?: string | null,
    value?: string | null,
  ) =>
    formatAbsenceDateTime(value, locale, {
      includeTime: absenceIncludesTime(start, end),
    }) ?? "–";

  const categoryLabel = (absence: EmployeeAbsence) => {
    if (absence.absenceCategory) {
      return pickAbsenceCategoryName(
        {
          translations: absence.absenceCategory.translations ?? [],
          systemCode: absence.absenceCategory.systemCode ?? null,
        },
        locale,
      );
    }
    return "–";
  };

  const handleWithdraw = async (id: string) => {
    const res = await withdrawMyEmployeeAbsenceRequestAction(id);
    return res.success
      ? { success: true as const }
      : { success: false as const, error: tE("absence.withdrawError") };
  };

  const handleDelete = async (id: string) => {
    const res = await deleteEmployeeAbsenceAction(id);
    return res.success
      ? { success: true as const }
      : { success: false as const, error: tE("absence.deleteError") };
  };

  const columns = useMemo<ColumnDef<AppTableFeatures, EmployeeAbsence, unknown>[]>(() => {
    const cols: ColumnDef<AppTableFeatures, EmployeeAbsence, unknown>[] = [
      {
        id: "category",
        accessorFn: (a) => categoryLabel(a),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tE("absence.category")}
          />
        ),
        meta: { labelKey: "absence.category" },
        filterFn: multiSelectFilter,
        cell: ({ row, getValue }) => (
          <span className="flex items-center gap-2">
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{
                background:
                  row.original.absenceCategory?.color ?? "var(--muted)",
              }}
            />
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "startDate",
        accessorFn: (a) =>
          a.startDate ? new Date(a.startDate).getTime() : 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("startDate")} />
        ),
        meta: { labelKey: "startDate" },
        cell: ({ row }) =>
          formatDateTime(
            row.original.startDate,
            row.original.endDate,
            row.original.startDate,
          ),
      },
      {
        id: "endDate",
        accessorFn: (a) =>
          a.endDate ? new Date(a.endDate).getTime() : 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("endDate")} />
        ),
        meta: { labelKey: "endDate" },
        cell: ({ row }) =>
          formatDateTime(
            row.original.startDate,
            row.original.endDate,
            row.original.endDate,
          ),
      },
      {
        id: "percentage",
        accessorFn: (a) => a.percentage,
        header: ({ column }) => (
          <div className="flex justify-center">
            <DataTableColumnHeader
              column={column}
              title={tE("absence.percentage")}
            />
          </div>
        ),
        meta: { labelKey: "absence.percentage" },
        cell: ({ row }) => (
          <div className="flex justify-center tabular-nums">
            {row.original.percentage}%
          </div>
        ),
      },
      {
        id: "isVacationCapable",
        accessorFn: (a) =>
          a.isVacationCapable
            ? tE("absence.vacationCapableYes")
            : tE("absence.vacationCapableNo"),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tE("absence.isVacationCapable")}
          />
        ),
        meta: { labelKey: "absence.isVacationCapable" },
        filterFn: multiSelectFilter,
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.isVacationCapable ? "secondary" : "outline"
            }
          >
            {row.original.isVacationCapable
              ? tE("absence.vacationCapableYes")
              : tE("absence.vacationCapableNo")}
          </Badge>
        ),
      },
      {
        id: "certificate",
        enableSorting: false,
        header: () => (
          <div className="flex justify-center">
            {tE("absence.certificate")}
          </div>
        ),
        meta: { labelKey: "absence.certificate" },
        cell: ({ row }) => {
          const docs = [
            ...normalizeAbsenceDocuments(row.original.certificates),
            ...normalizeAbsenceDocuments(row.original.additionalDocuments),
          ];
          if (docs.length === 0) {
            return <span className="text-muted-foreground">–</span>;
          }
          return (
            <div className="flex items-center justify-center gap-1">
              {docs.map((doc, index) => {
                const title =
                  doc.label.trim() ||
                  tE("absence.docUntitled", { index: index + 1 });
                return (
                  <a
                    key={`${doc.url}-${index}`}
                    href={absenceDocumentAccessUrl(doc.url, employeeId)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={title}
                    title={title}
                    className="inline-flex text-primary hover:text-primary/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          );
        },
      },
      {
        id: "status",
        accessorFn: (a) => tE(`absence.status.${a.status ?? "APPROVED"}`),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tE("absence.status.label")}
          />
        ),
        meta: { labelKey: "absence.status.label" },
        filterFn: multiSelectFilter,
        cell: ({ row }) => (
          <AbsenceStatusBadge
            status={row.original.status}
            decisionNote={row.original.decisionNote}
          />
        ),
      },
      {
        id: "note",
        accessorFn: (a) => a.note ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("note")} />
        ),
        meta: { labelKey: "note" },
        cell: ({ getValue }) => {
          const note = getValue<string>();
          if (!note) return "–";
          return (
            <span className="line-clamp-1 max-w-[14rem] text-sm" title={note}>
              {note}
            </span>
          );
        },
      },
    ];

    if (allowWithdraw) {
      cols.push({
        id: "withdraw",
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="sr-only">{t("actions")}</span>,
        cell: ({ row }) =>
          row.original.status === "PENDING" ? (
            <div className="text-right">
              <DeleteConfirmationDialog
                title={tE("absence.withdrawTitle")}
                description={tE("absence.withdrawConfirm")}
                onConfirm={() => handleWithdraw(row.original.id)}
                onSuccess={() => router.refresh()}
                trigger={
                  <Button variant="ghost" size="sm">
                    {tE("absence.withdraw")}
                  </Button>
                }
              />
            </div>
          ) : null,
      });
    }

    if (editable) {
      cols.push({
        id: "actions",
        enableHiding: false,
        header: () => <span className="sr-only">{t("actions")}</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button variant="ghost" size="icon" asChild>
              <Link
                href={ROUTES.admin.employeesAbsenceEdit(
                  locale,
                  employeeId,
                  row.original.id,
                )}
                aria-label={t("edit")}
              >
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <DeleteConfirmationDialog
              description={tE("absence.deleteConfirm")}
              onConfirm={() => handleDelete(row.original.id)}
              onSuccess={() => router.refresh()}
              trigger={
                <Button variant="ghost" size="icon" aria-label={t("delete")}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              }
            />
          </div>
        ),
      });
    }

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, tE, editable, allowWithdraw, locale, employeeId]);

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: absences,
    columns,
    initialSorting: [{ id: "startDate", desc: true }],
  });

  const filterGroups = useMemo<FilterGroup[]>(() => {
    const names = Array.from(
      new Set(absences.map((a) => categoryLabel(a)).filter(Boolean)),
    );
    if (names.length < 2) return [];
    return [
      {
        id: "category",
        label: tE("absence.category"),
        options: names.map((name) => ({ value: name, label: name })),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [absences, tE, locale]);

  return (
    <div className="space-y-6">
      {categorySummary.length > 0 && (
        <DetailPanel title={tE("absence.summary")}>
          {categorySummary.map((c) => (
            <KvRow
              key={c.categoryId}
              label={
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-2 shrink-0 rounded-full"
                    style={{ background: c.color ?? "var(--muted)" }}
                  />
                  {c.name || "–"}
                </span>
              }
            >
              {tE("daysCount", { days: c.totalDays })}
            </KvRow>
          ))}
        </DetailPanel>
      )}

      <div>
        {showHeading && (
          <div className="mb-4 flex items-center justify-between px-4 sm:px-0">
            <div>
              <h3 className="text-base/7 font-semibold text-foreground">
                {tE("tabAbsences")}
              </h3>
              <p className="mt-1 text-sm/6 text-muted-foreground">
                {tE("absence.listDescription")}
              </p>
            </div>
            {editable && (
              <Button asChild>
                <Link
                  href={ROUTES.admin.employeesAbsenceCreate(locale, employeeId)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {tE("absence.create")}
                </Link>
              </Button>
            )}
          </div>
        )}

        <DataTable
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          searchPlaceholder={tE("absence.searchPlaceholder")}
          filterGroups={filterGroups}
          translateColumn={(key) =>
            key.startsWith("absence.") ? tE(key) : t(key)
          }
          emptyState={
            <span className="text-sm text-muted-foreground">
              {tE("absence.noAbsences")}
            </span>
          }
        />
      </div>
    </div>
  );
}
