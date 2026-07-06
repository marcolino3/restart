"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { handleAction } from "@/lib/actions/handle-action";

import { addTaskNoteAction } from "../actions/add-task-note.action";
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
import { DueDateQuickChips, TaskChecklistField } from "./PersonalTaskDialog";

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

  const [noteText, setNoteText] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);

  // Clear the note draft whenever the dialog opens for a different task.
  const seed = open ? (task?.id ?? "new") : null;
  const [seededFor, setSeededFor] = React.useState<string | null>(null);
  if (seededFor !== seed) {
    setSeededFor(seed);
    if (seed !== null) setNoteText("");
  }

  const form = useForm<TaskFormOutput>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: defaultStatus ?? "OPEN",
      priority: "MEDIUM",
      dueDate: null,
      dueTime: "",
      checklist: [],
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
      dueTime: task?.dueTime ?? "",
      checklist:
        task?.checklist?.map(({ id, label, done }) => ({ id, label, done })) ??
        [],
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

  const submitNote = async () => {
    const text = noteText.trim();
    if (!text || !task) return;
    setSavingNote(true);
    const result = await handleAction({
      action: () => addTaskNoteAction(task.id, text, projectId),
      successMessage: t("noteAdded"),
      errorMessage: t("noteAddError"),
    });
    setSavingNote(false);
    if (result.success) {
      setNoteText("");
      router.refresh();
    }
  };

  const notes = task?.notes ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTask") : t("newTask")}</DialogTitle>
        </DialogHeader>

        {task?.project && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="flex w-fit items-center gap-1"
              style={
                task.project.color
                  ? { borderColor: task.project.color }
                  : undefined
              }
            >
              {task.project.color && (
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: task.project.color }}
                />
              )}
              {task.project.title}
            </Badge>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-6 md:grid-cols-[1fr_260px]">
              <div className="space-y-4">
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
                <TaskChecklistField />

                {isEdit && (
                  <div className="space-y-2">
                    <Label>{t("notes")}</Label>
                    {notes.length > 0 && (
                      <div className="space-y-1">
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            className="rounded-md border px-3 py-2"
                          >
                            <p className="text-sm font-medium">{note.text}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(note.createdAt),
                                "dd. MMM yyyy, HH:mm",
                                { locale: de },
                              )}
                              {note.authorName ? ` · ${note.authorName}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <Textarea
                      value={noteText}
                      placeholder={t("notePlaceholder")}
                      className="min-h-14"
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={savingNote || !noteText.trim()}
                        onClick={submitNote}
                      >
                        {t("saveNote")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <SelectFormField
                  name="status"
                  label="taskStatus"
                  namespace="Projects"
                  options={TASK_STATUSES.map((s) => ({
                    value: s,
                    label: `taskStatus_${s}`,
                  }))}
                />
                <SelectFormField
                  name="priority"
                  label="priority"
                  namespace="Projects"
                  options={TASK_PRIORITIES.map((p) => ({
                    value: p,
                    label: `priority_${p}`,
                  }))}
                />
                <div className="space-y-2">
                  <DatePickerFormField
                    name="dueDate"
                    label="dueDate"
                    namespace="Projects"
                    disabledDate={(date) => date < new Date("1900-01-01")}
                  />
                  <InputFormField
                    name="dueTime"
                    label="dueTime"
                    namespace="Projects"
                    type="time"
                  />
                  <DueDateQuickChips />
                </div>
                <ComboboxFormField
                  name="assigneeMembershipIds"
                  label="assignees"
                  namespace="Projects"
                  multiple
                  translateOptions={false}
                  options={memberOptions}
                />
              </div>
            </div>

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
