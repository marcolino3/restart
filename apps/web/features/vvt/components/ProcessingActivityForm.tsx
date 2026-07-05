"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";

import {
  ProcessingActivityFormSchema,
  VVT_LEGAL_BASES,
  type ProcessingActivityFormType,
} from "../schemas/vvt-form.schema";
import type { ProcessingActivity } from "../types";

const NS = "Vvt";

type Props = {
  initial?: ProcessingActivity | null;
  submitting?: boolean;
  onSubmit: (values: ProcessingActivityFormType) => void | Promise<void>;
};

export function ProcessingActivityForm({ initial, submitting, onSubmit }: Props) {
  const t = useTranslations(NS);
  const form = useForm<ProcessingActivityFormType>({
    resolver: zodResolver(ProcessingActivityFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      purpose: initial?.purpose ?? "",
      legalBasis: initial?.legalBasis ?? "CONSENT",
      dataCategories: initial?.dataCategories ?? "",
      dataSubjects: initial?.dataSubjects ?? "",
      recipients: initial?.recipients ?? "",
      retentionNote: initial?.retentionNote ?? "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <InputFormField name="name" label="paName" namespace={NS} />
        <TextareaFormField name="purpose" label="paPurpose" namespace={NS} />
        <SelectFormField
          name="legalBasis"
          label="paLegalBasis"
          namespace={NS}
          options={VVT_LEGAL_BASES.map((v) => ({
            value: v,
            label: `legalBasis.${v}`,
          }))}
        />
        <InputFormField
          name="dataCategories"
          label="paDataCategories"
          namespace={NS}
        />
        <InputFormField
          name="dataSubjects"
          label="paDataSubjects"
          namespace={NS}
        />
        <InputFormField name="recipients" label="paRecipients" namespace={NS} />
        <InputFormField
          name="retentionNote"
          label="paRetention"
          namespace={NS}
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={submitting}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
