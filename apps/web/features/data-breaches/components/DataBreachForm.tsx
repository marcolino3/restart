"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";

import {
  DataBreachFormSchema,
  BREACH_RISK_LEVELS,
  type DataBreachFormType,
} from "../schemas/data-breach-form.schema";

const NS = "DataBreaches";

type Props = {
  submitting?: boolean;
  onSubmit: (values: DataBreachFormType) => void | Promise<void>;
};

export function DataBreachForm({ submitting, onSubmit }: Props) {
  const t = useTranslations(NS);

  const form = useForm<DataBreachFormType>({
    resolver: zodResolver(DataBreachFormSchema),
    defaultValues: {
      title: "",
      description: "",
      riskLevel: "MEDIUM",
      affectedScope: "",
      notes: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <InputFormField name="title" label="fieldTitle" namespace={NS} />
        <TextareaFormField
          name="description"
          label="fieldDescription"
          namespace={NS}
        />
        <SelectFormField
          name="riskLevel"
          label="fieldRiskLevel"
          namespace={NS}
          options={BREACH_RISK_LEVELS.map((v) => ({
            value: v,
            label: `risk.${v}`,
          }))}
        />
        <DatePickerFormField
          name="detectedAt"
          label="fieldDetectedAt"
          namespace={NS}
        />
        <InputFormField
          name="affectedScope"
          label="fieldAffectedScope"
          namespace={NS}
        />
        <NumberFormField
          name="affectedCount"
          label="fieldAffectedCount"
          namespace={NS}
          min={0}
        />
        <TextareaFormField name="notes" label="fieldNotes" namespace={NS} />

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={submitting}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
