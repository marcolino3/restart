"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  BellRing,
  Check,
  Loader2,
  Search,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type SortKey = "title" | "application" | "due" | "assignee" | "status";
type SortDir = "asc" | "desc";

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
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
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

  const now = new Date();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? reminders.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.applicationChildName.toLowerCase().includes(q) ||
            (r.assignedToName ?? "").toLowerCase().includes(q),
        )
      : reminders;
    const dir = sortDir === "asc" ? 1 : -1;
    const value = (r: OrgAdmissionReminder): string | number => {
      switch (sortKey) {
        case "title":
          return r.title.toLowerCase();
        case "application":
          return r.applicationChildName.toLowerCase();
        case "due":
          return new Date(r.dueAt).getTime();
        case "assignee":
          return (r.assignedToName ?? "").toLowerCase();
        case "status":
          return statusOf(r, now).rank;
        default:
          return "";
      }
    };
    return [...filtered].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (typeof va === "number" && typeof vb === "number")
        return dir * (va - vb);
      return dir * String(va).localeCompare(String(vb));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("remSearchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as AdmissionReminderListFilter)}
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
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loading")}
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm italic text-muted-foreground">
          {t("remindersEmptyFilter")}
        </p>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <ColHead
                  label={t("remColReminder")}
                  active={sortKey === "title"}
                  dir={sortDir}
                  onClick={() => toggleSort("title")}
                />
                <ColHead
                  label={t("remColApplication")}
                  active={sortKey === "application"}
                  dir={sortDir}
                  onClick={() => toggleSort("application")}
                />
                <ColHead
                  label={t("remColDue")}
                  active={sortKey === "due"}
                  dir={sortDir}
                  onClick={() => toggleSort("due")}
                />
                <ColHead
                  label={t("remColAssignee")}
                  active={sortKey === "assignee"}
                  dir={sortDir}
                  onClick={() => toggleSort("assignee")}
                />
                <ColHead
                  label={t("remColStatus")}
                  active={sortKey === "status"}
                  dir={sortDir}
                  onClick={() => toggleSort("status")}
                />
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const status = statusOf(r, now);
                return (
                  <TableRow key={r.id}>
                    <TableCell
                      className={cn(
                        "font-medium",
                        r.completedAt && "text-muted-foreground line-through",
                      )}
                    >
                      {r.title}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/admissions/${r.applicationId}`)
                        }
                        className="font-medium text-primary hover:underline"
                      >
                        {r.applicationChildName}
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums">
                      {new Date(r.dueAt).toLocaleString("de-CH", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.assignedToName ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{t(status.key)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={() => onToggle(r)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {r.completedAt
                            ? t("reminderReopen")
                            : t("remMarkDone")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ColHead({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {!active ? (
          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
        ) : dir === "asc" ? (
          <ArrowUp className="ml-1 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-1 h-3 w-3" />
        )}
      </button>
    </TableHead>
  );
}
