"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";

import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { handleAction } from "@/lib/actions/handle-action";

import { deleteTaskAction } from "../actions/manage-tasks.action";
import {
  createPersonalTaskAction,
  updatePersonalTaskAction,
} from "../actions/personal-tasks.action";
import {
  TaskFormSchema,
  type TaskFormOutput,
} from "../schemas/task-form.schema";
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSaved?: () => void;
};

export function PersonalTaskDialog({
  open,
  onOpenChange,
  task,
  onSaved,
}: Props) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const router = useRouter();
  const isEdit = !!task;

  const form = useForm<TaskFormOutput>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "OPEN",
      priority: "MEDIUM",
      dueDate: null,
      assigneeMembershipIds: [],
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "OPEN",
      priority: task?.priority ?? "MEDIUM",
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      assigneeMembershipIds: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  const onSubmit = async (values: TaskFormOutput) => {
    const result = await handleAction({
      action: () =>
        isEdit && task
          ? updatePersonalTaskAction(task.id, values)
          : createPersonalTaskAction(values),
      successMessage: isEdit ? t("taskUpdated") : t("taskCreated"),
      errorMessage: isEdit ? t("taskUpdateError") : t("taskCreateError"),
    });
    if (result.success) {
      onOpenChange(false);
      onSaved?.();
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editTask") : t("newPersonalTask")}
          </DialogTitle>
          <DialogDescription>{t("personalTaskSubtitle")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputFormField
              name="title"
              label="taskTitle"
              namespace="Projects"
            />
            <TextareaFormField
              name="description"
              label="description"
              namespace="Projects"
            />
            <div className="flex gap-4">
              <SelectFormField
                name="status"
                label="taskStatus"
                namespace="Projects"
                width="w-1/2"
                options={TASK_STATUSES.map((s) => ({
                  value: s,
                  label: `taskStatus_${s}`,
                }))}
              />
              <SelectFormField
                name="priority"
                label="priority"
                namespace="Projects"
                width="w-1/2"
                options={TASK_PRIORITIES.map((p) => ({
                  value: p,
                  label: `priority_${p}`,
                }))}
              />
            </div>
            <DatePickerFormField
              name="dueDate"
              label="dueDate"
              namespace="Projects"
              disabledDate={(date) => date < new Date("1900-01-01")}
            />

            <div className="mt-6 flex items-center justify-between gap-2">
              <div>
                {isEdit && task && (
                  <DeleteConfirmationDialog
                    onConfirm={async () => {
                      const res = await deleteTaskAction(task.id);
                      if (res.success) {
                        onOpenChange(false);
                        onSaved?.();
                        router.refresh();
                        return { success: true };
                      }
                      return { success: false, error: String(res.error) };
                    }}
                    trigger={
                      <Button type="button" variant="destructive" size="sm">
                        {tc("delete")}
                      </Button>
                    }
                  />
                )}
              </div>
              <div className="flex gap-2">
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
