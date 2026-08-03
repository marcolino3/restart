"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { isContractFieldVisible } from "@restart/shared-schemas/employees/contract-type-rules";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeAvatar } from "../EmployeeAvatar";
import {
  DescriptionList,
  DescriptionRow,
} from "@/components/common/DescriptionList";
import type { RadioCardOption } from "@/components/form/form-fields/RadioCardFormField";
import type { EmployeeFunctionItem } from "@/features/employee-functions/types";
import { resolveEmployeeFunctionPosition } from "@/features/employee-functions/types";
import {
  formatExactTimesPlanLines,
  formatWorkdaysPlanLabel,
  hasWeekdayWorkloads,
  type WeekdayWorkloads,
} from "../../lib/workday-schedule";
import { scheduleWeeklyMinutes } from "../../lib/workload-from-schedule";

interface Props {
  roleOptions: RadioCardOption[];
  teamOptions: { label: string; value: string }[];
  employeeFunctions: EmployeeFunctionItem[];
}

export function OnboardingSummaryAside({
  roleOptions,
  teamOptions,
  employeeFunctions,
}: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const { control, watch } = useFormContext();

  const firstName = watch("firstName") as string;
  const lastName = watch("lastName") as string;
  const email = watch("email") as string | undefined;
  const dateOfBirth = watch("dateOfBirth") as Date | null | undefined;
  const position = watch("position") as string | undefined;
  const workloadPercent = watch("workloadPercent") as number | undefined;
  const contractType = watch("contractType") as string | undefined;
  const hourlyRate = watch("hourlyRate") as number | undefined;
  const has13thSalary = watch("has13thSalary") as boolean | null | undefined;
  const paymentInterval = watch("paymentInterval") as string | undefined;
  const startDate = watch("startDate") as Date | null | undefined;
  const teamId = watch("teamId") as string | undefined;
  const roleId = watch("roleId") as string | undefined;
  const invitationTiming = watch("invitationTiming") as string | undefined;

  const weekdayWorkloads = (useWatch({
    control,
    name: "weekdayWorkloads",
  }) ?? {}) as WeekdayWorkloads;
  const weekdayTimeWindows = useWatch({
    control,
    name: "weekdayTimeWindows",
  });

  const roleLabel = roleOptions.find((r) => r.value === roleId)?.label;
  const teamLabel = teamOptions.find((tm) => tm.value === teamId)?.label;
  const positionLabel = position
    ? resolveEmployeeFunctionPosition(position, employeeFunctions, locale)
    : undefined;
  const fmtDate = (d?: Date | null) =>
    d ? new Intl.DateTimeFormat("de-CH").format(d) : undefined;

  const invitationLabel = invitationTiming
    ? t(
        invitationTiming === "IMMEDIATE"
          ? "inviteImmediate"
          : invitationTiming === "ON_ENTRY_DATE"
            ? "inviteOnEntry"
            : "inviteManual",
      )
    : undefined;

  const paymentIntervalLabel =
    paymentInterval === "MONTHLY_X12" || paymentInterval === "MONTHLY_X13"
      ? tE(`paymentInterval.${paymentInterval}`)
      : undefined;

  const hasExactTimes = scheduleWeeklyMinutes(weekdayTimeWindows) > 0;
  const exactTimeLines = hasExactTimes
    ? formatExactTimesPlanLines(weekdayTimeWindows)
    : [];
  const workdaysLabel =
    !hasExactTimes && hasWeekdayWorkloads(weekdayWorkloads)
      ? formatWorkdaysPlanLabel(weekdayWorkloads)
      : undefined;

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>{t("summary")}</CardTitle>
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
              {fullName || t("newEmployee")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {email || "—"}
            </p>
          </div>
        </div>
        <DescriptionList>
          <DescriptionRow label={t("dateOfBirth")} muted={!dateOfBirth}>
            {fmtDate(dateOfBirth) ?? t("step1")}
          </DescriptionRow>
          <DescriptionRow label={t("function")} muted={!positionLabel}>
            {positionLabel ?? t("step2")}
          </DescriptionRow>
          {/* Hourly staff have no workload share — show their rate instead. */}
          {isContractFieldVisible(contractType, "workloadPercent") ? (
            <DescriptionRow
              label={t("workloadPercent")}
              muted={!workloadPercent}
            >
              {workloadPercent ? `${workloadPercent}%` : t("step2")}
            </DescriptionRow>
          ) : (
            <DescriptionRow label={t("hourlyRate")} muted={!hourlyRate}>
              {hourlyRate ? `CHF ${hourlyRate}` : t("step2")}
            </DescriptionRow>
          )}
          <DescriptionRow label={t("team")} muted={!teamLabel}>
            {teamLabel ?? t("step2")}
          </DescriptionRow>
          <DescriptionRow label={t("entryDate")} muted={!startDate}>
            {fmtDate(startDate) ?? t("step2")}
          </DescriptionRow>
          {isContractFieldVisible(contractType, "has13thSalary") &&
            Boolean(has13thSalary) && (
              <DescriptionRow
                label={t("thirteenthPayout")}
                muted={!paymentIntervalLabel}
              >
                {paymentIntervalLabel ?? t("step2")}
              </DescriptionRow>
            )}
          <DescriptionRow label={t("role")} muted={!roleLabel}>
            {roleLabel ?? t("step3")}
          </DescriptionRow>
          <DescriptionRow label={t("invitation")} muted={!invitationLabel}>
            {invitationLabel ?? t("step3")}
          </DescriptionRow>
        </DescriptionList>

        {isContractFieldVisible(contractType, "workloadPercent") &&
          (exactTimeLines.length > 0 || workdaysLabel) && (
            <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
              <p className="text-[12.5px] font-semibold">
                {exactTimeLines.length > 0
                  ? t("summaryWorkingHours")
                  : t("workdays")}
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
