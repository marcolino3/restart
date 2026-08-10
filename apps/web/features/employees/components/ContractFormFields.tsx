"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import {
  contractTypeRules,
  isContractFieldVisible,
  type ContractTypeDependentField,
} from "@restart/shared-schemas/employees/contract-type-rules";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFieldAccess } from "@/components/form/field-resource-context";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { WeeklyScheduleField } from "./wizard/WeeklyScheduleField";
import { WorkloadPercentField } from "./wizard/WorkloadPercentField";
import { WorkdayPickerField } from "./wizard/WorkdayPickerField";
import {
  QUICK_WORKLOAD_PERCENTS,
  hasWeekdayWorkloads,
  selectedDaysFromWindows,
  selectedDaysFromWorkloads,
  suggestScheduleWindows,
  workloadsFromSelectedDays,
  type WeekdayWorkloads,
} from "../lib/workday-schedule";
import { scheduleWeeklyMinutes } from "../lib/workload-from-schedule";

const CONTRACT_TYPE_OPTIONS = [
  { label: "contractPermanent", value: "PERMANENT" },
  { label: "contractTemporary", value: "TEMPORARY" },
  { label: "contractHourly", value: "HOURLY" },
  { label: "contractInternship", value: "INTERNSHIP" },
  { label: "contractApprenticeship", value: "APPRENTICESHIP" },
  { label: "contractSubstitute", value: "SUBSTITUTE" },
  { label: "contractExternal", value: "EXTERNAL" },
];

const THIRTEENTH_PAYOUT_OPTIONS = [
  { label: "thirteenthPayoutSeparate", value: "MONTHLY_X12" },
  { label: "thirteenthPayoutSpread", value: "MONTHLY_X13" },
];

/** Empty value written when a field is hidden for the new contract type. */
const HIDDEN_FIELD_CLEAR: Record<ContractTypeDependentField, unknown> = {
  endDate: null,
  probationEndDate: null,
  grossSalary: null,
  hourlyRate: null,
  paymentInterval: "",
  has13thSalary: false,
  annualVacationDays: null,
  workloadPercent: null,
  weeklyHours: "",
};

export interface ContractFormFieldsProps {
  /** Function catalog for the position select; free-text input when omitted. */
  functionOptions?: { label: string; value: string }[];
  teamOptions?: { label: string; value: string }[];
  showTeam?: boolean;
  showTimeTracking?: boolean;
  /** Notizen — Vertragsseite, nicht Onboarding. */
  showContractExtras?: boolean;
  documentSlot?: ReactNode;
}

/**
 * Shared contract capture UI used by the onboarding wizard and the employee
 * contracts tab. Expects react-hook-form fields that match the onboarding /
 * employee-contract schemas (incl. weekdayWorkloads / weekdayTimeWindows).
 */
export function ContractFormFields({
  functionOptions,
  teamOptions = [],
  showTeam = false,
  showTimeTracking = false,
  showContractExtras = false,
  documentSlot,
}: ContractFormFieldsProps) {
  const t = useTranslations("EmployeeOnboarding");
  const { setValue, control, trigger, clearErrors } = useFormContext();
  const selectedType = useWatch({ control, name: "contractType" }) as
    | string
    | undefined;

  const endDateAccess = useFieldAccess("endDate");
  const probationEndDateAccess = useFieldAccess("probationEndDate");
  const grossSalaryAccess = useFieldAccess("grossSalary");
  const hourlyRateAccess = useFieldAccess("hourlyRate");
  const paymentIntervalAccess = useFieldAccess("paymentInterval");
  const has13thSalaryAccess = useFieldAccess("has13thSalary");
  const annualVacationDaysAccess = useFieldAccess("annualVacationDays");
  const workloadPercentAccess = useFieldAccess("workloadPercent");
  const weeklyHoursAccess = useFieldAccess("weeklyHours");

  const FIELD_ACCESS: Record<ContractTypeDependentField, { visible: boolean }> = {
    endDate: endDateAccess,
    probationEndDate: probationEndDateAccess,
    grossSalary: grossSalaryAccess,
    hourlyRate: hourlyRateAccess,
    paymentInterval: paymentIntervalAccess,
    has13thSalary: has13thSalaryAccess,
    annualVacationDays: annualVacationDaysAccess,
    workloadPercent: workloadPercentAccess,
    weeklyHours: weeklyHoursAccess,
  };

  // Field renders only when both contract-type rules and permission grant show it.
  const shows = (field: ContractTypeDependentField) =>
    isContractFieldVisible(selectedType, field) && FIELD_ACCESS[field].visible;

  const startDate = useWatch({ control, name: "startDate" }) as
    | Date
    | null
    | undefined;
  const endDate = useWatch({ control, name: "endDate" }) as
    | Date
    | null
    | undefined;

  const workloadPercent =
    Number(useWatch({ control, name: "workloadPercent" })) || 0;
  const weeklyHours = useWatch({ control, name: "weeklyHours" });
  const weekdayWorkloads = (useWatch({ control, name: "weekdayWorkloads" }) ??
    {}) as WeekdayWorkloads;
  const weekdayTimeWindows = useWatch({
    control,
    name: "weekdayTimeWindows",
  });
  const has13thSalary = useWatch({ control, name: "has13thSalary" }) as
    | boolean
    | null
    | undefined;
  const paymentInterval = useWatch({ control, name: "paymentInterval" }) as
    | string
    | undefined;

  // Exact-times UI follows form data — no local toggle mirror (avoids sync effects).
  const hasExactTimes = scheduleWeeklyMinutes(weekdayTimeWindows) > 0;
  const hasWorkdays = hasWeekdayWorkloads(weekdayWorkloads);

  const previousType = useRef(selectedType);
  useEffect(() => {
    if (previousType.current === selectedType) return;
    previousType.current = selectedType;
    const rules = contractTypeRules(selectedType);
    for (const field of Object.keys(rules) as ContractTypeDependentField[]) {
      if (rules[field] === "hidden") {
        setValue(field, HIDDEN_FIELD_CLEAR[field], { shouldDirty: true });
      }
    }
    if (rules.workloadPercent === "hidden") {
      setValue("weekdayWorkloads", {}, { shouldDirty: true });
      setValue("weekdayTimeWindows", {}, { shouldDirty: true });
    }
  }, [selectedType, setValue]);

  // Same clearing as above, but keyed off permission grants instead of
  // contract type — a field hidden by either must not stay in the payload
  // as a stale value the form can no longer edit or validate against.
  useEffect(() => {
    for (const field of Object.keys(FIELD_ACCESS) as ContractTypeDependentField[]) {
      if (!FIELD_ACCESS[field].visible) {
        setValue(field, HIDDEN_FIELD_CLEAR[field], { shouldDirty: true });
      }
    }
    if (!workloadPercentAccess.visible) {
      setValue("weekdayWorkloads", {}, { shouldDirty: true });
      setValue("weekdayTimeWindows", {}, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    endDateAccess.visible,
    probationEndDateAccess.visible,
    grossSalaryAccess.visible,
    hourlyRateAccess.visible,
    paymentIntervalAccess.visible,
    has13thSalaryAccess.visible,
    annualVacationDaysAccess.visible,
    workloadPercentAccess.visible,
    weeklyHoursAccess.visible,
    setValue,
  ]);

  const previousHas13th = useRef(has13thSalary);
  useEffect(() => {
    if (previousHas13th.current === has13thSalary) return;
    previousHas13th.current = has13thSalary;
    if (has13thSalary) {
      if (!paymentInterval) {
        setValue("paymentInterval", "MONTHLY_X12", { shouldDirty: true });
      }
      return;
    }
    setValue("paymentInterval", "", { shouldDirty: true });
  }, [has13thSalary, paymentInterval, setValue]);

  // Live feedback when exit date is moved before entry date (or entry moves
  // past exit). Clear the error as soon as the pair is valid again.
  useEffect(() => {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      clearErrors("endDate");
      return;
    }
    void trigger("endDate");
  }, [startDate, endDate, trigger, clearErrors]);

  const resetScheduleForPensumChange = () => {
    setValue("weekdayTimeWindows", {}, { shouldDirty: true });
    setValue("weekdayWorkloads", {}, { shouldDirty: true });
  };

  const setQuickWorkload = (percent: number) => {
    setValue("workloadPercent", percent, { shouldDirty: true });
    resetScheduleForPensumChange();
  };

  const enableExactTimes = (enabled: boolean) => {
    if (enabled) {
      const selectedDays = selectedDaysFromWorkloads(weekdayWorkloads);
      if (selectedDays.length === 0) return;

      setValue(
        "weekdayTimeWindows",
        suggestScheduleWindows({
          selectedDays,
          workloadPercent: workloadPercent > 0 ? workloadPercent : 100,
          weeklyHoursRaw: weeklyHours,
        }),
        { shouldDirty: true },
      );
      setValue("weekdayWorkloads", {}, { shouldDirty: true });
      return;
    }

    const days =
      selectedDaysFromWindows(weekdayTimeWindows).length > 0
        ? selectedDaysFromWindows(weekdayTimeWindows)
        : selectedDaysFromWorkloads(weekdayWorkloads);
    setValue("weekdayTimeWindows", {}, { shouldDirty: true });
    setValue(
      "weekdayWorkloads",
      days.length > 0
        ? workloadsFromSelectedDays(
            days,
            workloadPercent > 0 ? workloadPercent : 100,
          )
        : {},
      { shouldDirty: true },
    );
  };

  const showsSalaryBlock =
    shows("grossSalary") ||
    shows("hourlyRate") ||
    shows("annualVacationDays");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("employment")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            {functionOptions ? (
              <SelectFormField
                name="position"
                label="function"
                namespace="EmployeeOnboarding"
                placeholder="selectPlaceholder"
                options={functionOptions}
                translateOptions={false}
              />
            ) : (
              <InputFormField
                name="position"
                label="function"
                namespace="EmployeeOnboarding"
              />
            )}
            {showTeam && (
              <SelectFormField
                name="teamId"
                label="team"
                namespace="EmployeeOnboarding"
                placeholder="selectTeam"
                options={teamOptions}
                translateOptions={false}
              />
            )}
            <DatePickerFormField
              name="startDate"
              label="entryDate"
              namespace="EmployeeOnboarding"
              disabledDate={(date) => date < new Date("1900-01-01")}
            />
            <SelectFormField
              name="contractType"
              label="contractType"
              namespace="EmployeeOnboarding"
              placeholder="selectPlaceholder"
              options={CONTRACT_TYPE_OPTIONS}
            />
            {shows("endDate") && (
              <DatePickerFormField
                name="endDate"
                label="exitDate"
                namespace="EmployeeOnboarding"
                disabledDate={(date) => {
                  if (startDate instanceof Date) {
                    const min = new Date(startDate);
                    min.setHours(0, 0, 0, 0);
                    return date < min;
                  }
                  return date < new Date("1900-01-01");
                }}
              />
            )}
            {shows("probationEndDate") && (
              <DatePickerFormField
                name="probationEndDate"
                label="probationEndDate"
                namespace="EmployeeOnboarding"
                disabledDate={(date) => date < new Date("1900-01-01")}
              />
            )}
          </div>

          {showsSalaryBlock && (
            <div className="grid items-start gap-4 sm:grid-cols-2">
              {shows("annualVacationDays") && (
                <InputFormField
                  name="annualVacationDays"
                  type="number"
                  label="annualVacationDays"
                  namespace="EmployeeOnboarding"
                />
              )}
              {shows("grossSalary") && (
                <InputFormField
                  name="grossSalary"
                  type="number"
                  label="grossSalaryMonthly"
                  namespace="EmployeeOnboarding"
                  placeholder="CHF"
                />
              )}
              {shows("hourlyRate") && (
                <InputFormField
                  name="hourlyRate"
                  type="number"
                  label="hourlyRate"
                  namespace="EmployeeOnboarding"
                  placeholder="CHF"
                />
              )}
            </div>
          )}

          {shows("has13thSalary") && (
            <div className="flex flex-col gap-3 rounded-md border border-border/70 p-3">
              <SwitchFormField
                name="has13thSalary"
                description="has13thSalary"
                namespace="EmployeeOnboarding"
              />
              <p className="text-xs text-muted-foreground">
                {t("has13thSalaryHint")}
              </p>
              {Boolean(has13thSalary) && (
                <SelectFormField
                  name="paymentInterval"
                  label="thirteenthPayout"
                  description="thirteenthPayoutHint"
                  namespace="EmployeeOnboarding"
                  placeholder="selectPlaceholder"
                  options={THIRTEENTH_PAYOUT_OPTIONS}
                />
              )}
            </div>
          )}

          {documentSlot ? (
            <div className="flex flex-col gap-2">
              <span className="text-[12.5px] font-semibold">
                {t("contractDocument")}
              </span>
              {documentSlot}
            </div>
          ) : null}

          {showContractExtras && (
            <TextareaFormField
              name="notes"
              label="contract.notes"
              namespace="Employees"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("workingHours")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {shows("workloadPercent") && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {QUICK_WORKLOAD_PERCENTS.map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => setQuickWorkload(percent)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium",
                      workloadPercent === percent
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
              <WorkloadPercentField
                onUserChange={resetScheduleForPensumChange}
              />
              {shows("weeklyHours") && (
                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <InputFormField
                    name="weeklyHours"
                    label="weeklyHours"
                    description="weeklyHoursHint"
                    namespace="EmployeeOnboarding"
                    placeholder="42"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t("simpleScheduleHint")}
              </p>
            </div>
          )}

          {shows("workloadPercent") && (
            <WorkdayPickerField disabled={hasExactTimes} />
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[12.5px] font-semibold">
                  {t("exactTimes")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasWorkdays
                    ? t("exactTimesHint")
                    : t("exactTimesNeedsWorkdays")}
                </p>
              </div>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={hasExactTimes ? "on" : "off"}
                onValueChange={(value) => {
                  if (!value) return;
                  enableExactTimes(value === "on");
                }}
              >
                <ToggleGroupItem value="off">
                  {t("exactTimesOff")}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="on"
                  disabled={!hasWorkdays && !hasExactTimes}
                >
                  {t("exactTimesOn")}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {hasExactTimes ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {t("scheduleHint")}
                </p>
                <WeeklyScheduleField />
              </>
            ) : shows("workloadPercent") ? (
              <p className="text-xs text-muted-foreground">
                {hasWorkdays
                  ? t("workdaysOnlySummary")
                  : t("simpleOnlySummary")}
              </p>
            ) : null}
          </div>

          {showTimeTracking && (
            <SwitchFormField
              name="timeTrackingEnabled"
              description="timeTrackingFromEntry"
              namespace="EmployeeOnboarding"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
