"use client";
import {
  absenceNoticeDayCount,
  absenceNoticeErrorCode,
  checkAbsenceNoticeDates,
  ABSENCE_CALENDAR_TITLE_DEFAULT,
  EmployeeAbsenceNoticeFormSchema,
  EmployeeAbsenceNoticeFormType,
} from "../schemas/employee-absence-notice-form.schema";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { DateRangePickerFormField } from "@/components/form/form-fields/DateRangePickerFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { CreateButton } from "@/components/buttons/CreateButton";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
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
  const syncToCalendar = form.watch("syncToCalendar");
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  // Without a category the stricter rule applies, so nobody can slip a far
  // future date past the form before picking one.
  const requiresApproval = selectedCategory?.requiresApproval === true;
  const allowsDateRange = selectedCategory?.allowsDateRange === true;
  const rules = {
    requiresApproval,
    allowsDateRange,
    maxDaysPerRequest: selectedCategory?.maxDaysPerRequest ?? null,
  };

  // Single-day categories never carry an end date.
  useEffect(() => {
    if (!allowsDateRange) form.setValue("endDate", undefined);
  }, [allowsDateRange, form]);

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
        endDate: allowsDateRange ? values.endDate : undefined,
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
          {allowsDateRange ? (
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
          <TextareaFormField
            name="note"
            label="note"
            description="absenceNoteDescription"
          />
          <SwitchFormField name="isTeamInformed" label="isTeamInformed" />
          <SwitchFormField name="syncToCalendar" label="syncToCalendar" />
          {syncToCalendar && (
            <InputFormField
              name="calendarTitle"
              label="calendarTitle"
              description="calendarTitleDescription"
              placeholder={ABSENCE_CALENDAR_TITLE_DEFAULT}
            />
          )}
          <CreateButton isSubmitting={form.formState.isSubmitting} />
        </form>
      </Form>
    </div>
  );
};
