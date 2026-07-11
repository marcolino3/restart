"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { DateTimeCalendarFormField } from "@/components/form/form-fields/DateTimeCalendarFormField";

import { createStudentRecordEntryAction } from "../actions/record-entries-actions";
import { updateStudentRecordEntryAction } from "../actions/record-entries-actions";
import type { StudentRecordEntry } from "../actions/record-entries-actions";
import type { StudentRecordCategory } from "../actions/record-categories-actions";

const NO_CATEGORY = "__none__";

const Schema = z.object({
  categoryId: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  occurredAt: z.date(),
  isConfidential: z.boolean(),
});

type FormValues = z.infer<typeof Schema>;

interface Props {
  studentId: string;
  categories: StudentRecordCategory[];
  initial?: StudentRecordEntry | null;
  onSaved: () => void;
  onCancel?: () => void;
}

/**
 * Create/edit form for a single support-record entry. Create vs. edit is
 * driven by `initial`. Documents are attached separately, on an existing entry
 * (via the timeline's expand), since an entry id is required for upload.
 */
export function RecordComposer({
  studentId,
  categories,
  initial,
  onSaved,
  onCancel,
}: Props) {
  const t = useTranslations("StudentRecords");
  const isEdit = !!initial;

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      categoryId: initial?.categoryId ?? NO_CATEGORY,
      title: initial?.title ?? "",
      content: initial?.content ?? "",
      occurredAt: initial?.occurredAt
        ? new Date(initial.occurredAt)
        : new Date(),
      isConfidential: initial?.isConfidential ?? true,
    },
  });

  const categoryOptions = [
    { label: t("noCategory"), value: NO_CATEGORY },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const onSubmit = async (values: FormValues) => {
    const categoryId =
      values.categoryId === NO_CATEGORY ? null : values.categoryId;
    const payload = {
      categoryId,
      title: values.title?.trim() || null,
      content: values.content?.trim() || null,
      occurredAt: values.occurredAt.toISOString(),
      isConfidential: values.isConfidential,
    };

    const res =
      isEdit && initial
        ? await updateStudentRecordEntryAction({
            id: initial.id,
            studentId,
            ...payload,
          })
        : await createStudentRecordEntryAction({ studentId, ...payload });

    if (!res.success) {
      toast.error(isEdit ? t("entryUpdateError") : t("entryCreateError"));
      return;
    }
    toast.success(isEdit ? t("entryUpdateOk") : t("entryCreateOk"));
    if (!isEdit) form.reset({ ...form.getValues(), title: "", content: "" });
    onSaved();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-4">
          <SelectFormField
            name="categoryId"
            label="category"
            namespace="StudentRecords"
            options={categoryOptions}
            translateOptions={false}
            width="w-1/2"
          />
          <DateTimeCalendarFormField
            name="occurredAt"
            label="occurredAt"
            namespace="StudentRecords"
          />
        </div>

        <InputFormField
          name="title"
          label="entryTitle"
          namespace="StudentRecords"
        />
        <TextareaFormField
          name="content"
          label="entryContent"
          namespace="StudentRecords"
        />

        <SwitchFormField
          name="isConfidential"
          label="isConfidential"
          description="isConfidentialHint"
          namespace="StudentRecords"
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("cancel")}
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEdit ? t("save") : t("addEntry")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
