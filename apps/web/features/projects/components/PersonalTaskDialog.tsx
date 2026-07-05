"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, addWeeks } from "date-fns";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";

import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleAction } from "@/lib/actions/handle-action";
import { cn } from "@/lib/utils";

import {
  createTaskAction,
  deleteTaskAction,
} from "../actions/manage-tasks.action";
import {
  createPersonalTaskAction,
  updatePersonalTaskAction,
} from "../actions/personal-tasks.action";
import {
  TaskFormSchema,
  type TaskFormOutput,
  type TaskFormValues,
} from "../schemas/task-form.schema";
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from "../types";

export type ProjectOption = { id: string; title: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSaved?: () => void;
  /** Projects the user can link a new task to (create mode only). */
  projects?: ProjectOption[];
};

const NO_PROJECT = "none";

export function PersonalTaskDialog({
  open,
  onOpenChange,
  task,
  onSaved,
  projects,
}: Props) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const router = useRouter();
  const isEdit = !!task;

  const [linkedProjectId, setLinkedProjectId] = React.useState(NO_PROJECT);

  // Reset the (non-RHF) project link whenever the dialog opens for a new task.
  const seed = open ? (task?.id ?? "new") : null;
  const [seededFor, setSeededFor] = React.useState<string | null>(null);
  if (seededFor !== seed) {
    setSeededFor(seed);
    if (seed !== null) setLinkedProjectId(NO_PROJECT);
  }

  const form = useForm<TaskFormOutput>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "OPEN",
      priority: "MEDIUM",
      dueDate: null,
      dueTime: "",
      checklist: [],
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
      dueTime: task?.dueTime ?? "",
      checklist:
        task?.checklist?.map(({ id, label, done }) => ({ id, label, done })) ??
        [],
      assigneeMembershipIds: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  const onSubmit = async (values: TaskFormOutput) => {
    const result = await handleAction({
      action: () => {
        if (isEdit && task) return updatePersonalTaskAction(task.id, values);
        // Optionally attach the new task to a project the user is a member of.
        if (linkedProjectId !== NO_PROJECT) {
          return createTaskAction(linkedProjectId, values);
        }
        return createPersonalTaskAction(values);
      },
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editTask") : t("newPersonalTask")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("personalTaskSubtitle") : t("personalTaskHint")}
          </DialogDescription>
        </DialogHeader>

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
                {!isEdit && (projects?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <Label>{t("linkProject")}</Label>
                    <Select
                      value={linkedProjectId}
                      onValueChange={setLinkedProjectId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PROJECT}>
                          {t("noProject")}
                        </SelectItem>
                        {projects?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

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

/**
 * Checklist editor bound to the RHF `checklist` array field.
 * Shows a "done / total" progress counter once items exist.
 */
export function TaskChecklistField() {
  const t = useTranslations("Projects");
  const { control, watch } = useFormContext<TaskFormValues>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "checklist",
  });
  const [newLabel, setNewLabel] = React.useState("");

  const items = watch("checklist") ?? [];
  const doneCount = items.filter((item) => item?.done).length;

  const addItem = () => {
    const label = newLabel.trim();
    if (!label) return;
    append({ label, done: false });
    setNewLabel("");
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {t("checklist")}
        <span className="font-mono text-xs font-normal text-muted-foreground">
          {fields.length > 0
            ? `${doneCount} / ${fields.length}`
            : t("checklistOptional")}
        </span>
      </Label>
      {fields.length > 0 && (
        <div className="space-y-1">
          {fields.map((field, index) => {
            const done = items[index]?.done ?? false;
            return (
              <div
                key={field.id}
                className="group flex items-center gap-2 rounded-md border px-2 py-1.5"
              >
                <Checkbox
                  checked={done}
                  onCheckedChange={(checked) =>
                    update(index, {
                      ...items[index],
                      label: items[index]?.label ?? "",
                      done: checked === true,
                    })
                  }
                />
                <span
                  className={cn(
                    "flex-1 text-sm",
                    done && "text-muted-foreground line-through",
                  )}
                >
                  {items[index]?.label ?? ""}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  aria-label={t("removeChecklistItem")}
                  onClick={() => remove(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={newLabel}
          placeholder={t("checklistItemPlaceholder")}
          className="h-9"
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0"
          onClick={addItem}
        >
          {t("addChecklistItem")}
        </Button>
      </div>
    </div>
  );
}

/** Quick chips that set `dueDate` / clear `dueTime` on the surrounding RHF form. */
export function DueDateQuickChips() {
  const t = useTranslations("Projects");
  const { setValue } = useFormContext<TaskFormValues>();

  const setDue = (date: Date | null) => {
    setValue("dueDate", date, { shouldDirty: true });
    if (!date) setValue("dueTime", "", { shouldDirty: true });
  };

  const chips: { key: string; onClick: () => void }[] = [
    { key: "quickToday", onClick: () => setDue(new Date()) },
    { key: "quickTomorrow", onClick: () => setDue(addDays(new Date(), 1)) },
    { key: "quickIn3Days", onClick: () => setDue(addDays(new Date(), 3)) },
    { key: "quickNextWeek", onClick: () => setDue(addWeeks(new Date(), 1)) },
    { key: "quickNoDue", onClick: () => setDue(null) },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <Button
          key={chip.key}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 rounded-full px-3 text-xs"
          onClick={chip.onClick}
        >
          {t(chip.key)}
        </Button>
      ))}
    </div>
  );
}
