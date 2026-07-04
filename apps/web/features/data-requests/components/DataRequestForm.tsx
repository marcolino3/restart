"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";

import {
  DataRequestFormSchema,
  DSAR_REQUEST_TYPES,
  DSAR_SUBJECT_TYPES,
  type DataRequestFormType,
} from "../schemas/data-request-form.schema";

const NS = "DataRequests";

type Props = {
  submitting?: boolean;
  onSubmit: (values: DataRequestFormType) => void | Promise<void>;
};

export function DataRequestForm({ submitting, onSubmit }: Props) {
  const t = useTranslations(NS);

  const form = useForm<DataRequestFormType>({
    resolver: zodResolver(DataRequestFormSchema),
    defaultValues: {
      subjectType: "OTHER",
      subjectName: "",
      contactEmail: "",
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
        <SelectFormField
          name="type"
          label="fieldType"
          namespace={NS}
          options={DSAR_REQUEST_TYPES.map((v) => ({
            value: v,
            label: `type.${v}`,
          }))}
        />
        <InputFormField
          name="subjectName"
          label="fieldSubjectName"
          namespace={NS}
        />
        <SelectFormField
          name="subjectType"
          label="fieldSubjectType"
          namespace={NS}
          options={DSAR_SUBJECT_TYPES.map((v) => ({
            value: v,
            label: `subject.${v}`,
          }))}
        />
        <InputFormField
          name="contactEmail"
          label="fieldContactEmail"
          namespace={NS}
        />
        <DatePickerFormField
          name="receivedAt"
          label="fieldReceivedAt"
          namespace={NS}
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
