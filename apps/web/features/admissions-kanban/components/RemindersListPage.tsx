"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Bell, BellRing, Check, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import type { FilterGroup } from "@/components/data-table/DataTableFilter";
import { useDataTable } from "@/components/data-table/use-data-table";
import { multiSelectFilter } from "@/lib/table/locale-sorting";
import { cn } from "@/lib/utils";

import type {
  AdmissionReminderListFilter,
  OrgAdmissionReminder,
} from "../actions/get-org-admission-reminders.action";
import { getOrgAdmissionRemindersAction } from "../actions/get-org-admission-reminders.action";
import {
  completeAdmissionReminderAction,
  uncompleteAdmissionReminderAction,
} from "../actions/mutate-admission-reminder.action";
import { AdmissionsSubNav } from "./AdmissionsSubNav";

interface Props {
  initialFilter: AdmissionReminderListFilter;
  initialReminders: OrgAdmissionReminder[];
  canEdit: boolean;
}

const FILTERS: AdmissionReminderListFilter[] = [
  "OVERDUE",
  "TODAY",
  "WEEK",
  "OPEN",
  "COMPLETED",
];

const FILTER_LABELS: Record<AdmissionReminderListFilter, string> = {
  OVERDUE: "remindersFilterOverdue",
  TODAY: "remindersFilterToday",
  WEEK: "remindersFilterWeek",
  OPEN: "remindersFilterOpen",
  COMPLETED: "remindersFilterCompleted",
};

/** Derived status bucket for a reminder row. */
function statusOf(
  r: OrgAdmissionReminder,
  now: Date,
): {
  key: string;
  variant: "green" | "rose" | "amber" | "slate";
  rank: number;
} {
  if (r.completedAt) return { key: "remStatusDone", variant: "green", rank: 3 };
  const due = new Date(r.dueAt);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  if (due < startOfToday)
    return { key: "remStatusOverdue", variant: "rose", rank: 0 };
  if (due <= endOfToday)
    return { key: "remStatusToday", variant: "amber", rank: 1 };
  return { key: "remStatusPlanned", variant: "slate", rank: 2 };
}

export function RemindersListPage({
  initialFilter,
  initialReminders,
  canEdit,
}: Props) {
  const t = useTranslations("Admissions");
  const router = useRouter();
  const [filter, setFilter] =
    useState<AdmissionReminderListFilter>(initialFilter);
  const [reminders, setReminders] =
    useState<OrgAdmissionReminder[]>(initialReminders);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    getOrgAdmissionRemindersAction(filter).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.success) setReminders(res.data);
      else toast.error(res.error ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const refresh = () => {
    startTransition(async () => {
      const res = await getOrgAdmissionRemindersAction(filter);
      if (res.success) setReminders(res.data);
    });
  };

  const onToggle = (r: OrgAdmissionReminder) => {
    startTransition(async () => {
      const res = r.completedAt
        ? await uncompleteAdmissionReminderAction(r.id, r.applicationId)
        : await completeAdmissionReminderAction(r.id, r.applicationId);
      if (!res.success) {
        toast.error(res.error ?? t("reminderUpdateError"));
        return;
      }
      refresh();
    });
  };

  // Computed once per render so every row is bucketed against one instant.
  const now = new Date();

  const columns = useMemo<ColumnDef<OrgAdmissionReminder>[]>(
    () => [
      {
        id: "title",
        accessorFn: (r) => r.title,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("remColReminder")} />
        ),
        meta: { labelKey: "remColReminder" },
        cell: ({ row }) => (
          <span
            className={cn(
              "font-medium",
              row.original.completedAt &&
                "text-muted-foreground line-through",
            )}
          >
            {row.original.title}
          </span>
        ),
      },
      {
        id: "application",
        accessorFn: (r) => r.applicationChildName,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("remColApplication")}
          />
        ),
        meta: { labelKey: "remColApplication" },
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() =>
              router.push(`/admin/admissions/${row.original.applicationId}`)
            }
            className="font-medium text-primary hover:underline"
          >
            {row.original.applicationChildName}
          </button>
        ),
      },
      {
        id: "due",
        accessorFn: (r) => new Date(r.dueAt).getTime() || 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("remColDue")} />
        ),
        meta: { labelKey: "remColDue" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs tabular-nums">
            {new Date(row.original.dueAt).toLocaleString("de-CH", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        id: "assignee",
        accessorFn: (r) => r.assignedToName ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("remColAssignee")} />
        ),
        meta: { labelKey: "remColAssignee" },
        filterFn: multiSelectFilter,
        cell: ({ getValue }) =>
          getValue<string>() || (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "status",
        // Sorted by urgency rank (overdue → today → planned → done) rather
        // than by the translated label.
        accessorFn: (r) => statusOf(r, now).rank,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("remColStatus")} />
        ),
        meta: { labelKey: "remColStatus" },
        filterFn: (row, _id, value) => {
          if (!Array.isArray(value) || value.length === 0) return true;
          return value.includes(statusOf(row.original, now).key);
        },
        cell: ({ row }) => {
          const status = statusOf(row.original, now);
          return <Badge variant={status.variant}>{t(status.key)}</Badge>;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) =>
          canEdit ? (
            <div className="text-right">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => onToggle(row.original)}
              >
                <Check className="h-3.5 w-3.5" />
                {row.original.completedAt
                  ? t("reminderReopen")
                  : t("remMarkDone")}
              </Button>
            </div>
          ) : null,
      },
    ],
    // `onToggle`/`now` are recreated each render by design; the columns only
    // need to close over the current values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, router, canEdit],
  );

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: reminders,
    columns,
    initialSorting: [{ id: "due", desc: false }],
  });

  const filterGroups = useMemo<FilterGroup[]>(() => {
    const groups: FilterGroup[] = [];

    const assignees = Array.from(
      new Set(
        reminders
          .map((r) => r.assignedToName)
          .filter((n): n is string => Boolean(n)),
      ),
    ).sort((a, b) => a.localeCompare(b));

    if (assignees.length > 0) {
      groups.push({
        id: "assignee",
        label: t("remColAssignee"),
        options: assignees.map((name) => ({ value: name, label: name })),
      });
    }

    const statusKeys = Array.from(
      new Set(reminders.map((r) => statusOf(r, now).key)),
    );

    if (statusKeys.length > 1) {
      groups.push({
        id: "status",
        label: t("remColStatus"),
        options: statusKeys.map((key) => ({ value: key, label: t(key) })),
      });
    }

    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, t]);

  const overdueCount = reminders.filter(
    (r) => !r.completedAt && new Date(r.dueAt) < now,
  ).length;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bell className="h-6 w-6 text-muted-foreground" />
          {t("remindersPageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("remindersPageSubtitle")}
        </p>
      </div>

      <AdmissionsSubNav active="reminders" reminderCount={overdueCount} />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loading")}
        </div>
      ) : (
        <DataTable
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          searchPlaceholder={t("remSearchPlaceholder")}
          filterGroups={filterGroups}
          translateColumn={(key) => t(key)}
          // The server-side date buckets stay their own control: they change
          // what is fetched, not just what is shown.
          toolbar={
            <Tabs
              value={filter}
              onValueChange={(v) =>
                setFilter(v as AdmissionReminderListFilter)
              }
            >
              <TabsList>
                {FILTERS.map((f) => (
                  <TabsTrigger key={f} value={f} className="gap-1.5">
                    {f === "OVERDUE" && <BellRing className="h-3.5 w-3.5" />}
                    {t(FILTER_LABELS[f])}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
          emptyState={
            <span className="text-sm italic text-muted-foreground">
              {t("remindersEmptyFilter")}
            </span>
          }
        />
      )}
    </div>
  );
}
