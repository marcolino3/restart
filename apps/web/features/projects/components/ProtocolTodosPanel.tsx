"use client";

import { IconChecklist, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DatePicker, toIsoDate } from "@/components/form/DatePicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleAction } from "@/lib/actions/handle-action";

import { createTasksFromProtocolAction } from "../actions/create-tasks-from-protocol.action";
import { membershipName } from "../lib/membership-name";
import { TaskDialog } from "./TaskDialog";
import { TASK_PRIORITIES, type Task, type TaskPriority } from "../types";

type Row = {
  title: string;
  priority: TaskPriority;
  dueDate: Date | null;
  assigneeId: string;
};

const UNASSIGNED = "__none__";

const emptyRow = (): Row => ({
  title: "",
  priority: "MEDIUM",
  dueDate: null,
  assigneeId: UNASSIGNED,
});

type Props = {
  protocolId: string;
  memberOptions: { value: string; label: string }[];
  existingTasks: Task[];
  canWrite: boolean;
};

export function ProtocolTodosPanel({
  protocolId,
  memberOptions,
  existingTasks,
  canWrite,
}: Props) {
  const t = useTranslations("Protocols");
  const tp = useTranslations("Projects");
  const router = useRouter();
  const [rows, setRows] = React.useState<Row[]>([emptyRow()]);
  const [submitting, setSubmitting] = React.useState(false);
  const [editTask, setEditTask] = React.useState<Task | null>(null);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const onSubmit = async () => {
    const drafts = rows
      .filter((r) => r.title.trim())
      .map((r) => ({
        title: r.title.trim(),
        priority: r.priority,
        dueDate: toIsoDate(r.dueDate),
        assigneeMembershipIds:
          r.assigneeId === UNASSIGNED ? [] : [r.assigneeId],
      }));
    if (drafts.length === 0) return;

    setSubmitting(true);
    const result = await handleAction({
      action: () => createTasksFromProtocolAction(protocolId, drafts),
      successMessage: t("tasksCreated", { count: drafts.length }),
      errorMessage: t("tasksCreateError"),
    });
    setSubmitting(false);
    if (result.success) {
      setRows([emptyRow()]);
      router.refresh();
    }
  };

  return (
    <Card className="border-primary/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconChecklist className="h-4 w-4" />
          {t("todos")}
        </CardTitle>
        {canWrite && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
          >
            <IconPlus className="mr-1 h-4 w-4" />
            {t("addRow")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {existingTasks.length > 0 && (
          <div className="space-y-1 rounded-md border bg-muted/30 p-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("existingTasks")}
            </p>
            {existingTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => setEditTask(task)}
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded px-1 py-1 text-left text-sm hover:bg-background"
              >
                <span className="font-medium">{task.title}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {(task.assignees ?? [])
                    .map((a) => membershipName(a.membership))
                    .join(", ") || t("unassigned")}
                  <span className="rounded bg-background px-1.5 py-0.5">
                    {tp(`taskStatus_${task.status}`)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{t("todosHint")}</p>
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Input
              className="min-w-48 flex-1"
              placeholder={t("todoTitle")}
              value={row.title}
              onChange={(e) => update(i, { title: e.target.value })}
            />
            <Select
              value={row.assigneeId}
              onValueChange={(v) => update(i, { assigneeId: v })}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("responsible")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>{t("unassigned")}</SelectItem>
                {memberOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={row.priority}
              onValueChange={(v) => update(i, { priority: v as TaskPriority })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {tp(`priority_${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePicker
              className="w-40"
              value={row.dueDate}
              onChange={(d) => update(i, { dueDate: d })}
              placeholder={t("colDeadline")}
            />
            {canWrite && rows.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {canWrite && (
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={onSubmit} disabled={submitting}>
              {t("createTasks")}
            </Button>
          </div>
        )}

        <TaskDialog
          open={!!editTask}
          onOpenChange={(o) => !o && setEditTask(null)}
          projectId={editTask?.project?.id ?? ""}
          task={editTask}
          memberOptions={memberOptions}
          canEdit={canWrite}
          onSaved={() => setEditTask(null)}
        />
      </CardContent>
    </Card>
  );
}
