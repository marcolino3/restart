"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";

import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { handleAction } from "@/lib/actions/handle-action";

import {
  createTemplateAction,
  updateTemplateAction,
} from "../actions/manage-templates.action";
import {
  TemplateFormSchema,
  type TemplateFormOutput,
} from "../schemas/template-form.schema";
import { TASK_PRIORITIES, type ProjectTemplate } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ProjectTemplate | null;
  onSaved?: () => void;
};

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSaved,
}: Props) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const router = useRouter();
  const isEdit = !!template;

  const form = useForm<TemplateFormOutput>({
    resolver: zodResolver(TemplateFormSchema),
    defaultValues: { title: "", description: "", tasks: [] },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      title: template?.title ?? "",
      description: template?.description ?? "",
      tasks: (template?.tasks ?? []).map((task) => ({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        dueOffsetDays: task.dueOffsetDays ?? null,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template?.id]);

  const onSubmit = async (values: TemplateFormOutput) => {
    const result = await handleAction({
      action: () =>
        isEdit && template
          ? updateTemplateAction(template.id, values)
          : createTemplateAction(values),
      successMessage: isEdit ? t("templateUpdated") : t("templateCreated"),
      errorMessage: isEdit ? t("templateUpdateError") : t("templateCreateError"),
    });
    if (result.success) {
      onOpenChange(false);
      onSaved?.();
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editTemplate") : t("newTemplate")}
          </DialogTitle>
          <DialogDescription>{t("templateFormSubtitle")}</DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputFormField name="title" label="title" namespace="Projects" />
            <TextareaFormField
              name="description"
              label="description"
              namespace="Projects"
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t("templateTasks")}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      title: "",
                      description: "",
                      priority: "MEDIUM",
                      dueOffsetDays: null,
                    })
                  }
                >
                  <IconPlus className="mr-1 h-4 w-4" />
                  {t("addTemplateTask")}
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("noTemplateTasks")}
                </p>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-end gap-2 rounded-md border p-3"
                >
                  <InputFormField
                    name={`tasks.${index}.title`}
                    label="taskTitle"
                    namespace="Projects"
                    width="flex-1"
                  />
                  <SelectFormField
                    name={`tasks.${index}.priority`}
                    label="priority"
                    namespace="Projects"
                    width="w-36"
                    options={TASK_PRIORITIES.map((p) => ({
                      value: p,
                      label: `priority_${p}`,
                    }))}
                  />
                  <NumberFormField
                    name={`tasks.${index}.dueOffsetDays`}
                    label="dueOffsetDays"
                    namespace="Projects"
                    width="w-32"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-1 text-destructive"
                    onClick={() => remove(index)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {tc("save")}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
