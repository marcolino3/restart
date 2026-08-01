"use client";

import {
  IconDots,
  IconLayersSubtract,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { useDataTable } from "@/components/data-table/use-data-table";
import { cn } from "@/lib/utils";

import { deleteProtocolAction } from "../actions/manage-protocols.action";
import type { ProtocolListRow } from "../actions/get-protocols.action";
import { CreateProtocolDialog } from "./CreateProtocolDialog";
import { ManageProtocolTemplatesDialog } from "./ManageProtocolTemplatesDialog";
import type { ProjectListItem, ProtocolStatus, ProtocolTemplate } from "../types";

type StatusFilter = "ALL" | ProtocolStatus;

type Props = {
  protocols: ProtocolListRow[];
  projects: ProjectListItem[];
  templates: ProtocolTemplate[];
  canWrite: boolean;
  canDelete: boolean;
  canManage: boolean;
};

const FILTERS: { key: StatusFilter; labelKey: string }[] = [
  { key: "ALL", labelKey: "filterAll" },
  { key: "DRAFT", labelKey: "filterDrafts" },
  { key: "FINALIZED", labelKey: "filterFinalized" },
];

export function ProtocolStatusBadge({ status }: { status: ProtocolStatus }) {
  const t = useTranslations("Protocols");
  return status === "FINALIZED" ? (
    <Badge
      variant="outline"
      className="border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
    >
      {t("status_FINALIZED")}
    </Badge>
  ) : (
    <Badge variant="secondary">{t("status_DRAFT")}</Badge>
  );
}

export function ProtocolsList({
  protocols,
  projects,
  templates,
  canWrite,
  canDelete,
  canManage,
}: Props) {
  const t = useTranslations("Protocols");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [templatesOpen, setTemplatesOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [locale]
  );

  // The status chips stay a server-of-truth control of their own; free-text
  // search and sorting are handled by the table.
  const filtered = React.useMemo(
    () =>
      statusFilter === "ALL"
        ? protocols
        : protocols.filter((p) => p.status === statusFilter),
    [protocols, statusFilter],
  );

  const columns = React.useMemo<ColumnDef<ProtocolListRow>[]>(() => {
    const cols: ColumnDef<ProtocolListRow>[] = [
      {
        id: "title",
        accessorFn: (p) => p.title,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("title")} />
        ),
        meta: { labelKey: "title" },
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue<string>()}</span>
        ),
      },
      {
        id: "meetingDate",
        // Sorted on the timestamp, not on the localised date string.
        accessorFn: (p) =>
          p.meetingDate ? new Date(p.meetingDate).getTime() : 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("colMeeting")} />
        ),
        meta: { labelKey: "colMeeting" },
        cell: ({ row }) =>
          row.original.meetingDate ? (
            <span className="font-mono text-xs">
              {dateFormatter.format(new Date(row.original.meetingDate))}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "project",
        accessorFn: (p) => p.project?.title ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("project")} />
        ),
        meta: { labelKey: "project" },
        cell: ({ getValue }) =>
          getValue<string>() || <span className="text-muted-foreground">—</span>,
      },
      {
        id: "participants",
        accessorFn: (p) => (p.participants ?? []).length,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("colParticipants")} />
        ),
        meta: { labelKey: "colParticipants" },
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue<number>()}</span>
        ),
      },
      {
        id: "status",
        accessorFn: (p) => p.status,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("status")} />
        ),
        meta: { labelKey: "status" },
        cell: ({ row }) => <ProtocolStatusBadge status={row.original.status} />,
      },
    ];

    if (canDelete) {
      cols.push({
        id: "actions",
        enableHiding: false,
        header: () => <span className="sr-only">{tc("actions")}</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <DeleteConfirmationDialog
              itemName={row.original.title}
              onConfirm={async () => {
                const res = await deleteProtocolAction(row.original.id);
                if (res.success) {
                  router.refresh();
                  return { success: true };
                }
                return { success: false, error: String(res.error) };
              }}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label={tc("delete")}
                  title={tc("delete")}
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </Button>
              }
            />
          </div>
        ),
      });
    }

    return cols;
  }, [t, tc, canDelete, dateFormatter, router]);

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: filtered,
    columns,
    // Most recent meeting first — protocols are read as a history.
    initialSorting: [{ id: "meetingDate", desc: true }],
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("meetingsCount", { count: protocols.length })}
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus className="mr-1 h-4 w-4" />
            {t("newProtocol")}
          </Button>
        )}
      </div>

      {protocols.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noProtocols")}</p>
      ) : (
        <DataTable
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          searchPlaceholder={t("searchProtocolPlaceholder")}
          translateColumn={(key) => t(key)}
          onRowClick={(row) =>
            router.push(ROUTES.admin.protocolEditor(locale, row.original.id))
          }
          // Status chips stay their own control rather than a filter group:
          // they are the page's primary navigation between drafts and finals.
          toolbar={
            <>
              {FILTERS.map(({ key, labelKey }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  aria-pressed={statusFilter === key}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full border px-4 text-[13px] font-medium transition",
                    statusFilter === key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {t(labelKey)}
                </button>
              ))}
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 rounded-full"
                      aria-label={t("moreSettings")}
                    >
                      <IconDots className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem onClick={() => setTemplatesOpen(true)}>
                      <IconLayersSubtract className="mr-2 h-4 w-4" />
                      {t("manageTemplates")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          }
          emptyState={
            <span className="text-sm text-muted-foreground">
              {t("noResults")}
            </span>
          }
        />
      )}

      <p className="text-xs text-muted-foreground">{t("autoTasksHint")}</p>

      <CreateProtocolDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={projects}
        templates={templates}
      />
      {canManage && (
        <ManageProtocolTemplatesDialog
          open={templatesOpen}
          onOpenChange={setTemplatesOpen}
          templates={templates}
        />
      )}
    </div>
  );
}
