"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import { multiSelectFilter } from "@/lib/table/locale-sorting";
import { ROUTES } from "@/constants/routes";

import type { EmployeeContract } from "../actions/employee-contracts.actions";
import { deleteEmployeeContractAction } from "../actions/employee-contracts.actions";

interface Props {
  employeeId: string;
  contracts: EmployeeContract[];
  /** when true, show edit/delete actions */
  editable?: boolean;
  functionOptions?: { label: string; value: string }[];
}

export default function EmployeeContractsTab({
  employeeId,
  contracts,
  editable,
  functionOptions,
}: Props) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();

  const positionLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of functionOptions ?? []) {
      map.set(opt.value, opt.label);
    }
    return map;
  }, [functionOptions]);

  const resolvePositionLabel = (position?: string | null) => {
    if (!position) return "–";
    return positionLabelById.get(position) ?? position;
  };

  const formatDate = (s?: string | null) => {
    if (!s) return "–";
    return new Date(s).toLocaleDateString(
      locale === "de" ? "de-CH" : "en-GB",
      { day: "2-digit", month: "short", year: "numeric" },
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tE("contract.deleteConfirm"))) return;
    const res = await deleteEmployeeContractAction(id);
    if (res.success) {
      toast.success(tE("contract.deleted"));
      router.refresh();
    } else {
      toast.error(tE("contract.deleteError"));
    }
  };

  const columns = useMemo<ColumnDef<EmployeeContract>[]>(() => {
    const cols: ColumnDef<EmployeeContract>[] = [
      {
        id: "startDate",
        // Sorted on the timestamp, not on the formatted date string.
        accessorFn: (c) => (c.startDate ? new Date(c.startDate).getTime() : 0),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tE("hr.entryDate")} />
        ),
        meta: { labelKey: "hr.entryDate" },
        cell: ({ row }) => formatDate(row.original.startDate),
      },
      {
        id: "endDate",
        // Open-ended contracts sort last under ascending order.
        accessorFn: (c) =>
          c.endDate ? new Date(c.endDate).getTime() : Number.MAX_SAFE_INTEGER,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tE("hr.exitDate")} />
        ),
        meta: { labelKey: "hr.exitDate" },
        cell: ({ row }) => formatDate(row.original.endDate),
      },
      {
        id: "contractType",
        accessorFn: (c) =>
          c.contractType ? tE(`contractType.${c.contractType}`) : "",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tE("hr.contractType")}
          />
        ),
        meta: { labelKey: "hr.contractType" },
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => {
          const label = getValue<string>();
          return label ? <Badge variant="secondary">{label}</Badge> : "–";
        },
      },
      {
        id: "position",
        accessorFn: (c) => resolvePositionLabel(c.position),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tE("hr.position")} />
        ),
        meta: { labelKey: "hr.position" },
        cell: ({ getValue }) => getValue<string>(),
      },
      {
        id: "workloadPercent",
        accessorFn: (c) => c.workloadPercent ?? -1,
        header: ({ column }) => (
          <div className="flex justify-center">
            <DataTableColumnHeader
              column={column}
              title={tE("hr.workloadPercent")}
            />
          </div>
        ),
        meta: { labelKey: "hr.workloadPercent" },
        cell: ({ row }) => (
          <div className="flex justify-center tabular-nums">
            {row.original.workloadPercent != null
              ? `${row.original.workloadPercent}%`
              : "–"}
          </div>
        ),
      },
      {
        id: "document",
        enableSorting: false,
        header: () => (
          <div className="flex justify-center">{tE("contract.document")}</div>
        ),
        meta: { labelKey: "contract.document" },
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.documentUrl ? (
              <a
                href={row.original.documentUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={tE("contract.docView")}
                className="inline-flex text-primary hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-muted-foreground">–</span>
            )}
          </div>
        ),
      },
    ];

    if (editable) {
      cols.push({
        id: "actions",
        enableHiding: false,
        header: () => <span className="sr-only">{t("actions")}</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button variant="ghost" size="icon" asChild>
              <Link
                href={ROUTES.admin.employeesContractEdit(
                  locale,
                  employeeId,
                  row.original.id,
                )}
                aria-label={t("edit")}
              >
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(row.original.id)}
              aria-label={t("delete")}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      });
    }

    return cols;
    // `formatDate`/`handleDelete` are recreated each render by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, tE, editable, locale, employeeId, positionLabelById]);

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: contracts,
    columns,
    // Most recent contract first — the current one is what people look for.
    initialSorting: [{ id: "startDate", desc: true }],
  });

  const filterGroups = useMemo<FilterGroup[]>(() => {
    const types = Array.from(
      new Set(
        contracts
          .map((c) => c.contractType)
          .filter((v): v is NonNullable<typeof v> => Boolean(v)),
      ),
    );
    if (types.length < 2) return [];
    return [
      {
        id: "contractType",
        label: tE("hr.contractType"),
        options: types.map((type) => ({
          value: tE(`contractType.${type}`),
          label: tE(`contractType.${type}`),
        })),
      },
    ];
  }, [contracts, tE]);

  return (
    <>
      <div className="flex items-center justify-between px-4 sm:px-0 mb-4">
        <div>
          <h3 className="text-base/7 font-semibold text-foreground">
            {tE("contracts")}
          </h3>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            {tE("contract.listDescription")}
          </p>
        </div>
        {editable && (
          <Button asChild>
            <Link
              href={ROUTES.admin.employeesContractCreate(locale, employeeId)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {tE("contract.create")}
            </Link>
          </Button>
        )}
      </div>

      <DataTable
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder={tE("contract.searchPlaceholder")}
        filterGroups={filterGroups}
        translateColumn={(key) => tE(key)}
        emptyState={
          <span className="text-sm text-muted-foreground">
            {tE("contract.noContracts")}
          </span>
        }
      />
    </>
  );
}
