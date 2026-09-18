"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import type { Shift } from "@/features/time-tracking/actions/shifts.action";
import type {
  ShiftPreference,
  ShiftPreferenceLevel,
} from "@restart/shared-schemas/employees/employee-contract-form.schema";
import { WEEKDAY_KEYS, type WeekdayKey } from "@restart/shared-schemas/employees/employee-onboarding-form.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { WEEKDAY_SHORT_LABELS } from "../lib/workday-schedule";

interface Props {
  shifts: Shift[];
  /** Working days of the contract; empty means no per-day schedule (all days allowed). */
  workingDays: WeekdayKey[];
}

const LEVELS: { value: ShiftPreferenceLevel; label: string }[] = [
  { value: "PREFERRED", label: "shiftPreferencePreferred" },
  { value: "NEUTRAL", label: "shiftPreferenceNeutral" },
  { value: "AVOID", label: "shiftPreferenceAvoid" },
];

/**
 * Shift-work section of the contract form: opt-in switch, shift days (limited
 * to the contract's working days) and a preference per org shift.
 */
export function ContractShiftWorkFields({ shifts, workingDays }: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const { control, setValue } = useFormContext();
  const worksShifts = Boolean(useWatch({ control, name: "worksShifts" }));
  const shiftWeekdays = (useWatch({ control, name: "shiftWeekdays" }) ??
    []) as WeekdayKey[];
  const preferences = (useWatch({ control, name: "shiftPreferences" }) ??
    []) as ShiftPreference[];

  const allowed = workingDays.length > 0 ? workingDays : [...WEEKDAY_KEYS];
  const allowedKey = allowed.join(",");

  // Working days changed: drop shift days that are no longer working days.
  useEffect(() => {
    const pruned = shiftWeekdays.filter((d) => allowed.includes(d));
    if (pruned.length !== shiftWeekdays.length) {
      setValue("shiftWeekdays", pruned, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedKey]);

  const toggleDay = (day: WeekdayKey) => {
    const next = shiftWeekdays.includes(day)
      ? shiftWeekdays.filter((d) => d !== day)
      : WEEKDAY_KEYS.filter((d) => d === day || shiftWeekdays.includes(d));
    setValue("shiftWeekdays", next, { shouldDirty: true });
  };

  const levelFor = (shiftId: string): ShiftPreferenceLevel =>
    preferences.find((p) => p.shiftId === shiftId)?.level ?? "NEUTRAL";

  const setLevel = (shiftId: string, level: ShiftPreferenceLevel) => {
    const rest = preferences.filter((p) => p.shiftId !== shiftId);
    setValue(
      "shiftPreferences",
      level === "NEUTRAL" ? rest : [...rest, { shiftId, level }],
      { shouldDirty: true },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("shiftWork")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SwitchFormField
          name="worksShifts"
          label="shiftWork"
          description="shiftWorkDescription"
          namespace="EmployeeOnboarding"
        />

        {worksShifts && (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold">
                  {t("shiftWeekdays")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("shiftWeekdaysHint")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_KEYS.map((day) => {
                  const active = shiftWeekdays.includes(day);
                  const disabled = !allowed.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      aria-pressed={active}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "min-w-10 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        disabled && "cursor-not-allowed opacity-40 hover:bg-background",
                      )}
                    >
                      {WEEKDAY_SHORT_LABELS[day]}
                    </button>
                  );
                })}
              </div>
              {shiftWeekdays.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("shiftWeekdaysAll")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold">
                  {t("shiftPreferences")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("shiftPreferencesHint")}
                </span>
              </div>
              {shifts.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("shiftNoneDefined")}
                </p>
              ) : (
                <ul className="flex flex-col divide-y rounded-md border">
                  {shifts.map((shift) => (
                    <li
                      key={shift.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {shift.color && (
                          <span
                            aria-hidden
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: shift.color }}
                          />
                        )}
                        <span className="text-sm font-medium">{shift.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {shift.startTime}–{shift.endTime}
                        </span>
                      </div>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        value={levelFor(shift.id)}
                        onValueChange={(value) => {
                          if (!value) return;
                          setLevel(shift.id, value as ShiftPreferenceLevel);
                        }}
                      >
                        {LEVELS.map((level) => (
                          <ToggleGroupItem key={level.value} value={level.value}>
                            {t(level.label)}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
