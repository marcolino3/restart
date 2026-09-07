"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableCard } from "@/components/common/TableCard";
import type { Shift } from "../../actions/shifts.action";
import {
  setShiftCoverageAction,
  type ShiftCoverageRow,
} from "../../actions/shift-plans.action";
import { ShiftChip } from "../ShiftsSection";
import { WEEKDAY_KEYS, weekdayLabel } from "../../lib/shift-plan-dates";

interface Props {
  teamId: string;
  shifts: Shift[];
  coverage: ShiftCoverageRow[];
  canEdit: boolean;
}

const cellKey = (shiftId: string, weekday: string) => `${shiftId}:${weekday}`;

const toMap = (rows: ShiftCoverageRow[]) => {
  const m: Record<string, number> = {};
  for (const r of rows) m[cellKey(r.shiftId, r.weekday)] = r.requiredCount;
  return m;
};

/** Weekday x shift grid with the required head count per cell. */
export const ShiftCoverageGrid = ({
  teamId,
  shifts,
  coverage,
  canEdit,
}: Props) => {
  const t = useTranslations("TimeTracking");
  const locale = useLocale();
  const router = useRouter();
  const initial = useMemo(() => toMap(coverage), [coverage]);
  const [values, setValues] = useState<Record<string, number>>(initial);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => {
    const keys = new Set([...Object.keys(initial), ...Object.keys(values)]);
    for (const k of keys) if ((initial[k] ?? 0) !== (values[k] ?? 0)) return true;
    return false;
  }, [initial, values]);

  const setCell = (shiftId: string, weekday: string, raw: string) => {
    const n = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(n) || n < 0) return;
    setValues((prev) => ({
      ...prev,
      [cellKey(shiftId, weekday)]: Math.min(999, Math.floor(n)),
    }));
  };

  const save = async () => {
    setSaving(true);
    const rows = shifts.flatMap((s) =>
      WEEKDAY_KEYS.map((wd) => ({
        shiftId: s.id,
        weekday: wd,
        requiredCount: values[cellKey(s.id, wd)] ?? 0,
      })),
    ).filter((r) => r.requiredCount > 0);
    const res = await setShiftCoverageAction({ teamId, rows });
    setSaving(false);
    if (res.success) {
      toast.success(t("shiftCoverageSaved"));
      router.refresh();
    } else {
      toast.error(t("shiftCoverageSaveError"));
    }
  };

  if (shifts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("shiftPlanNoShifts")}</p>
    );
  }

  return (
    <div className="space-y-3">
      <TableCard>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">{t("shift")}</TableHead>
                {WEEKDAY_KEYS.map((wd) => (
                  <TableHead key={wd} className="w-20 text-center">
                    {weekdayLabel(wd, locale)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <ShiftChip shift={shift} />
                      <span className="text-xs text-muted-foreground">
                        {shift.startTime} – {shift.endTime}
                      </span>
                    </div>
                  </TableCell>
                  {WEEKDAY_KEYS.map((wd) => {
                    const v = values[cellKey(shift.id, wd)] ?? 0;
                    return (
                      <TableCell key={wd} className="text-center">
                        {canEdit ? (
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={999}
                            value={v === 0 ? "" : String(v)}
                            placeholder="0"
                            aria-label={`${shift.name} ${weekdayLabel(wd, locale)}`}
                            onChange={(e) => setCell(shift.id, wd, e.target.value)}
                            className="mx-auto h-8 w-16 text-center"
                          />
                        ) : (
                          <span
                            className={
                              v > 0
                                ? "font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {v}
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableCard>
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={!dirty || saving} size="sm">
            {t("shiftCoverageSave")}
          </Button>
        </div>
      )}
    </div>
  );
};
