"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { CheckboxGroupFormField } from "@/components/form/form-fields/CheckboxGroupFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";

import {
  ConsentPurposeFormSchema,
  CONSENT_LEGAL_BASES,
  CONSENT_SUBJECT_TYPES,
  type ConsentPurposeFormType,
} from "../schemas/consent-purpose-form.schema";
import type { ConsentPurpose } from "../types";

const NS = "ConsentManagement";

type Props = {
  initial?: ConsentPurpose | null;
  submitting?: boolean;
  onSubmit: (values: ConsentPurposeFormType) => void | Promise<void>;
};

export function ConsentPurposeForm({ initial, submitting, onSubmit }: Props) {
  const t = useTranslations(NS);

  const form = useForm<ConsentPurposeFormType>({
    resolver: zodResolver(ConsentPurposeFormSchema),
    defaultValues: {
      id: initial?.id,
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      appliesTo: initial?.appliesTo ?? [],
      legalBasis: initial?.legalBasis ?? "CONSENT",
      requiresEvidence: initial?.requiresEvidence ?? false,
      isMandatory: initial?.isMandatory ?? false,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <InputFormField name="name" label="fieldName" namespace={NS} />
        <InputFormField name="slug" label="fieldSlug" namespace={NS} />
        <TextareaFormField
          name="description"
          label="fieldDescription"
          namespace={NS}
        />
        <CheckboxGroupFormField
          name="appliesTo"
          label="fieldAppliesTo"
          namespace={NS}
          options={CONSENT_SUBJECT_TYPES.map((v) => ({
            value: v,
            label: `subject.${v}`,
          }))}
        />
        <SelectFormField
          name="legalBasis"
          label="fieldLegalBasis"
          namespace={NS}
          options={CONSENT_LEGAL_BASES.map((v) => ({
            value: v,
            label: `legalBasis.${v}`,
          }))}
        />
        <SwitchFormField
          name="requiresEvidence"
          label="fieldRequiresEvidence"
          description="fieldRequiresEvidenceHint"
          namespace={NS}
        />
        <SwitchFormField
          name="isMandatory"
          label="fieldIsMandatory"
          description="fieldIsMandatoryHint"
          namespace={NS}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={submitting}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
