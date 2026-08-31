"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DescriptionList,
  DescriptionRow,
} from "@/components/common/DescriptionList";
import { EmployeeAvatar } from "@/features/employees/components/EmployeeAvatar";
import {
  pickAbsenceCategoryName,
  type AbsenceCategoryItem,
} from "@/features/employee-absence-categories/types";
import {
  formatAbsenceDateTime,
  parseAbsenceDateTime,
} from "@restart/shared-schemas/employee-absences/absence-date";
import { normalizeAbsenceDocuments } from "@restart/shared-schemas/employee-absences/absence-document";

interface Props {
  firstName?: string | null;
  lastName?: string | null;
  categories: AbsenceCategoryItem[];
}

export function AbsenceSummaryAside({
  firstName,
  lastName,
  categories,
}: Props) {
  const t = useTranslations("Employees");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const { control } = useFormContext();

  const absenceCategoryId = useWatch({
    control,
    name: "absenceCategoryId",
  }) as string | undefined;
  const includesTime = useWatch({ control, name: "includesTime" }) as boolean;
  const startDate = useWatch({ control, name: "startDate" });
  const endDate = useWatch({ control, name: "endDate" });
  const percentage = useWatch({ control, name: "percentage" }) as
    number | undefined;
  const isTeamInformed = useWatch({ control, name: "isTeamInformed" }) as
    boolean | undefined;
  const isVacationCapable = useWatch({
    control,
    name: "isVacationCapable",
  }) as boolean | undefined;
  const certificates = normalizeAbsenceDocuments(
    useWatch({ control, name: "certificates" }),
  );
  const additionalDocuments = normalizeAbsenceDocuments(
    useWatch({ control, name: "additionalDocuments" }),
  );

  const selectedCategory = categories.find((c) => c.id === absenceCategoryId);
  const categoryLabel = selectedCategory
    ? pickAbsenceCategoryName(selectedCategory, locale)
    : undefined;

  const fmtDateTime = (d?: Date | string | null) =>
    formatAbsenceDateTime(d, locale, { includeTime: includesTime });

  const parsedStartDate = parseAbsenceDateTime(startDate);
  const parsedEndDate = parseAbsenceDateTime(endDate);

  const daySpan = (() => {
    if (!parsedStartDate) return null;
    const end = parsedEndDate ?? parsedStartDate;
    const ms =
      new Date(end).setHours(0, 0, 0, 0) -
      new Date(parsedStartDate).setHours(0, 0, 0, 0);
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
  })();

  const certificateRequired =
    selectedCategory?.requiresCertificate &&
    (selectedCategory.certificateRequiredFromDay == null ||
      (daySpan ?? 0) >= selectedCategory.certificateRequiredFromDay);

  const hasCertificate = certificates.length > 0;
  const additionalCount = additionalDocuments.length;

  const dateRangeLabel = (() => {
    if (!parsedStartDate) return undefined;
    const start = fmtDateTime(parsedStartDate);
    const end = fmtDateTime(parsedEndDate ?? parsedStartDate);
    if (!start) return undefined;
    if (end && end !== start) return `${start} – ${end}`;
    return start;
  })();

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const pending = t("contract.summaryPending");
  const yes = t("contract.summaryYes");
  const no = t("contract.summaryNo");

  const certificateStatus = (() => {
    if (hasCertificate) return t("absence.summaryCertificateAttached");
    if (certificateRequired) return t("absence.summaryCertificateMissing");
    return pending;
  })();

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>{t("absence.formSummary")}</CardTitle>
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
              {categoryLabel ?? pending}
            </p>
          </div>
        </div>

        <DescriptionList>
          <DescriptionRow label={t("absence.category")} muted={!categoryLabel}>
            {categoryLabel ?? pending}
          </DescriptionRow>
          <DescriptionRow label={tCommon("startDate")} muted={!dateRangeLabel}>
            {dateRangeLabel ?? pending}
          </DescriptionRow>
          <DescriptionRow label={t("absence.summaryDuration")} muted={!daySpan}>
            {daySpan != null
              ? t("absence.summaryDays", { count: daySpan })
              : pending}
          </DescriptionRow>
          <DescriptionRow
            label={t("absence.percentage")}
            muted={percentage == null || percentage <= 0}
          >
            {percentage != null && percentage > 0 ? `${percentage}%` : pending}
          </DescriptionRow>
          <DescriptionRow
            label={tCommon("isTeamInformed")}
            muted={isTeamInformed == null}
          >
            {isTeamInformed ? yes : isTeamInformed === false ? no : pending}
          </DescriptionRow>
          <DescriptionRow label={t("absence.certificate")}>
            <span
              className={
                certificateRequired && !hasCertificate
                  ? "text-amber-700 dark:text-amber-400"
                  : undefined
              }
            >
              {certificateStatus}
            </span>
          </DescriptionRow>
          <DescriptionRow
            label={t("absence.additionalDocuments")}
            muted={additionalCount === 0}
          >
            {additionalCount > 0
              ? t("absence.summaryAdditionalDocumentsCount", {
                  count: additionalCount,
                })
              : pending}
          </DescriptionRow>
          <DescriptionRow
            label={t("absence.isVacationCapable")}
            muted={isVacationCapable == null}
          >
            {isVacationCapable
              ? t("absence.vacationCapableYes")
              : isVacationCapable === false
                ? t("absence.vacationCapableNo")
                : pending}
          </DescriptionRow>
        </DescriptionList>

        {selectedCategory && (
          <div className="flex flex-wrap gap-1.5">
            {selectedCategory.requiresCertificate && (
              <Badge variant="outline" className="text-xs">
                {t("absence.summaryBadgeCertificate")}
              </Badge>
            )}
            {selectedCategory.requiresApproval && (
              <Badge variant="outline" className="text-xs">
                {t("absence.summaryBadgeApproval")}
              </Badge>
            )}
          </div>
        )}

        {certificateRequired && !hasCertificate && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
              {t("absence.certificateRequiredHint", {
                day: selectedCategory?.certificateRequiredFromDay ?? 1,
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
