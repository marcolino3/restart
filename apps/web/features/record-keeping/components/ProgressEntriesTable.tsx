"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AvatarGroup } from "@/components/common/AvatarGroup";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { deleteLessonRecordsGroupAction } from "../actions/delete-lesson-records-group.action";
import type { RecentLessonRecordItem } from "../actions/get-recent-lesson-records.action";

interface Props {
  data: RecentLessonRecordItem[];
  onExport?: () => void;
}

const STATUS_BADGE_VARIANT: Record<string, BadgeProps["variant"]> = {
  PLANNING: "slate",
  INTRODUCED: "sky",
  PRACTICED: "amber",
  MASTERED: "green",
  NEEDS_MORE: "rose",
};

const formatDateTime = (
  iso: string,
  locale: string,
  todayLabel: string,
  yesterdayLabel: string,
): string => {
  try {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    const time = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    if (sameDay(date, today)) return `${todayLabel}, ${time}`;
    if (sameDay(date, yesterday)) return `${yesterdayLabel}, ${time}`;

    const day = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
    return `${day}, ${time}`;
  } catch {
    return iso;
  }
};

const useColumns = (
  onEdit: (entry: RecentLessonRecordItem) => void,
  onDeleteRequest: (entry: RecentLessonRecordItem) => void,
): ColumnDef<RecentLessonRecordItem>[] => {
  const t = useTranslations("RecordKeeping");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  return [
    {
      id: "lesson",
      accessorFn: (row) => row.lessonName ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columnLesson")} />
      ),
      meta: { labelKey: "columnLesson" },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-semibold">
            {row.original.lessonName ?? "—"}
          </div>
          {row.original.areaName && (
            <div className="truncate text-[11.5px] text-muted-foreground">
              {row.original.areaName}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "students",
      accessorFn: (row) => row.students.length,
      header: t("columnStudents"),
      enableSorting: false,
      cell: ({ row }) => <AvatarGroup people={row.original.students} />,
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      header: t("columnStatus"),
      filterFn: (row, id, value) => {
        const picks = value as string[] | undefined;
        return !picks?.length || picks.includes(row.getValue<string>(id));
      },
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={STATUS_BADGE_VARIANT[status] ?? "slate"}>
            {t(status)}
          </Badge>
        );
      },
    },
    {
      id: "recordedAt",
      accessorFn: (row) => row.recordedAt,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columnRecordedAt")} />
      ),
      meta: { labelKey: "columnRecordedAt" },
      cell: ({ row }) => (
        <span className="font-mono text-[13px] text-foreground">
          {formatDateTime(
            row.original.recordedAt,
            locale,
            t("todayLabel"),
            t("yesterdayLabel"),
          )}
        </span>
      ),
    },
    {
      id: "durationMinutes",
      accessorFn: (row) => row.durationMinutes ?? -1,
      header: t("columnDuration"),
      cell: ({ row }) => {
        const mins = row.original.durationMinutes;
        return (
          <span className="font-mono text-[13px] text-foreground">
            {mins != null ? t("durationMinutes", { count: mins }) : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={tCommon("actions")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="size-4" />
              {tCommon("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteRequest(row.original)}
            >
              <Trash2 className="size-4" />
              {tCommon("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
};

export const ProgressEntriesTable = ({ data, onExport }: Props) => {
  const t = useTranslations("RecordKeeping");
  const locale = useLocale();
  const router = useRouter();
  const [rows, setRows] = React.useState(data);
  const [deleting, setDeleting] = React.useState<RecentLessonRecordItem | null>(
    null,
  );

  React.useEffect(() => setRows(data), [data]);

  const handleEdit = (entry: RecentLessonRecordItem) => {
    router.push(ROUTES.admin.recordKeepingEntryEdit(locale, entry.recordIds));
  };

  const columns = useColumns(handleEdit, setDeleting);

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: rows,
    columns,
    initialPageSize: 10,
    initialSorting: [{ id: "recordedAt", desc: true }],
  });

  const filterGroups: FilterGroup[] = React.useMemo(
    () => [
      {
        id: "status",
        label: t("columnStatus"),
        options: [
          "PLANNING",
          "INTRODUCED",
          "PRACTICED",
          "MASTERED",
          "NEEDS_MORE",
        ].map((status) => ({ value: status, label: t(status) })),
      },
    ],
    [t],
  );

  return (
    <>
      <DataTable
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder={t("searchPlaceholder")}
        filterGroups={filterGroups}
        translateColumn={(key) => t(key)}
        toolbar={
          onExport ? (
            <Button variant="outline" onClick={onExport}>
              {t("exportButton")}
            </Button>
          ) : undefined
        }
      />
      <DeleteConfirmationDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        itemName={deleting?.lessonName ?? undefined}
        onConfirm={async () => {
          if (!deleting) return { success: false };
          const result = await deleteLessonRecordsGroupAction(
            deleting.recordIds,
          );
          if (result.success) {
            setRows((prev) =>
              prev.filter((r) => r.recordIds.join(",") !== deleting.recordIds.join(",")),
            );
          }
          return result;
        }}
        onSuccess={() => setDeleting(null)}
      />
    </>
  );
};
