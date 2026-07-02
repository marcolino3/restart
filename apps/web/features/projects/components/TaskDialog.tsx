"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";

import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { handleAction } from "@/lib/actions/handle-action";

import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
} from "../actions/manage-tasks.action";
import {
  TaskFormSchema,
  type TaskFormOutput,
} from "../schemas/task-form.schema";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskStatus,
} from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: Task | null;
  defaultStatus?: TaskStatus;
  memberOptions: { value: string; label: string }[];
  canEdit: boolean;
  onSaved?: () => void;
};

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  task,
  defaultStatus,
  memberOptions,
  canEdit,
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
      status: defaultStatus ?? "OPEN",
      priority: "MEDIUM",
      dueDate: null,
      assigneeMembershipIds: [],
    },
  });

  // Re-seed the form whenever the dialog opens for a different task / column.
  React.useEffect(() => {
    if (!open) return;
    form.reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? defaultStatus ?? "OPEN",
      priority: task?.priority ?? "MEDIUM",
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      assigneeMembershipIds:
        task?.assignees?.map((a) => a.membershipId) ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  const onSubmit = async (values: TaskFormOutput) => {
    const result = await handleAction({
      action: () =>
        isEdit && task
          ? updateTaskAction(task.id, projectId, values)
          : createTaskAction(projectId, values),
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
          <DialogTitle>{isEdit ? t("editTask") : t("newTask")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputFormField name="title" label="taskTitle" namespace="Projects" />
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
            <ComboboxFormField
              name="assigneeMembershipIds"
              label="assignees"
              namespace="Projects"
              multiple
              translateOptions={false}
              options={memberOptions}
            />

            <div className="mt-6 flex items-center justify-between gap-2">
              <div>
                {isEdit && task && canEdit && (
                  <DeleteConfirmationDialog
                    onConfirm={async () => {
                      const res = await deleteTaskAction(task.id, projectId);
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
                {canEdit && (
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {tc("save")}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
