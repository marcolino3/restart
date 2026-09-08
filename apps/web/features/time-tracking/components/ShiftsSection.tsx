"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  type AppTableFeatures,
  useDataTable,
} from "@/components/data-table/use-data-table";
import { normalizeForSearch } from "@/lib/table/locale-sorting";
import { useSheet } from "@/components/providers/sheet-provider";
import { formatDuration, ShiftForm } from "./ShiftForm";
import { deleteShiftAction, type Shift } from "../actions/shifts.action";
import {
  shiftDurationMinutes,
  shiftNetMinutes,
} from "../schemas/shift-form.schema";

export type ShiftTeamOption = { id: string; name: string };

interface Props {
  shifts: Shift[];
  /** All teams of the org — resolves `teamIds` to names in the table. */
  teams: ShiftTeamOption[];
}

/** Colour dot + name; neutral ring when the shift has no colour. */
export const ShiftChip = ({ shift }: { shift: Pick<Shift, "name" | "color"> }) => (
  <span className="inline-flex items-center gap-2">
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-border"
      style={shift.color ? { backgroundColor: shift.color } : undefined}
    />
    <span className="font-medium">{shift.name}</span>
  </span>
);

export const ShiftsSection = ({ shifts, teams }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { open } = useSheet();

  const teamName = useMemo(
    () => new Map(teams.map((team) => [team.id, team.name])),
    [teams],
  );

  const openForm = (shift?: Shift) =>
    open({
      title: shift ? t("editShift") : t("addShift"),
      content: <ShiftForm shift={shift} />,
    });

  const columns = useMemo<ColumnDef<AppTableFeatures, Shift, unknown>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("shiftName")} />
        ),
        meta: { labelKey: "shiftName" },
        cell: ({ row }) => <ShiftChip shift={row.original} />,
      },
      {
        id: "time",
        accessorFn: (s) => s.startTime,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("shiftTime")} />
        ),
        meta: { labelKey: "shiftTime" },
        cell: ({ row }) => {
          const { startTime, endTime, breaks } = row.original;
          const gross = shiftDurationMinutes(startTime, endTime);
          const net = shiftNetMinutes(startTime, endTime, breaks);
          return (
            <span className="font-mono tabular-nums">
              {startTime}–{endTime}
              <span className="ml-2 text-xs text-muted-foreground">
                {breaks.length > 0
                  ? `${t("shiftNetDuration", { duration: formatDuration(net) })} · ${t("shiftBreakCount", { count: breaks.length })}`
                  : formatDuration(gross)}
              </span>
            </span>
          );
        },
      },
      {
        id: "teams",
        accessorFn: (s) => s.teamIds.length,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("shiftTeams")} />
        ),
        meta: { labelKey: "shiftTeams" },
        cell: ({ row }) => {
          const names = row.original.teamIds
            .map((id) => teamName.get(id))
            .filter((n): n is string => !!n)
            .sort((a, b) => a.localeCompare(b));
          if (names.length === 0) {
            return (
              <span className="text-xs text-muted-foreground">
                {t("shiftNoTeams")}
              </span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1">
              {names.map((n) => (
                <Badge key={n} variant="secondary">
                  {n}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="sr-only">{tc("actions")}</span>,
        cell: ({ row }) => (
          <ShiftRowActions
            shift={row.original}
            onEdit={() => openForm(row.original)}
            onDeleted={() => router.refresh()}
          />
        ),
      },
    ],
    // openForm is recreated each render by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tc, router, teamName],
  );

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: shifts,
    columns,
    getRowId: (row) => row.id,
    globalFilterFn: (row, _columnId, filterValue) => {
      const needle = normalizeForSearch(filterValue);
      if (!needle) return true;
      const s = row.original;
      const haystack = [
        s.name,
        s.startTime,
        s.endTime,
        ...s.teamIds.map((id) => teamName.get(id) ?? ""),
      ];
      return haystack.some((v) => normalizeForSearch(v).includes(needle));
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("shiftsDescription")}</p>
      <DataTable
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder={t("searchShiftsPlaceholder")}
        translateColumn={(key) => t(key)}
        showViewOptions={false}
        toolbar={
          <Button size="sm" className="ml-auto" onClick={() => openForm()}>
            <Plus className="size-4" /> {t("addShift")}
          </Button>
        }
      />
    </div>
  );
};

function ShiftRowActions({
  shift,
  onEdit,
  onDeleted,
}: {
  shift: Shift;
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
        itemName={shift.name}
        onConfirm={async () => {
          const r = await deleteShiftAction(shift.id);
          return { success: r.success, error: r.success ? undefined : r.error };
        }}
        onSuccess={onDeleted}
      />
    </div>
  );
}
