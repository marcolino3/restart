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
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { useSheet } from "@/components/providers/sheet-provider";
import {
  HolidayFormSchema,
  type HolidayFormInput,
  type HolidayFormOutput,
} from "../schemas/settings-form.schema";
import {
  createHolidayAction,
  updateHolidayAction,
  type Holiday,
} from "../actions/settings.action";
import { toISODate } from "../lib/to-iso-date";

const parseDateOnly = (iso: string): Date => {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

/** Same calendar day in the following year (for copy-to-next-year). */
const nextYearDate = (iso: string): Date => {
  const date = parseDateOnly(iso);
  date.setFullYear(date.getFullYear() + 1);
  return date;
};

interface Props {
  /** Edit existing holiday. */
  holiday?: Holiday;
  /** Prefill create form from an existing one-off holiday (date +1 year). */
  copyFrom?: Holiday;
}

export const HolidayForm = ({ holiday, copyFrom }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { close } = useSheet();

  const form = useForm<HolidayFormInput, unknown, HolidayFormOutput>({
    resolver: zodResolver(HolidayFormSchema),
    defaultValues: holiday
      ? {
          date: parseDateOnly(holiday.date),
          name: holiday.name,
          paidPercentage: holiday.paidPercentage,
          repeatsYearly: holiday.repeatsYearly,
        }
      : copyFrom
        ? {
            date: nextYearDate(copyFrom.date),
            name: copyFrom.name,
            paidPercentage: copyFrom.paidPercentage,
            repeatsYearly: false,
          }
        : {
            date: new Date(),
            name: "",
            paidPercentage: 100,
            repeatsYearly: false,
          },
  });

  const onSubmit = async (values: HolidayFormOutput) => {
    const payload = {
      date: toISODate(values.date),
      name: values.name,
      paidPercentage: values.paidPercentage,
      repeatsYearly: values.repeatsYearly,
    };
    const { success } = holiday
      ? await updateHolidayAction({ id: holiday.id, ...payload })
      : await createHolidayAction(payload);
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
        <SwitchFormField
          name="repeatsYearly"
          label="repeatsYearly"
          description="repeatsYearlyHelp"
          namespace="TimeTracking"
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {holiday ? t("editHoliday") : t("addHoliday")}
        </Button>
      </form>
    </Form>
  );
};
