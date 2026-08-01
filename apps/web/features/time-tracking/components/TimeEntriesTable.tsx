"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import { multiSelectFilter } from "@/lib/table/locale-sorting";
import { useSheet } from "@/components/providers/sheet-provider";
import { formatDurationMinutes } from "@/lib/formatting/duration";
import { TimeEntryForm } from "./TimeEntryForm";
import { deleteTimeEntryAction } from "../actions/mutate-time-entry.action";
import type { TimeEntry } from "../types";

interface Props {
  employeeId: string;
  entries: TimeEntry[];
  /** Kopfzeile (Titel + "Eintrag hinzufügen") ausblenden, wenn der Parent sie stellt. */
  showHeader?: boolean;
}

const timeStr = (iso?: string | null) =>
  iso ? new Date(iso).toISOString().substring(11, 16) : "–";

export const TimeEntriesTable = ({
  employeeId,
  entries,
  showHeader = true,
}: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { open } = useSheet();

  const openForm = (entry?: TimeEntry) =>
    open({
      title: entry ? t("editEntry") : t("addEntry"),
      content: <TimeEntryForm employeeId={employeeId} entry={entry} />,
      side: "right",
    });

  const columns = useMemo<ColumnDef<TimeEntry>[]>(
    () => [
      {
        id: "date",
        // Sorted on the timestamp, not on the "dd.MM.yyyy" string.
        accessorFn: (e) => new Date(e.entryDate).getTime() || 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("date")} />
        ),
        meta: { labelKey: "date" },
        cell: ({ row }) =>
          format(new Date(row.original.entryDate), "dd.MM.yyyy", {
            locale: de,
          }),
      },
      {
        id: "startTime",
        accessorFn: (e) => timeStr(e.startedAt),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("startTime")} />
        ),
        meta: { labelKey: "startTime" },
      },
      {
        id: "endTime",
        accessorFn: (e) => timeStr(e.endedAt),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("endTime")} />
        ),
        meta: { labelKey: "endTime" },
      },
      {
        id: "break",
        accessorFn: (e) => e.breakMinutes ?? 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("break")} />
        ),
        meta: { labelKey: "break" },
        cell: ({ getValue }) => `${getValue<number>()} min`,
      },
      {
        id: "duration",
        accessorFn: (e) => e.workMinutes ?? -1,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("duration")} />
        ),
        meta: { labelKey: "duration" },
        cell: ({ row }) =>
          row.original.workMinutes != null
            ? formatDurationMinutes(row.original.workMinutes)
            : "–",
      },
      {
        id: "source",
        accessorFn: (e) => (e.source === "CLOCK" ? t("clock") : t("manual")),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("source")} />
        ),
        meta: { labelKey: "source" },
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => (
          <Badge variant="secondary">{getValue<string>()}</Badge>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        header: () => <span className="sr-only">{tc("actions")}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openForm(row.original)}
              aria-label={tc("edit")}
            >
              <Pencil className="size-4" />
            </Button>
            <DeleteConfirmationDialog
              onConfirm={async () => {
                const res = await deleteTimeEntryAction(row.original.id);
                return { success: res.success, error: res.error };
              }}
              onSuccess={() => router.refresh()}
            />
          </div>
        ),
      },
    ],
    // `openForm` is recreated each render by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tc, router],
  );

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: entries,
    columns,
    // Most recent entries first — the list is read as a work history.
    initialSorting: [{ id: "date", desc: true }],
  });

  const filterGroups = useMemo<FilterGroup[]>(() => {
    const sources = Array.from(new Set(entries.map((e) => e.source)));
    if (sources.length < 2) return [];
    return [
      {
        id: "source",
        label: t("source"),
        options: sources.map((s) => ({
          value: s === "CLOCK" ? t("clock") : t("manual"),
          label: s === "CLOCK" ? t("clock") : t("manual"),
        })),
      },
    ];
  }, [entries, t]);

  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("entries")}</h2>
          <Button size="sm" onClick={() => openForm()}>
            <Plus className="size-4" /> {t("addEntry")}
          </Button>
        </div>
      )}
      <DataTable
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder={t("searchEntriesPlaceholder")}
        filterGroups={filterGroups}
        translateColumn={(key) => t(key)}
      />
    </div>
  );
};
