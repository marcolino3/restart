"use client";
import {
  checkAbsenceNoticeDates,
  EmployeeAbsenceNoticeFormSchema,
  EmployeeAbsenceNoticeFormType,
} from "../schemas/employee-absence-notice-form.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { CreateButton } from "@/components/buttons/CreateButton";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { createEmployeeAbsenceNoticeAction } from "../actions/create-employee-absence-notice.action";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useSheet } from "@/components/providers/sheet-provider";
import { pickAbsenceCategoryName } from "@/features/employee-absence-categories/types";

export interface NoticeAbsenceCategory {
  id: string;
  systemCode?: string | null;
  requiresApproval?: boolean | null;
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

  const onSubmit = async (values: EmployeeAbsenceNoticeFormType) => {
    const parsed = EmployeeAbsenceNoticeFormSchema.parse(values);
    const dateError = checkAbsenceNoticeDates(parsed, requiresApproval);
    if (dateError) {
      form.setError(dateError.field, {
        message: tE(`absence.dateError.${dateError.code}`),
      });
      return;
    }
    try {
      const { success } = await createEmployeeAbsenceNoticeAction(values);
      if (!success) {
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
            label="absenceCategories"
            options={absenceCategoryOptions}
          />
          {selectedCategory && (
            <p className="text-sm text-muted-foreground">
              {requiresApproval
                ? tE("absence.requiresApprovalHint")
                : tE("absence.noticeOnlyHint")}
            </p>
          )}
          <DatePickerFormField
            name="startDate"
            label="startDate"
            disabledDate={disabledDate}
          />
          {requiresApproval && (
            <DatePickerFormField
              name="endDate"
              label="endDate"
              disabledDate={disabledDate}
            />
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
