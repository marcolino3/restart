"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { createEmployeeNoteAction } from "../actions/create-employee-note.action";

const CATEGORIES = [
  "GENERAL",
  "WARNING",
  "MEETING",
  "CONTRACT",
  "REQUEST",
  "PERFORMANCE",
  "OTHER",
] as const;

const NoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
});
type NoteValues = z.infer<typeof NoteSchema>;

interface CreateEmployeeNoteInlineProps {
  employeeId: string;
}

export default function CreateEmployeeNoteInline({
  employeeId,
}: CreateEmployeeNoteInlineProps) {
  const t = useTranslations("EmployeeNotes");
  const router = useRouter();

  const form = useForm<NoteValues>({
    resolver: zodResolver(NoteSchema),
    defaultValues: { title: "", content: "", category: "GENERAL" },
  });

  const categoryOptions = CATEGORIES.map((c) => ({
    label: `category.${c}`,
    value: c,
  }));

  const onSubmit = async (values: NoteValues) => {
    const result = await createEmployeeNoteAction({
      employeeId,
      category: values.category,
      title: values.title.trim(),
      content: values.content.trim(),
      date: new Date().toISOString().split("T")[0],
    });

    if (result.success) {
      toast.success(t("noteCreated"));
      form.reset({ title: "", content: "", category: "GENERAL" });
      router.refresh();
    } else {
      toast.error(t("noteCreateError"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <InputFormField
          name="title"
          label="noteTitle"
          namespace="EmployeeNotes"
          placeholder={t("titlePlaceholder")}
        />
        <TextareaFormField
          name="content"
          label="noteContent"
          namespace="EmployeeNotes"
          placeholder={t("contentPlaceholder")}
        />
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <SelectFormField
              name="category"
              label="categoryLabel"
              namespace="EmployeeNotes"
              options={categoryOptions}
            />
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {t("post")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
