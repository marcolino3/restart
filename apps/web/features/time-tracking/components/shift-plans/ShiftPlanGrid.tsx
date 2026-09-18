"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Plus, Star, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableCard } from "@/components/common/TableCard";
import { EmployeeAvatar } from "@/features/employees/components/EmployeeAvatar";
import { cn } from "@/lib/utils";
import {
  setShiftAssignmentsAction,
  type ShiftAssignment,
  type ShiftPlanDetail,
} from "../../actions/shift-plans.action";
import { ShiftChip } from "../ShiftsSection";
import {
  datesBetween,
  formatPlanDate,
  isoWeekOf,
  weekdayOf,
} from "../../lib/shift-plan-dates";

interface Props {
  detail: ShiftPlanDetail;
  canWrite: boolean;
}

const fullName = (e: { firstName: string | null; lastName: string | null }) =>
  [e.firstName, e.lastName].filter(Boolean).join(" ");

/** Date x shift grid of a plan: required vs. assigned per cell, assignment popover. */
export const ShiftPlanGrid = ({ detail, canWrite }: Props) => {
  const t = useTranslations("TimeTracking");
  const locale = useLocale();
  const router = useRouter();
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(
    detail.assignments,
  );
  const [openCell, setOpenCell] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dates = useMemo(
    () => datesBetween(detail.plan.startDate, detail.plan.endDate),
    [detail.plan.startDate, detail.plan.endDate],
  );

  const required = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of detail.coverage) m[`${r.shiftId}:${r.weekday}`] = r.requiredCount;
    return m;
  }, [detail.coverage]);

  const employeesById = useMemo(() => {
    const m = new Map<string, { firstName: string | null; lastName: string | null }>();
    for (const e of detail.employees) m.set(e.employeeId, e);
    for (const c of detail.candidates) m.set(c.employeeId, c);
    return m;
  }, [detail.employees, detail.candidates]);

  const byCell = useMemo(() => {
    const m = new Map<string, ShiftAssignment[]>();
    for (const a of assignments) {
      const k = `${a.date}:${a.shiftId}`;
      m.set(k, [...(m.get(k) ?? []), a]);
    }
    return m;
  }, [assignments]);

  const assignedElsewhere = (date: string, shiftId: string, employeeId: string) =>
    assignments.some(
      (a) => a.date === date && a.employeeId === employeeId && a.shiftId !== shiftId,
    );

  const toggle = async (date: string, shiftId: string, employeeId: string) => {
    const current = byCell.get(`${date}:${shiftId}`) ?? [];
    const ids = current.map((a) => a.employeeId);
    const next = ids.includes(employeeId)
      ? ids.filter((id) => id !== employeeId)
      : [...ids, employeeId];
    setSaving(true);
    const res = await setShiftAssignmentsAction({
      planId: detail.plan.id,
      date,
      shiftId,
      employeeIds: next,
    });
    setSaving(false);
    if (res.success) {
      setAssignments((prev) => [
        ...prev.filter((a) => !(a.date === date && a.shiftId === shiftId)),
        ...res.data,
      ]);
      router.refresh();
    } else {
      toast.error(t("shiftPlanAssignError"));
    }
  };

  /** Dates that start a new ISO week (week header row above them). */
  const weekStarts = useMemo(() => {
    const set = new Set<string>();
    let last: number | null = null;
    for (const d of dates) {
      const w = isoWeekOf(d);
      if (w !== last) set.add(d);
      last = w;
    }
    return set;
  }, [dates]);

  return (
    <TableCard>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">{t("shiftPlanPeriod")}</TableHead>
              {detail.shifts.map((s) => (
                <TableHead key={s.id} className="min-w-[200px]">
                  <div className="flex flex-col gap-0.5">
                    <ShiftChip shift={s} />
                    <span className="text-xs font-normal text-muted-foreground">
                      {s.startTime} – {s.endTime}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dates.map((date) => {
              const week = isoWeekOf(date);
              const showWeek = weekStarts.has(date);
              const wd = weekdayOf(date);
              const weekend = wd === "sat" || wd === "sun";
              return (
                <Fragment key={date}>
                  {showWeek && (
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell
                        colSpan={detail.shifts.length + 1}
                        className="py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {t("shiftPlanWeek", { week })}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className={cn(weekend && "bg-muted/20")}>
                    <TableCell className="align-top font-medium">
                      {formatPlanDate(date, locale)}
                    </TableCell>
                    {detail.shifts.map((shift) => {
                      const req = required[`${shift.id}:${wd}`] ?? 0;
                      const cell = byCell.get(`${date}:${shift.id}`) ?? [];
                      const cellId = `${date}:${shift.id}`;
                      const candidates = detail.candidates.filter((c) =>
                        c.availableDates.includes(date),
                      );
                      const badgeVariant =
                        req === 0
                          ? cell.length > 0
                            ? "slate"
                            : "outline"
                          : cell.length >= req
                            ? "green"
                            : "rose";
                      return (
                        <TableCell key={shift.id} className="align-top">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <Badge variant={badgeVariant}>
                                {cell.length}/{req}
                              </Badge>
                              {canWrite && (
                                <Popover
                                  open={openCell === cellId}
                                  onOpenChange={(o) => setOpenCell(o ? cellId : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      aria-label={t("shiftPlanAssign")}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-72 p-0" align="start">
                                    <Command>
                                      <CommandInput
                                        placeholder={t("shiftPlanSearchCandidate")}
                                      />
                                      <CommandList>
                                        <CommandEmpty>
                                          {t("shiftPlanNoCandidates")}
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {candidates.map((c) => {
                                            const selected = cell.some(
                                              (a) => a.employeeId === c.employeeId,
                                            );
                                            const pref = c.preferences.find(
                                              (p) => p.shiftId === shift.id,
                                            )?.level;
                                            const elsewhere = assignedElsewhere(
                                              date,
                                              shift.id,
                                              c.employeeId,
                                            );
                                            return (
                                              <CommandItem
                                                key={c.employeeId}
                                                value={`${fullName(c)} ${c.employeeId}`}
                                                disabled={saving}
                                                onSelect={() =>
                                                  toggle(date, shift.id, c.employeeId)
                                                }
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selected ? "opacity-100" : "opacity-0",
                                                  )}
                                                />
                                                <span className="flex-1 truncate">
                                                  {fullName(c)}
                                                </span>
                                                {pref === "PREFERRED" && (
                                                  <Star
                                                    className="ml-2 h-3.5 w-3.5 text-amber-500"
                                                    aria-label={t("shiftPlanPreferred")}
                                                  />
                                                )}
                                                {pref === "AVOID" && (
                                                  <Ban
                                                    className="ml-2 h-3.5 w-3.5 text-muted-foreground"
                                                    aria-label={t("shiftPlanAvoid")}
                                                  />
                                                )}
                                                {elsewhere && (
                                                  <span className="ml-2 text-[11px] text-muted-foreground">
                                                    {t("shiftPlanAlreadyAssigned")}
                                                  </span>
                                                )}
                                              </CommandItem>
                                            );
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                            {cell.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                {t("shiftPlanUnassigned")}
                              </span>
                            ) : (
                              <ul className="flex flex-wrap gap-1">
                                {cell.map((a) => {
                                  const e = employeesById.get(a.employeeId);
                                  return (
                                    <li
                                      key={a.id}
                                      className="flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs"
                                    >
                                      <EmployeeAvatar
                                        firstName={e?.firstName}
                                        lastName={e?.lastName}
                                        className="h-5 w-5 text-[9px]"
                                      />
                                      <span className="max-w-[140px] truncate">
                                        {e ? fullName(e) : "–"}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TableCard>
  );
};
