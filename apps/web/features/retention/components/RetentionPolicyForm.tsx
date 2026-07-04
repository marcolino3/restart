"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";

import {
  RetentionPolicyFormSchema,
  RETENTION_ACTIONS,
  type RetentionPolicyFormType,
} from "../schemas/retention-policy-form.schema";
import type { RetentionPolicy } from "../types";

const NS = "RetentionSettings";

type Props = {
  initial?: RetentionPolicy | null;
  submitting?: boolean;
  onSubmit: (values: RetentionPolicyFormType) => void | Promise<void>;
};

export function RetentionPolicyForm({ initial, submitting, onSubmit }: Props) {
  const t = useTranslations(NS);

  const form = useForm<RetentionPolicyFormType>({
    resolver: zodResolver(RetentionPolicyFormSchema),
    defaultValues: {
      retentionMonths: initial?.retentionMonths ?? 36,
      action: initial?.action ?? "ANONYMIZE",
      description: initial?.description ?? "",
      isEnabled: initial?.isEnabled ?? true,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <NumberFormField
          name="retentionMonths"
          label="fieldRetentionMonths"
          namespace={NS}
          min={1}
          max={1200}
        />
        <SelectFormField
          name="action"
          label="fieldAction"
          namespace={NS}
          options={RETENTION_ACTIONS.map((v) => ({
            value: v,
            label: `action.${v}`,
          }))}
        />
        <TextareaFormField
          name="description"
          label="fieldDescription"
          namespace={NS}
        />
        <SwitchFormField
          name="isEnabled"
          label="fieldIsEnabled"
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
