"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";

import {
  SubprocessorFormSchema,
  type SubprocessorFormType,
} from "../schemas/vvt-form.schema";
import type { Subprocessor } from "../types";

const NS = "Vvt";

type Props = {
  initial?: Subprocessor | null;
  submitting?: boolean;
  onSubmit: (values: SubprocessorFormType) => void | Promise<void>;
};

export function SubprocessorForm({ initial, submitting, onSubmit }: Props) {
  const t = useTranslations(NS);
  const form = useForm<SubprocessorFormType>({
    resolver: zodResolver(SubprocessorFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      purpose: initial?.purpose ?? "",
      country: initial?.country ?? "",
      dpaSigned: initial?.dpaSigned ?? false,
      url: initial?.url ?? "",
      notes: initial?.notes ?? "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <InputFormField name="name" label="spName" namespace={NS} />
        <InputFormField name="purpose" label="spPurpose" namespace={NS} />
        <InputFormField name="country" label="spCountry" namespace={NS} />
        <InputFormField name="url" label="spUrl" namespace={NS} />
        <SwitchFormField
          name="dpaSigned"
          label="spDpaSigned"
          description="spDpaSignedHint"
          namespace={NS}
        />
        <TextareaFormField name="notes" label="spNotes" namespace={NS} />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={submitting}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
