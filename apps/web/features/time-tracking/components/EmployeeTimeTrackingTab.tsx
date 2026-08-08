"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { format, type Locale } from "date-fns";
import { de, enUS } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  DailyTimeTracking,
  DailyTimeTrackingEntry,
  DailyTimeTrackingKind,
  MonthlyTimeTrackingGroup,
} from "../types";

const PILL_TONE: Record<string, string> = {
  green: "bg-status-green text-status-green-foreground",
  sky: "bg-status-sky text-status-sky-foreground",
  amber: "bg-status-amber text-status-amber-foreground",
  slate: "bg-status-slate text-status-slate-foreground",
};

function StatusPill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        PILL_TONE[tone] ?? PILL_TONE.slate,
      )}
    >
      {children}
    </span>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
const fmtHM = (min: number): string => `${Math.floor(min / 60)}:${pad(min % 60)}`;
const fmtBalance = (min: number): string => {
  const sign = min < 0 ? "−" : min > 0 ? "+" : "±";
  const a = Math.abs(min);
  return `${sign}${fmtHM(a)}`;
};
const timeOf = (iso: string): string => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type Filter = "all" | "deviations" | "open";

function statusFor(kind: DailyTimeTrackingKind, isMissing: boolean) {
  if (isMissing) return { tone: "amber", key: "statusOpen" as const };
  switch (kind) {
    case "ENTRY":
      return { tone: "green", key: "statusRecorded" as const };
    case "ABSENCE":
      return { tone: "sky", key: "statusAbsence" as const };
    default:
      return { tone: "slate", key: "statusFree" as const };
  }
}

export type TimeTrackingCursor = { year: number; month: number };

interface StatsProps {
  cursor: TimeTrackingCursor;
  group: MonthlyTimeTrackingGroup | undefined;
  netBalanceMinutes: number | null | undefined;
  missingRecordDaysCount: number;
}

export function EmployeeTimeTrackingStats({
  cursor,
  group,
  netBalanceMinutes,
  missingRecordDaysCount,
}: StatsProps) {
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const dateLocale = locale === "de" ? de : enUS;
  const monthShort = (y: number, m: number) =>
    format(new Date(y, m - 1, 1), "LLLL", { locale: dateLocale });

  return (
    <div className="flex flex-wrap gap-6 rounded-card border bg-card px-5 py-[15px] shadow-xs">
      <div className="flex flex-col gap-0.5 border-r border-border pr-6 last:border-r-0 last:pr-0">
        <small className="text-[11.5px] font-medium text-muted-foreground">
          {tE("mz.kpiSollMonth", { month: monthShort(cursor.year, cursor.month) })}
        </small>
        <b className="text-[20px] font-bold tracking-tight tabular-nums">
          {group ? `${(group.plannedMinutes / 60).toFixed(1)} h` : "–"}
        </b>
      </div>
      <div className="flex flex-col gap-0.5 border-r border-border pr-6 last:border-r-0 last:pr-0">
        <small className="text-[11.5px] font-medium text-muted-foreground">
          {tE("mz.kpiIstMonth", { month: monthShort(cursor.year, cursor.month) })}
        </small>
        <b className="text-[20px] font-bold tracking-tight tabular-nums">
          {group ? `${(group.workedMinutes / 60).toFixed(1)} h` : "–"}
          {group && (
            <em className="ml-1 text-xs font-semibold not-italic text-accent-foreground">
              {(() => {
                const delta = group.workedMinutes - group.plannedMinutes;
                const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
                return `${sign}${(Math.abs(delta) / 60).toFixed(1)} h`;
              })()}
            </em>
          )}
        </b>
      </div>
      <div className="flex flex-col gap-0.5 border-r border-border pr-6 last:border-r-0 last:pr-0">
        <small className="text-[11.5px] font-medium text-muted-foreground">
          {tE("mz.kpiBalanceTotal")}
        </small>
        <b className="text-[20px] font-bold tracking-tight tabular-nums">
          {netBalanceMinutes != null ? fmtBalance(netBalanceMinutes) : "–"}
        </b>
      </div>
      <div className="flex flex-col gap-0.5 pr-6 last:pr-0">
        <small className="text-[11.5px] font-medium text-muted-foreground">
          {tE("mz.kpiOpenDays")}
        </small>
        <b className="text-[20px] font-bold tracking-tight tabular-nums">
          {missingRecordDaysCount}
        </b>
      </div>
    </div>
  );
}

interface Props {
  monthlyGroups: MonthlyTimeTrackingGroup[];
  missingRecordDays: string[];
  workloadPercent: number | null;
  onMonthChange?: (range: { year: number; month: number; from: string; to: string }) => void;
  cursor: TimeTrackingCursor;
  onCursorChange: (cursor: TimeTrackingCursor) => void;
}

export default function EmployeeTimeTrackingTab({
  monthlyGroups,
  missingRecordDays,
  workloadPercent,
  onMonthChange,
  cursor,
  onCursorChange,
}: Props) {
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const dateLocale = locale === "de" ? de : enUS;

  const now = new Date();
  const setCursor = (
    updater: TimeTrackingCursor | ((prev: TimeTrackingCursor) => TimeTrackingCursor),
  ) => {
    onCursorChange(typeof updater === "function" ? updater(cursor) : updater);
  };
  const [popOpen, setPopOpen] = useState(false);
  const [popYear, setPopYear] = useState(cursor.year);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!onMonthChange) return;
    const from = `${cursor.year}-${pad(cursor.month)}-01`;
    const toDate = new Date(cursor.year, cursor.month, 0);
    const to = `${cursor.year}-${pad(cursor.month)}-${pad(toDate.getDate())}`;
    onMonthChange({ year: cursor.year, month: cursor.month, from, to });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.year, cursor.month]);

  const missingSet = useMemo(() => new Set(missingRecordDays), [missingRecordDays]);

  const group = monthlyGroups.find(
    (g) => g.year === cursor.year && g.month === cursor.month,
  );
  const days = useMemo(
    () => [...(group?.days ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [group],
  );

  const filteredDays = days.filter((d) => {
    const isMissing = missingSet.has(d.date);
    if (filter === "open") return isMissing;
    if (filter === "deviations") {
      const balance = d.workMinutes - d.plannedMinutes;
      return balance !== 0 || isMissing;
    }
    return true;
  });

  const monthLabel = (y: number, m: number) =>
    format(new Date(y, m - 1, 1), "LLLL yyyy", { locale: dateLocale });

  const goMonth = (delta: number) => {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  const selectMonth = (month: number) => {
    setCursor({ year: popYear, month });
    setPopOpen(false);
  };

  const recordedCount = days.filter((d) => d.kind === "ENTRY").length;
  const workdayCount = days.filter((d) => d.kind !== "HOLIDAY").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => goMonth(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Popover open={popOpen} onOpenChange={(o) => { setPopOpen(o); if (o) setPopYear(cursor.year); }}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 rounded-full border-primary bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            >
              {monthLabel(cursor.year, cursor.month)}
              <ChevronDown className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="mb-2 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setPopYear((y) => y - 1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <b className="text-sm">{popYear}</b>
              <Button variant="ghost" size="icon" onClick={() => setPopYear((y) => y + 1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={
                    popYear === cursor.year && m === cursor.month
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => selectMonth(m)}
                >
                  {format(new Date(popYear, m - 1, 1), "LLL", { locale: dateLocale })}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                setCursor({ year: now.getFullYear(), month: now.getMonth() + 1 });
                setPopOpen(false);
              }}
            >
              {tE("mz.currentMonth")}
            </Button>
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" onClick={() => goMonth(1)}>
          <ChevronRight className="size-4" />
        </Button>

        <div className="ml-auto flex flex-wrap gap-2">
          {(["all", "deviations", "open"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-field text-muted-foreground hover:bg-muted",
              )}
            >
              {tE(`mz.filter${f === "all" ? "All" : f === "deviations" ? "Deviations" : "Open"}`)}
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-white p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tE("mz.colDate")}</TableHead>
                <TableHead>{tE("mz.colTimeRange")}</TableHead>
                <TableHead>{tE("mz.colBreak")}</TableHead>
                <TableHead>{tE("mz.colActual")}</TableHead>
                <TableHead>{tE("mz.colPlanned")}</TableHead>
                <TableHead>{tE("mz.colBalance")}</TableHead>
                <TableHead>{tE("mz.colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDays.map((day) =>
                renderDayRows(day, missingSet.has(day.date), dateLocale, tE),
              )}
              {filteredDays.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-4 text-center text-muted-foreground"
                  >
                    {tE("mz.noEntries")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        {tE("mz.footerNote", {
          recorded: recordedCount,
          total: workdayCount,
          planned: group ? (group.plannedMinutes / 60 / Math.max(1, recordedCount || 1)).toFixed(1) : "–",
          workload: workloadPercent ?? "–",
        })}
      </p>
    </div>
  );
}

function renderDayRows(
  day: DailyTimeTracking,
  isMissing: boolean,
  dateLocale: Locale,
  tE: ReturnType<typeof useTranslations>,
) {
  const { tone, key } = statusFor(day.kind, isMissing);
  const dateLabel = format(new Date(day.date), "EEE, dd.MM.", { locale: dateLocale });
  const balance = day.workMinutes - day.plannedMinutes;
  const entries: DailyTimeTrackingEntry[] =
    day.entries && day.entries.length > 0 ? day.entries : [];

  const mono = "font-mono text-xs tabular-nums";

  if (entries.length === 0) {
    return (
      <TableRow key={day.date}>
        <TableCell className={mono}>{dateLabel}</TableCell>
        <TableCell className={mono}>{day.label ?? "—"}</TableCell>
        <TableCell className={mono}>—</TableCell>
        <TableCell className={mono}>
          {day.workMinutes > 0 ? fmtHM(day.workMinutes) : "—"}
        </TableCell>
        <TableCell className={mono}>{fmtHM(day.plannedMinutes)}</TableCell>
        <TableCell className={mono}>{fmtBalance(balance)}</TableCell>
        <TableCell>
          <StatusPill tone={tone}>{tE(`mz.${key}`)}</StatusPill>
        </TableCell>
      </TableRow>
    );
  }

  return entries.map((entry, i) => (
    <TableRow key={entry.id}>
      {i === 0 && (
        <TableCell className={mono} rowSpan={entries.length}>
          {dateLabel}
        </TableCell>
      )}
      <TableCell className={mono}>
        {entry.startedAt ? timeOf(entry.startedAt) : "–"}
        {" – "}
        {entry.endedAt ? timeOf(entry.endedAt) : "–"}
      </TableCell>
      <TableCell className={mono}>
        {entry.breakMinutes ? fmtHM(entry.breakMinutes) : "0:00"}
      </TableCell>
      <TableCell className={mono}>
        {entry.workMinutes ? fmtHM(entry.workMinutes) : "—"}
      </TableCell>
      {i === 0 && (
        <>
          <TableCell className={mono} rowSpan={entries.length}>
            {fmtHM(day.plannedMinutes)}
          </TableCell>
          <TableCell className={mono} rowSpan={entries.length}>
            {fmtBalance(balance)}
          </TableCell>
          <TableCell rowSpan={entries.length}>
            <StatusPill tone={tone}>{tE(`mz.${key}`)}</StatusPill>
          </TableCell>
        </>
      )}
    </TableRow>
  ));
}
