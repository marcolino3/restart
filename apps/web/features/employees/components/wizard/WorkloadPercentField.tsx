"use client";

import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  deriveWorkloadPercent,
  matchesDerivedWorkload,
  parseFullTimeWeeklyHours,
} from "../../lib/workload-from-schedule";

interface Props {
  name?: string;
  scheduleName?: string;
  weeklyHoursName?: string;
  /** Fired when the user edits pensum via slider/input (not schedule sync). */
  onUserChange?: (percent: number | null) => void;
}

const SLIDER_STEP_PERCENT = 5;
const INPUT_STEP_PERCENT = 0.1;

/**
 * Workload in percent, kept in sync with the weekly schedule.
 *
 * As long as the value matches what the plan implies, the field follows the
 * plan automatically (the schedule is also what the backend engine uses as the
 * source of truth for planned minutes). Editing the slider or the input
 * detaches it, which is needed for contracts without a plan and for workloads
 * that deliberately differ from the drawn windows.
 */
export function WorkloadPercentField({
  name = "workloadPercent",
  scheduleName = "weekdayTimeWindows",
  weeklyHoursName = "weeklyHours",
  onUserChange,
}: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const { control, setValue } = useFormContext();

  const windows = useWatch({ control, name: scheduleName });
  const weeklyHoursRaw = useWatch({ control, name: weeklyHoursName });
  const current = useWatch({ control, name });

  const fullTimeWeeklyHours = parseFullTimeWeeklyHours(weeklyHoursRaw);
  const derived = deriveWorkloadPercent(windows, fullTimeWeeklyHours);

  // Only start in manual mode when a plan exists and contradicts the stored
  // value — otherwise the plan stays in charge.
  const [manual, setManual] = useState(
    () => derived != null && !matchesDerivedWorkload(current, derived),
  );
  const followsSchedule = !manual && derived != null;

  useEffect(() => {
    if (!followsSchedule || derived == null) return;
    if (Number(current) === derived) return;
    setValue(name, derived, { shouldDirty: true });
  }, [followsSchedule, derived, current, name, setValue]);

  const applyUserChange = (value: number | null) => {
    setManual(true);
    onUserChange?.(value);
  };

  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <FormLabel>{t("workloadPercent")}</FormLabel>
            {followsSchedule && (
              <Badge variant="secondary">{t("workloadFromSchedule")}</Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <FormControl>
              <Input
                type="number"
                min={0}
                max={100}
                step={INPUT_STEP_PERCENT}
                disabled={followsSchedule}
                value={field.value ?? ""}
                onChange={(e) => {
                  const next =
                    e.target.value === "" ? null : Number(e.target.value);
                  applyUserChange(next);
                  field.onChange(next);
                }}
                onBlur={field.onBlur}
                className="w-24"
              />
            </FormControl>
            <span className="text-sm text-muted-foreground">
              {t("percentSuffix")}
            </span>
            <Slider
              value={[Number(field.value) || 0]}
              onValueChange={(vals: number[]) => {
                applyUserChange(vals[0]);
                field.onChange(vals[0]);
              }}
              min={0}
              max={100}
              // The slider covers the usual 5 % grid; exact values such as
              // 53.2 % come from the schedule or the number input next to it.
              step={SLIDER_STEP_PERCENT}
              disabled={followsSchedule}
              className="flex-1"
            />
          </div>

          {followsSchedule ? (
            <button
              type="button"
              onClick={() => setManual(true)}
              className="self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              {t("workloadOverride")}
            </button>
          ) : (
            derived != null && (
              <button
                type="button"
                onClick={() => setManual(false)}
                className="self-start text-xs text-primary underline-offset-2 hover:underline"
              >
                {t("workloadUseSchedule", { percent: derived.toFixed(1) })}
              </button>
            )
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
