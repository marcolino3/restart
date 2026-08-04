"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DateRangePickerFormField } from "@/components/form/form-fields/DateRangePickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { useSheet } from "@/components/providers/sheet-provider";
import {
  createCompanyVacationFormSchema,
  type CompanyVacationFormInput,
  type CompanyVacationFormOutput,
} from "../schemas/settings-form.schema";
import {
  createCompanyVacationAction,
  updateCompanyVacationAction,
  type CompanyVacation,
} from "../actions/settings.action";
import { toISODate } from "../lib/to-iso-date";

const parseDateOnly = (iso: string): Date => {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

interface Props {
  vacation?: CompanyVacation;
}

export const CompanyVacationForm = ({ vacation }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { close } = useSheet();

  const schema = useMemo(() => createCompanyVacationFormSchema(t), [t]);

  const form = useForm<
    CompanyVacationFormInput,
    unknown,
    CompanyVacationFormOutput
  >({
    resolver: zodResolver(schema),
    defaultValues: vacation
      ? {
          name: vacation.name,
          startDate: parseDateOnly(vacation.startDate),
          endDate: parseDateOnly(vacation.endDate),
        }
      : { name: "", startDate: new Date(), endDate: new Date() },
  });

  const onSubmit = async (values: CompanyVacationFormOutput) => {
    const payload = {
      name: values.name,
      startDate: toISODate(values.startDate),
      endDate: toISODate(values.endDate),
    };
    const { success } = vacation
      ? await updateCompanyVacationAction({ id: vacation.id, ...payload })
      : await createCompanyVacationAction(payload);
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
        <DateRangePickerFormField
          startName="startDate"
          endName="endDate"
          label="dateRange"
          namespace="TimeTracking"
          disabledDate={() => false}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {vacation ? t("editCompanyVacation") : t("addCompanyVacation")}
        </Button>
      </form>
    </Form>
  );
};
