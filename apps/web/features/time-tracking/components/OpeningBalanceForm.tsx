"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { useSheet } from "@/components/providers/sheet-provider";
import { formatDurationMinutes } from "@/lib/formatting/duration";
import {
  createOpeningBalanceFormSchema,
  type OpeningBalanceFormInput,
  type OpeningBalanceFormOutput,
} from "../schemas/admin-form.schema";
import {
  upsertEmployeePeriodOpeningBalanceAction,
  type OpeningBalanceEntry,
} from "../actions/opening-balances.action";
import type { TimeTrackingPeriodItem } from "../actions/periods.action";
import { parseSignedDurationToMinutes } from "../lib/duration-input";

interface Props {
  employeeId: string;
  periods: TimeTrackingPeriodItem[];
  balance?: OpeningBalanceEntry;
  onSaved: () => void;
}

export const OpeningBalanceForm = ({
  employeeId,
  periods,
  balance,
  onSaved,
}: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const { close } = useSheet();

  const schema = useMemo(() => createOpeningBalanceFormSchema(t), [t]);

  const form = useForm<
    OpeningBalanceFormInput,
    unknown,
    OpeningBalanceFormOutput
  >({
    resolver: zodResolver(schema),
    defaultValues: balance
      ? {
          periodId: balance.periodId,
          openingWorkTime: formatDurationMinutes(balance.openingWorkMinutes),
          openingVacationDays: balance.openingVacationDays,
        }
      : {
          periodId: periods[0]?.id ?? "",
          openingWorkTime: "0:00",
          openingVacationDays: 0,
        },
  });

  const onSubmit = async (values: OpeningBalanceFormOutput) => {
    const { success } = await upsertEmployeePeriodOpeningBalanceAction({
      employeeId,
      periodId: values.periodId,
      openingWorkMinutes: parseSignedDurationToMinutes(values.openingWorkTime),
      openingVacationDays: values.openingVacationDays,
    });
    if (success) {
      toast.success(tc("success"));
      close();
      onSaved();
    } else {
      toast.error(tc("error"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
        <SelectFormField
          name="periodId"
          label="period"
          namespace="TimeTracking"
          placeholder="selectPeriod"
          options={periods.map((p) => ({ label: p.label, value: p.id }))}
          translateOptions={false}
        />
        <InputFormField
          name="openingWorkTime"
          label="openingWorkTime"
          namespace="TimeTracking"
          placeholder="-12:30"
        />
        <NumberFormField
          name="openingVacationDays"
          label="openingVacationDays"
          namespace="TimeTracking"
          min={-365}
          max={365}
          step={0.5}
          nullable={false}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {balance ? t("editOpeningBalance") : t("addOpeningBalance")}
        </Button>
      </form>
    </Form>
  );
};
