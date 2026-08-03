"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { WeekdayKey } from "@restart/shared-schemas/employees/employee-onboarding-form.schema";
import {
  selectedDaysFromWorkloads,
  workloadsFromSelectedDays,
  type WeekdayWorkloads,
} from "../../lib/workday-schedule";

const DAY_OPTIONS: { key: WeekdayKey; label: string }[] = [
  { key: "mon", label: "Mo" },
  { key: "tue", label: "Di" },
  { key: "wed", label: "Mi" },
  { key: "thu", label: "Do" },
  { key: "fri", label: "Fr" },
  { key: "sat", label: "Sa" },
  { key: "sun", label: "So" },
];

interface Props {
  name?: string;
  workloadName?: string;
  disabled?: boolean;
}

/**
 * Optional workday picker without clock times. Selected days are stored as
 * equal shares of the contract pensum in `weekdayWorkloads`.
 */
export function WorkdayPickerField({
  name = "weekdayWorkloads",
  workloadName = "workloadPercent",
  disabled = false,
}: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const { setValue, control } = useFormContext();
  const workloads = (useWatch({ control, name }) ?? {}) as WeekdayWorkloads;
  const workloadPercent = Number(useWatch({ control, name: workloadName })) || 0;
  const selected = selectedDaysFromWorkloads(workloads);

  const toggleDay = (key: WeekdayKey) => {
    if (disabled) return;
    const nextSelected = selected.includes(key)
      ? selected.filter((day) => day !== key)
      : [...selected, key];
    const next = workloadsFromSelectedDays(
      nextSelected,
      workloadPercent > 0 ? workloadPercent : 100,
    );
    setValue(name, next, { shouldDirty: true });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12.5px] font-semibold">{t("workdays")}</span>
        <span className="text-xs text-muted-foreground">
          {t("workdaysHint")}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {DAY_OPTIONS.map((day) => {
          const active = selected.includes(day.key);
          return (
            <button
              key={day.key}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => toggleDay(day.key)}
              className={cn(
                "min-w-10 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                disabled && "opacity-50",
              )}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
