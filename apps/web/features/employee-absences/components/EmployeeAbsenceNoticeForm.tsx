"use client";
import {
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
import { GetEmployeeAbsenceCategoriesByOrgIdQuery } from "@restart/shared-types/graphql";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { createEmployeeAbsenceNoticeAction } from "../actions/create-employee-absence-notice.action";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSheet } from "@/components/providers/sheet-provider";

interface Props {
  absenceCategories: GetEmployeeAbsenceCategoriesByOrgIdQuery["employeeAbsenceCategoriesByOrgId"];
}
export const EmployeeAbsenceNoticeForm = ({ absenceCategories }: Props) => {
  const t = useTranslations("Common");
  const { close } = useSheet();

  const form = useForm<EmployeeAbsenceNoticeFormType>({
    resolver: zodResolver(EmployeeAbsenceNoticeFormSchema),
    defaultValues: EmployeeAbsenceNoticeFormSchema.parse({}),
  });

  const absenceCategoryOptions = absenceCategories.map((absenceCategory) => ({
    value: absenceCategory.id,
    label: absenceCategory.systemCode ?? "",
  }));

  const onSubmit = async (values: EmployeeAbsenceNoticeFormType) => {
    try {
      const { success } = await createEmployeeAbsenceNoticeAction(values);
      if (!success) {
        throw new Error("Fehler beim Erstellen");
      }
      toast.success(t("success"));
      close();
    } catch (error) {
      console.log(error);
      toast.error(t("error"));
    }
  };
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
          <DatePickerFormField
            name="startDate"
            label="date"
            disabledDate={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Normalisieren
              return date < today; // blockiert alle Tage vor heute
            }}
          />
          <SelectFormField
            name="absenceCategoryId"
            label="absenceCategories"
            options={absenceCategoryOptions}
          />
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
