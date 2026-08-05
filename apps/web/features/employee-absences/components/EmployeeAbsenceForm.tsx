"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";
import {
  pickAbsenceCategoryName,
  type AbsenceCategoryItem,
} from "@/features/employee-absence-categories/types";

import type { EmployeeAbsence } from "../actions/employee-absences.actions";
import { saveEmployeeAbsenceAction } from "../actions/employee-absences.actions";
import {
  EmployeeAbsenceFormSchema,
  type EmployeeAbsenceFormOutput,
  type EmployeeAbsenceFormType,
} from "../schemas/employee-absence-form.schema";
import {
  absenceIncludesTime,
  parseAbsenceDateTime,
  startOfLocalDay,
} from "@restart/shared-schemas/employee-absences/absence-date";
import { normalizeAbsenceDocuments } from "@restart/shared-schemas/employee-absences/absence-document";
import { AbsenceDocumentsField } from "./AbsenceDocumentsField";
import { AbsencePeriodDateFields } from "./AbsencePeriodDateFields";
import { AbsenceSummaryAside } from "./AbsenceSummaryAside";

const defaultStartDate = () => startOfLocalDay(new Date());

export function buildAbsenceFormDefaults(
  employeeId: string,
  absence: EmployeeAbsence | null,
): EmployeeAbsenceFormType {
  const start = parseAbsenceDateTime(absence?.startDate);
  const end = parseAbsenceDateTime(absence?.endDate);
  return {
    id: absence?.id,
    employeeId,
    startDate: start ?? defaultStartDate(),
    endDate: end,
    includesTime: absence ? absenceIncludesTime(start, end) : false,
    absenceCategoryId: absence?.absenceCategoryId ?? "",
    note: absence?.note ?? "",
    isTeamInformed: absence?.isTeamInformed ?? true,
    isVacationCapable: absence?.isVacationCapable ?? true,
    percentage: absence?.percentage ?? 100,
    certificates: normalizeAbsenceDocuments(absence?.certificates),
    additionalDocuments: normalizeAbsenceDocuments(absence?.additionalDocuments),
  };
}

interface Props {
  employeeId: string;
  absence?: EmployeeAbsence | null;
  categories: AbsenceCategoryItem[];
  firstName?: string | null;
  lastName?: string | null;
  title: string;
  /** Override redirect after save/cancel (defaults to employee absences tab). */
  returnHref?: string;
}

export function EmployeeAbsenceForm({
  employeeId,
  absence = null,
  categories,
  firstName,
  lastName,
  title,
  returnHref,
}: Props) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();

  const backHref =
    returnHref ??
    `${ROUTES.admin.employeesView(locale, employeeId)}?tab=absences`;

  const form = useForm({
    resolver: zodResolver(EmployeeAbsenceFormSchema),
    defaultValues: buildAbsenceFormDefaults(employeeId, absence),
  });
  const { clearErrors, trigger } = form;

  const categoryId = useWatch({
    control: form.control,
    name: "absenceCategoryId",
  });
  const startDate = useWatch({ control: form.control, name: "startDate" });
  const endDate = useWatch({ control: form.control, name: "endDate" });

  useEffect(() => {
    const start = parseAbsenceDateTime(startDate);
    const end = parseAbsenceDateTime(endDate);
    if (!start || !end) {
      clearErrors("endDate");
      return;
    }
    void trigger("endDate");
  }, [startDate, endDate, trigger, clearErrors]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Apply category defaults when the category changes on create (not edit).
  useEffect(() => {
    if (absence || !selectedCategory) return;
    form.setValue(
      "isVacationCapable",
      selectedCategory.defaultIsVacationCapable,
    );
    form.setValue("percentage", selectedCategory.defaultPercentage);
  }, [absence, selectedCategory, form]);

  const daySpan = (() => {
    const start = parseAbsenceDateTime(startDate);
    if (!start) return 1;
    const end = parseAbsenceDateTime(endDate) ?? start;
    const ms =
      startOfLocalDay(end).getTime() - startOfLocalDay(start).getTime();
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
  })();

  const certificateHint =
    selectedCategory?.requiresCertificate &&
    (selectedCategory.certificateRequiredFromDay == null ||
      daySpan >= selectedCategory.certificateRequiredFromDay);

  const categoryOptions = categories
    .filter((c) => c.isActive || c.id === absence?.absenceCategoryId)
    .map((c) => ({
      value: c.id,
      label: pickAbsenceCategoryName(c, locale),
    }));

  const goBack = () => {
    router.push(backHref);
  };

  const onValid = async (values: EmployeeAbsenceFormOutput) => {
    await handleAction({
      action: () => saveEmployeeAbsenceAction(values),
      successMessage: absence ? tE("absence.updated") : tE("absence.created"),
      errorMessage: tE("absence.saveError"),
      onSuccess: goBack,
    });
  };

  const submitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          (values) => onValid(values as EmployeeAbsenceFormOutput),
          (errors) => {
            console.warn("Absence validation errors:", errors);
            const first = Object.values(errors)[0];
            const detail =
              first && typeof first === "object" && "message" in first
                ? String(first.message)
                : undefined;
            toast.error(tE("validationError"), { description: detail });
          },
        )}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={submitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {t("save")}
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="flex flex-col gap-4">
            <Card>
            <CardHeader>
              <CardTitle>{tE("absence.periodTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <SelectFormField
                name="absenceCategoryId"
                label="absence.category"
                options={categoryOptions}
                translateOptions={false}
                namespace="Employees"
              />
              <AbsencePeriodDateFields />
              <NumberFormField
                name="percentage"
                label="absence.percentage"
                min={1}
                max={100}
                nullable={false}
                namespace="Employees"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tE("absence.detailsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <SwitchFormField
                name="isTeamInformed"
                label="isTeamInformed"
              />
              <TextareaFormField
                name="note"
                label="note"
                description="absenceNoteDescription"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tE("absence.certificateTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <AbsenceDocumentsField
                  name="certificates"
                  employeeId={employeeId}
                  label="absence.certificate"
                  uploadLabel="absence.docUpload"
                />
                <AbsenceDocumentsField
                  name="additionalDocuments"
                  employeeId={employeeId}
                  label="absence.additionalDocuments"
                  description="absence.additionalDocumentsHint"
                  uploadLabel="absence.additionalDocUpload"
                />
              </div>
              <SwitchFormField
                name="isVacationCapable"
                label="absence.isVacationCapable"
                description="absence.isVacationCapableHint"
                namespace="Employees"
              />
              {certificateHint && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {tE("absence.certificateRequiredHint", {
                    day: selectedCategory?.certificateRequiredFromDay ?? 1,
                  })}
                </p>
              )}
            </CardContent>
            </Card>
          </div>

          <AbsenceSummaryAside
            firstName={firstName}
            lastName={lastName}
            categories={categories}
          />
        </div>
      </form>
    </Form>
  );
}
