"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Copy, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import {
  DateRangePicker,
  type DateRangeValue,
} from "@/components/form/DateRangePicker";
import { normalizeForSearch } from "@/lib/table/locale-sorting";
import { useSheet } from "@/components/providers/sheet-provider";
import { HolidayForm } from "./HolidayForm";
import { CompanyVacationForm } from "./CompanyVacationForm";
import {
  deleteHolidayAction,
  deleteCompanyVacationAction,
  type CompanyVacation,
  type Holiday,
} from "../actions/settings.action";

const fmt = (d: string) => format(new Date(d), "dd.MM.yyyy", { locale: de });
const fmtYearly = (d: string) => format(new Date(d), "dd.MM.", { locale: de });
const fmtWithWeekday = (d: string) =>
  format(new Date(d), "EEE, dd.MM.yyyy", { locale: de });
const toIsoDate = (d: Date) => format(d, "yyyy-MM-dd");

const fmtHolidayDate = (
  holiday: Holiday,
  yearlyLabel: string,
) =>
  holiday.repeatsYearly
    ? `${fmtYearly(holiday.date)} (${yearlyLabel})`
    : fmt(holiday.date);

/** True when vacation interval overlaps the selected filter range. */
const overlapsDateRange = (
  vacation: CompanyVacation,
  range: DateRangeValue,
): boolean => {
  if (!range.from) return true;
  const filterFrom = toIsoDate(range.from);
  const filterTo = toIsoDate(range.to ?? range.from);
  return vacation.startDate <= filterTo && vacation.endDate >= filterFrom;
};

export const HolidaysSection = ({ holidays }: { holidays: Holiday[] }) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { open } = useSheet();

  const openForm = (holiday?: Holiday) =>
    open({
      title: holiday ? t("editHoliday") : t("addHoliday"),
      content: <HolidayForm holiday={holiday} />,
    });

  const openCopyForm = (holiday: Holiday) =>
    open({
      title: t("copyHoliday"),
      content: <HolidayForm copyFrom={holiday} />,
    });

  const columns = useMemo<ColumnDef<Holiday>[]>(
    () => [
      {
        id: "date",
        accessorFn: (h) => new Date(h.date).getTime() || 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("date")} />
        ),
        meta: { labelKey: "date" },
        cell: ({ row }) => fmtHolidayDate(row.original, t("yearly")),
      },
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("holidayName")} />
        ),
        meta: { labelKey: "holidayName" },
      },
      {
        id: "paidPercentage",
        accessorKey: "paidPercentage",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("paidPercentage")}
            className="ml-auto"
          />
        ),
        meta: { labelKey: "paidPercentage", className: "text-right" },
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()}%</span>
        ),
      },
      {
        id: "repeatsYearly",
        accessorFn: (h) => String(h.repeatsYearly),
        // Filter-only column — kept out of the table via initialVisibility.
        header: () => null,
        enableSorting: false,
        filterFn: (row, id, value) => {
          const picks = value as string[] | undefined;
          if (!picks?.length) return true;
          return picks.includes(String(row.getValue(id)));
        },
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="sr-only">{tc("actions")}</span>,
        cell: ({ row }) => {
          const h = row.original;
          return (
            <HolidayRowActions
              holiday={h}
              onEdit={() => openForm(h)}
              onCopy={h.repeatsYearly ? undefined : () => openCopyForm(h)}
              onDeleted={() => router.refresh()}
            />
          );
        },
      },
    ],
    // openForm/openCopyForm are recreated each render by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tc, router],
  );

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: holidays,
    columns,
    getRowId: (row) => row.id,
    initialSorting: [{ id: "date", desc: false }],
    initialVisibility: { repeatsYearly: false },
    globalFilterFn: (row, _columnId, filterValue) => {
      const needle = normalizeForSearch(filterValue);
      if (!needle) return true;
      const h = row.original;
      const haystack = [
        h.name,
        fmt(h.date),
        fmtHolidayDate(h, t("yearly")),
        String(h.paidPercentage),
      ];
      return haystack.some((v) => normalizeForSearch(v).includes(needle));
    },
  });

  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      {
        id: "repeatsYearly",
        label: t("repetition"),
        options: [
          { value: "true", label: t("yearlyOption") },
          { value: "false", label: t("once") },
        ],
      },
    ],
    [t],
  );

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder={t("searchHolidaysPlaceholder")}
      filterGroups={filterGroups}
      translateColumn={(key) => t(key)}
      showViewOptions={false}
      toolbar={
        <Button size="sm" className="ml-auto" onClick={() => openForm()}>
          <Plus className="size-4" /> {t("addHoliday")}
        </Button>
      }
    />
  );
};

export const CompanyVacationsSection = ({
  companyVacations,
}: {
  companyVacations: CompanyVacation[];
}) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const td = useTranslations("DataTable");
  const router = useRouter();
  const { open } = useSheet();
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: null,
    to: null,
  });

  const openForm = (vacation?: CompanyVacation) =>
    open({
      title: vacation ? t("editCompanyVacation") : t("addCompanyVacation"),
      content: <CompanyVacationForm vacation={vacation} />,
    });

  const filteredVacations = useMemo(
    () => companyVacations.filter((v) => overlapsDateRange(v, dateRange)),
    [companyVacations, dateRange],
  );

  const columns = useMemo<ColumnDef<CompanyVacation>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("name")} />
        ),
        meta: { labelKey: "name" },
      },
      {
        id: "startDate",
        accessorFn: (v) => new Date(v.startDate).getTime() || 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("startDate")} />
        ),
        meta: { labelKey: "startDate" },
        cell: ({ row }) => fmtWithWeekday(row.original.startDate),
      },
      {
        id: "endDate",
        accessorFn: (v) => new Date(v.endDate).getTime() || 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("endDate")} />
        ),
        meta: { labelKey: "endDate" },
        cell: ({ row }) => fmtWithWeekday(row.original.endDate),
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="sr-only">{tc("actions")}</span>,
        cell: ({ row }) => (
          <CompanyVacationRowActions
            vacation={row.original}
            onEdit={() => openForm(row.original)}
            onDeleted={() => router.refresh()}
          />
        ),
      },
    ],
    // openForm is recreated each render by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tc, router],
  );

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: filteredVacations,
    columns,
    getRowId: (row) => row.id,
    initialSorting: [{ id: "startDate", desc: false }],
    globalFilterFn: (row, _columnId, filterValue) => {
      const needle = normalizeForSearch(filterValue);
      if (!needle) return true;
      const v = row.original;
      const haystack = [
        v.name,
        fmt(v.startDate),
        fmt(v.endDate),
        fmtWithWeekday(v.startDate),
        fmtWithWeekday(v.endDate),
      ];
      return haystack.some((s) => normalizeForSearch(s).includes(needle));
    },
  });

  const hasDateRange = Boolean(dateRange.from);

  return (
    <DataTable
      table={table}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      searchPlaceholder={t("searchCompanyVacationsPlaceholder")}
      translateColumn={(key) => t(key)}
      showViewOptions={false}
      toolbar={
        <>
          <div className="flex items-center gap-1.5">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={t("pickADateRange")}
              className="h-9 w-[260px] rounded-full border-dashed px-4 text-[13px]"
            />
            {hasDateRange ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label={td("clearFilters")}
                onClick={() => setDateRange({ from: null, to: null })}
              >
                <X className="size-3.5" />
              </Button>
            ) : null}
          </div>
          <Button size="sm" className="ml-auto" onClick={() => openForm()}>
            <Plus className="size-4" /> {t("addCompanyVacation")}
          </Button>
        </>
      }
    />
  );
};

function HolidayRowActions({
  holiday,
  onEdit,
  onCopy,
  onDeleted,
}: {
  holiday: Holiday;
  onEdit: () => void;
  onCopy?: () => void;
  onDeleted: () => void;
}) {
  const tc = useTranslations("Common");
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={tc("openMenu")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {tc("edit")}
          </DropdownMenuItem>
          {onCopy ? (
            <DropdownMenuItem onClick={onCopy}>
              <Copy className="mr-2 h-4 w-4" />
              {tc("copy")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tc("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={holiday.name}
        onConfirm={async () => {
          const r = await deleteHolidayAction(holiday.id);
          return { success: r.success, error: r.error };
        }}
        onSuccess={onDeleted}
      />
    </div>
  );
}

function CompanyVacationRowActions({
  vacation,
  onEdit,
  onDeleted,
}: {
  vacation: CompanyVacation;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const tc = useTranslations("Common");
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={tc("openMenu")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {tc("edit")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tc("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={vacation.name}
        onConfirm={async () => {
          const r = await deleteCompanyVacationAction(vacation.id);
          return { success: r.success, error: r.error };
        }}
        onSuccess={onDeleted}
      />
    </div>
  );
}
