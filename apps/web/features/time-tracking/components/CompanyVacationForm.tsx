"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { useSheet } from "@/components/providers/sheet-provider";
import {
  CompanyVacationFormSchema,
  type CompanyVacationFormInput,
  type CompanyVacationFormOutput,
} from "../schemas/settings-form.schema";
import { createCompanyVacationAction } from "../actions/settings.action";
import { toISODate } from "../lib/to-iso-date";

export const CompanyVacationForm = () => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { close } = useSheet();

  const form = useForm<
    CompanyVacationFormInput,
    unknown,
    CompanyVacationFormOutput
  >({
    resolver: zodResolver(CompanyVacationFormSchema),
    defaultValues: { name: "", startDate: new Date(), endDate: new Date() },
  });

  const onSubmit = async (values: CompanyVacationFormOutput) => {
    const { success } = await createCompanyVacationAction({
      name: values.name,
      startDate: toISODate(values.startDate),
      endDate: toISODate(values.endDate),
    });
    if (success) {
      toast.success(tc("success"));
      close();
      router.refresh();
    } else {
      toast.error(tc("error"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
        <InputFormField name="name" label="name" namespace="TimeTracking" />
        <DatePickerFormField
          name="startDate"
          label="startDate"
          namespace="TimeTracking"
          disabledDate={() => false}
        />
        <DatePickerFormField
          name="endDate"
          label="endDate"
          namespace="TimeTracking"
          disabledDate={() => false}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {t("addCompanyVacation")}
        </Button>
      </form>
    </Form>
  );
};
