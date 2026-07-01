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
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { useSheet } from "@/components/providers/sheet-provider";
import {
  HolidayFormSchema,
  type HolidayFormInput,
  type HolidayFormOutput,
} from "../schemas/settings-form.schema";
import { createHolidayAction } from "../actions/settings.action";
import { toISODate } from "../lib/to-iso-date";

export const HolidayForm = () => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { close } = useSheet();

  const form = useForm<HolidayFormInput, unknown, HolidayFormOutput>({
    resolver: zodResolver(HolidayFormSchema),
    defaultValues: { date: new Date(), name: "", paidPercentage: 100, canton: "" },
  });

  const onSubmit = async (values: HolidayFormOutput) => {
    const { success } = await createHolidayAction({
      date: toISODate(values.date),
      name: values.name,
      paidPercentage: values.paidPercentage,
      canton: values.canton || null,
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
        <DatePickerFormField
          name="date"
          label="date"
          namespace="TimeTracking"
          disabledDate={() => false}
        />
        <InputFormField
          name="name"
          label="holidayName"
          namespace="TimeTracking"
        />
        <NumberFormField
          name="paidPercentage"
          label="paidPercentage"
          namespace="TimeTracking"
          min={0}
          max={100}
          nullable={false}
        />
        <InputFormField
          name="canton"
          label="canton"
          namespace="TimeTracking"
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {t("addHoliday")}
        </Button>
      </form>
    </Form>
  );
};
