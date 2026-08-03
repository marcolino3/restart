"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { isContractFieldVisible } from "@restart/shared-schemas/employees/contract-type-rules";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DescriptionList,
  DescriptionRow,
} from "@/components/common/DescriptionList";
import { EmployeeAvatar } from "./EmployeeAvatar";
import {
  formatExactTimesPlanLines,
  formatWorkdaysPlanLabel,
  hasWeekdayWorkloads,
  type WeekdayWorkloads,
} from "../lib/workday-schedule";
import { scheduleWeeklyMinutes } from "../lib/workload-from-schedule";

interface Props {
  firstName?: string | null;
  lastName?: string | null;
  functionOptions?: { label: string; value: string }[];
}

export function ContractSummaryAside({
  firstName,
  lastName,
  functionOptions,
}: Props) {
  const t = useTranslations("Employees");
  const tO = useTranslations("EmployeeOnboarding");
  const locale = useLocale();
  const { control } = useFormContext();

  const contractType = useWatch({ control, name: "contractType" }) as
    | string
    | undefined;
  const position = useWatch({ control, name: "position" }) as
    | string
    | undefined;
  const workloadPercent = useWatch({ control, name: "workloadPercent" }) as
    | number
    | null
    | undefined;
  const weeklyHours = useWatch({ control, name: "weeklyHours" }) as
    | string
    | undefined;
  const hourlyRate = useWatch({ control, name: "hourlyRate" }) as
    | number
    | null
    | undefined;
  const grossSalary = useWatch({ control, name: "grossSalary" }) as
    | number
    | null
    | undefined;
  const startDate = useWatch({ control, name: "startDate" }) as
    | Date
    | null
    | undefined;
  const endDate = useWatch({ control, name: "endDate" }) as
    | Date
    | null
    | undefined;
  const annualVacationDays = useWatch({
    control,
    name: "annualVacationDays",
  }) as number | null | undefined;
  const has13thSalary = useWatch({ control, name: "has13thSalary" }) as
    | boolean
    | null
    | undefined;
  const paymentInterval = useWatch({ control, name: "paymentInterval" }) as
    | string
    | undefined;
  const weekdayWorkloads = (useWatch({
    control,
    name: "weekdayWorkloads",
  }) ?? {}) as WeekdayWorkloads;
  const weekdayTimeWindows = useWatch({
    control,
    name: "weekdayTimeWindows",
  });

  const positionLabel = position
    ? (functionOptions?.find((o) => o.value === position)?.label ?? position)
    : undefined;

  const fmtDate = (d?: Date | null) =>
    d
      ? new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB").format(d)
      : undefined;

  const fmtMoney = (n?: number | null) =>
    n != null && Number.isFinite(n)
      ? new Intl.NumberFormat(locale === "de" ? "de-CH" : "en-GB", {
          style: "currency",
          currency: "CHF",
          maximumFractionDigits: 2,
        }).format(n)
      : undefined;

  const contractTypeLabel =
    contractType && contractType !== ""
      ? t(`contractType.${contractType}`)
      : undefined;

  const paymentIntervalLabel =
    paymentInterval === "MONTHLY_X12" || paymentInterval === "MONTHLY_X13"
      ? t(`paymentInterval.${paymentInterval}`)
      : undefined;

  const hasExactTimes = scheduleWeeklyMinutes(weekdayTimeWindows) > 0;
  const hasWorkdays = hasWeekdayWorkloads(weekdayWorkloads);
  const exactTimeLines = hasExactTimes
    ? formatExactTimesPlanLines(weekdayTimeWindows)
    : [];
  const workdaysLabel =
    !hasExactTimes && hasWorkdays
      ? formatWorkdaysPlanLabel(weekdayWorkloads)
      : undefined;

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>{t("contract.summary")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <EmployeeAvatar
            firstName={firstName}
            lastName={lastName}
            className="h-11 w-11 text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {fullName || t("employees")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {contractTypeLabel ?? t("contract.summaryPending")}
            </p>
          </div>
        </div>

        <DescriptionList>
          <DescriptionRow
            label={t("hr.contractType")}
            muted={!contractTypeLabel}
          >
            {contractTypeLabel ?? t("contract.summaryPending")}
          </DescriptionRow>
          <DescriptionRow label={t("hr.position")} muted={!positionLabel}>
            {positionLabel ?? t("contract.summaryPending")}
          </DescriptionRow>
          {isContractFieldVisible(contractType, "workloadPercent") ? (
            <DescriptionRow
              label={tO("workloadPercent")}
              muted={workloadPercent == null || workloadPercent <= 0}
            >
              {workloadPercent != null && workloadPercent > 0
                ? `${workloadPercent}%`
                : t("contract.summaryPending")}
            </DescriptionRow>
          ) : (
            <DescriptionRow
              label={t("hr.hourlyRate")}
              muted={hourlyRate == null}
            >
              {fmtMoney(hourlyRate) ?? t("contract.summaryPending")}
            </DescriptionRow>
          )}
          {isContractFieldVisible(contractType, "weeklyHours") && (
            <DescriptionRow
              label={t("hr.weeklyHours")}
              muted={!weeklyHours?.trim()}
            >
              {weeklyHours?.trim() || t("contract.summaryPending")}
            </DescriptionRow>
          )}
          {isContractFieldVisible(contractType, "grossSalary") && (
            <DescriptionRow
              label={t("hr.grossSalaryMonthly")}
              muted={grossSalary == null}
            >
              {fmtMoney(grossSalary) ?? t("contract.summaryPending")}
            </DescriptionRow>
          )}
          <DescriptionRow label={t("hr.entryDate")} muted={!startDate}>
            {fmtDate(startDate) ?? t("contract.summaryPending")}
          </DescriptionRow>
          {isContractFieldVisible(contractType, "endDate") && (
            <DescriptionRow label={t("hr.exitDate")} muted={!endDate}>
              {fmtDate(endDate) ?? t("contract.summaryPending")}
            </DescriptionRow>
          )}
          {isContractFieldVisible(contractType, "annualVacationDays") && (
            <DescriptionRow
              label={t("hr.annualVacationDays")}
              muted={annualVacationDays == null}
            >
              {annualVacationDays != null
                ? String(annualVacationDays)
                : t("contract.summaryPending")}
            </DescriptionRow>
          )}
          {isContractFieldVisible(contractType, "has13thSalary") && (
            <DescriptionRow
              label={t("hr.has13thSalary")}
              muted={has13thSalary == null}
            >
              {has13thSalary
                ? t("contract.summaryYes")
                : has13thSalary === false
                  ? t("contract.summaryNo")
                  : t("contract.summaryPending")}
            </DescriptionRow>
          )}
          {isContractFieldVisible(contractType, "has13thSalary") &&
            Boolean(has13thSalary) && (
              <DescriptionRow
                label={t("hr.paymentInterval")}
                muted={!paymentIntervalLabel}
              >
                {paymentIntervalLabel ?? t("contract.summaryPending")}
              </DescriptionRow>
            )}
        </DescriptionList>

        {isContractFieldVisible(contractType, "workloadPercent") &&
          (exactTimeLines.length > 0 || workdaysLabel) && (
            <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
              <p className="text-[12.5px] font-semibold">
                {exactTimeLines.length > 0
                  ? t("contract.summaryWorkingHours")
                  : tO("workdays")}
              </p>
              {exactTimeLines.length > 0 ? (
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {exactTimeLines.map((line) => (
                    <li key={line} className="font-medium text-foreground">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs font-medium text-foreground">
                  {workdaysLabel}
                </p>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
