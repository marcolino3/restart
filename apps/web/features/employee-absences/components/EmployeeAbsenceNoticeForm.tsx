"use client";
import {
  AbsenceDayPart,
  AbsenceEntryPrecision,
  absenceNoticeDayCount,
  absenceNoticeErrorCode,
  checkAbsenceNoticeDates,
  EmployeeAbsenceNoticeFormSchema,
  EmployeeAbsenceNoticeFormType,
  type AbsenceDayPartType,
  type AbsenceEntryPrecisionType,
} from "../schemas/employee-absence-notice-form.schema";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { DateRangePickerFormField } from "@/components/form/form-fields/DateRangePickerFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SegmentedControl } from "@/components/form/form-fields/SegmentedControl";
import { CreateButton } from "@/components/buttons/CreateButton";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarCheck, ClipboardCheck } from "lucide-react";
import { createEmployeeAbsenceNoticeAction } from "../actions/create-employee-absence-notice.action";
import {
  getMyAbsenceCategoryQuotaAction,
  MyAbsenceCategoryQuota,
} from "../actions/get-my-absence-category-quota.action";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useSheet } from "@/components/providers/sheet-provider";
import { pickAbsenceCategoryName } from "@/features/employee-absence-categories/types";

export interface NoticeAbsenceCategory {
  id: string;
  systemCode?: string | null;
  requiresApproval?: boolean | null;
  allowsDateRange?: boolean | null;
  entryPrecision?: AbsenceEntryPrecisionType | null;
  maxDaysPerRequest?: number | null;
  maxDaysPerYear?: number | null;
  isActive?: boolean | null;
  translations?: { locale: string; name: string }[] | null;
}

interface Props {
  absenceCategories: NoticeAbsenceCategory[];
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const EmployeeAbsenceNoticeForm = ({ absenceCategories }: Props) => {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();
  const { close } = useSheet();

  const form = useForm<EmployeeAbsenceNoticeFormType>({
    resolver: zodResolver(EmployeeAbsenceNoticeFormSchema),
    defaultValues: EmployeeAbsenceNoticeFormSchema.parse({}),
  });

  const categories = absenceCategories.filter((c) => c.isActive !== false);

  const absenceCategoryOptions = categories.map((absenceCategory) => ({
    value: absenceCategory.id,
    label: pickAbsenceCategoryName(
      {
        translations: (absenceCategory.translations ?? []) as never,
        systemCode: absenceCategory.systemCode ?? null,
      },
      locale,
    ),
  }));

  const selectedCategoryId = form.watch("absenceCategoryId");
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  // Without a category the stricter rule applies, so nobody can slip a far
  // future date past the form before picking one.
  const requiresApproval = selectedCategory?.requiresApproval === true;
  const entryPrecision: AbsenceEntryPrecisionType =
    selectedCategory?.entryPrecision ?? AbsenceEntryPrecision.DAY;
  const isTimeRange = entryPrecision === AbsenceEntryPrecision.TIME;
  const allowsDateRange =
    selectedCategory?.allowsDateRange === true && !isTimeRange;
  const rules = {
    requiresApproval,
    allowsDateRange,
    entryPrecision,
    maxDaysPerRequest: selectedCategory?.maxDaysPerRequest ?? null,
  };

  // Multi-day categories default to a single day: a range picker for one
  // day is clumsy, so the employee opts into "several days" explicitly.
  const [multiDay, setMultiDay] = useState(false);
  const useRange = allowsDateRange && multiDay;
  const dayPart = form.watch("dayPart") ?? AbsenceDayPart.FULL;

  // Fields that the active precision / mode does not use are cleared so a
  // category switch never submits stale values.
  useEffect(() => {
    if (!allowsDateRange) setMultiDay(false);
    if (!useRange) form.setValue("endDate", undefined);
    if (entryPrecision !== AbsenceEntryPrecision.HALF_DAY || useRange) {
      form.setValue("dayPart", AbsenceDayPart.FULL);
    }
    if (!isTimeRange) {
      form.setValue("startTime", undefined);
      form.setValue("endTime", undefined);
    }
  }, [allowsDateRange, useRange, entryPrecision, isTimeRange, form]);

  const [quota, setQuota] = useState<MyAbsenceCategoryQuota | null>(null);
  useEffect(() => {
    let cancelled = false;
    setQuota(null);
    if (!selectedCategory || selectedCategory.maxDaysPerYear == null) return;
    getMyAbsenceCategoryQuotaAction(selectedCategory.id).then((res) => {
      if (!cancelled && res.success) setQuota(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const startDate = form.watch("startDate");
  const disabledDate = (date: Date) => {
    const today = startOfToday();
    if (date < today) return true;
    if (!requiresApproval) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return date > tomorrow;
    }
    return false;
  };
  // Once a start is picked, days beyond the per-request maximum are blocked.
  const disabledRangeDate = (date: Date) => {
    if (disabledDate(date)) return true;
    const max = rules.maxDaysPerRequest;
    if (max == null || !startDate || date < startDate) return false;
    return absenceNoticeDayCount(startDate, date) > max;
  };

  const onSubmit = async (values: EmployeeAbsenceNoticeFormType) => {
    const parsed = EmployeeAbsenceNoticeFormSchema.parse(values);
    const dateError = checkAbsenceNoticeDates(parsed, rules);
    if (dateError) {
      form.setError(dateError.field, {
        message: tE(`absence.dateError.${dateError.code}`),
      });
      return;
    }
    try {
      const result = await createEmployeeAbsenceNoticeAction({
        ...values,
        endDate: useRange ? values.endDate : undefined,
        dayPart:
          entryPrecision === AbsenceEntryPrecision.HALF_DAY && !useRange
            ? values.dayPart
            : AbsenceDayPart.FULL,
        startTime: isTimeRange ? values.startTime : undefined,
        endTime: isTimeRange ? values.endTime : undefined,
      });
      if (!result.success) {
        const mapped = absenceNoticeErrorCode(result.message);
        if (mapped) {
          form.setError(mapped.field, {
            message: tE(`absence.dateError.${mapped.code}`),
          });
          return;
        }
        throw new Error("createAbsenceNoticeFailed");
      }
      toast.success(
        requiresApproval ? tE("absence.requestSubmitted") : t("success"),
      );
      close();
      router.refresh();
    } catch (error) {
      console.log(error);
      toast.error(t("error"));
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
          <SelectFormField
            name="absenceCategoryId"
            label="absenceCategory"
            options={absenceCategoryOptions}
          />
          {selectedCategory && (
            <Alert variant={requiresApproval ? "warning" : "info"}>
              {requiresApproval ? <ClipboardCheck /> : <CalendarCheck />}
              <AlertTitle>
                {requiresApproval
                  ? tE("absence.requiresApprovalTitle")
                  : tE("absence.noticeOnlyTitle")}
              </AlertTitle>
              <AlertDescription>
                {requiresApproval
                  ? tE("absence.requiresApprovalHint")
                  : tE("absence.noticeOnlyHint")}
              </AlertDescription>
            </Alert>
          )}
          {quota && quota.maxDaysPerYear != null && (
            <p
              className={
                quota.remainingDays === 0
                  ? "text-sm text-destructive"
                  : "text-sm text-muted-foreground"
              }
            >
              {quota.remainingDays === 0
                ? tE("absence.quotaExhausted", {
                    max: quota.maxDaysPerYear,
                    periodEnd: new Date(quota.periodEnd).toLocaleDateString(
                      locale,
                    ),
                  })
                : tE("absence.quotaHint", {
                    remaining: quota.remainingDays ?? 0,
                    max: quota.maxDaysPerYear,
                    periodEnd: new Date(quota.periodEnd).toLocaleDateString(
                      locale,
                    ),
                  })}
            </p>
          )}
          {allowsDateRange && (
            <SegmentedControl
              value={multiDay ? "multi" : "single"}
              onChange={(v) => setMultiDay(v === "multi")}
              label={t("dateRange")}
              options={[
                { value: "single", label: tE("absence.singleDay") },
                { value: "multi", label: tE("absence.multiDay") },
              ]}
            />
          )}
          {useRange ? (
            <DateRangePickerFormField
              startName="startDate"
              endName="endDate"
              label="dateRange"
              disabledDate={disabledRangeDate}
            />
          ) : (
            <DatePickerFormField
              name="startDate"
              label="startDate"
              disabledDate={disabledDate}
            />
          )}
          {entryPrecision === AbsenceEntryPrecision.HALF_DAY && !useRange && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">
                {tE("absence.dayPartLabel")}
              </p>
              <SegmentedControl<AbsenceDayPartType>
                value={dayPart}
                onChange={(v) =>
                  form.setValue("dayPart", v, { shouldDirty: true })
                }
                label={tE("absence.dayPartLabel")}
                options={(
                  [
                    AbsenceDayPart.FULL,
                    AbsenceDayPart.MORNING,
                    AbsenceDayPart.AFTERNOON,
                  ] as const
                ).map((value) => ({
                  value,
                  label: tE(`absence.dayPart.${value}`),
                }))}
              />
            </div>
          )}
          {isTimeRange && (
            <div className="grid grid-cols-2 gap-3">
              <InputFormField name="startTime" label="startTime" type="time" />
              <InputFormField name="endTime" label="endTime" type="time" />
            </div>
          )}
          <TextareaFormField
            name="note"
            label="note"
            description="absenceNoteDescription"
          />
          <SwitchFormField name="isTeamInformed" label="isTeamInformed" />
          <CreateButton isSubmitting={form.formState.isSubmitting} />
        </form>
      </Form>
    </div>
  );
};
