"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bell, BellRing, Check, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { AdmissionReminder } from "../actions/get-admission-reminders.action";
import {
  completeAdmissionReminderAction,
  deleteAdmissionReminderAction,
  uncompleteAdmissionReminderAction,
} from "../actions/mutate-admission-reminder.action";
import { ReminderDialog } from "./ReminderDialog";
import type { ReminderMember } from "./ReminderForm";

interface Props {
  applicationId: string;
  reminders: AdmissionReminder[];
  canEdit: boolean;
  onChanged: () => void;
  /** Assignee options for the reminder dialog. */
  members: ReminderMember[];
  /** Child name for the dialog title ("Neue Erinnerung — <Kind>"). */
  childName?: string;
}

function formatRelative(due: Date, now: Date, locale: string): string {
  const diffMs = due.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const fmt = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return fmt.format(diffMin, "minute");
  const diffHour = Math.round(diffMs / 3_600_000);
  if (Math.abs(diffHour) < 24) return fmt.format(diffHour, "hour");
  const diffDay = Math.round(diffMs / 86_400_000);
  return fmt.format(diffDay, "day");
}

export function AdmissionRemindersBlock({
  applicationId,
  reminders,
  canEdit,
  onChanged,
  members,
  childName,
}: Props) {
  const t = useTranslations("Admissions");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdmissionReminder | null>(null);
  const [, startTransition] = useTransition();

  const now = new Date();
  const open = reminders.filter((r) => !r.completedAt);
  const completed = reminders.filter((r) => r.completedAt);
  const hasOverdue = open.some((r) => new Date(r.dueAt) < now);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (r: AdmissionReminder) => {
    if (!canEdit) return;
    setEditing(r);
    setDialogOpen(true);
  };

  const onToggle = (r: AdmissionReminder) => {
    startTransition(async () => {
      const res = r.completedAt
        ? await uncompleteAdmissionReminderAction(r.id, applicationId)
        : await completeAdmissionReminderAction(r.id, applicationId);
      if (!res.success) {
        toast.error(res.error ?? t("reminderUpdateError"));
        return;
      }
      onChanged();
    });
  };

  const onDelete = (r: AdmissionReminder) => {
    if (!confirm(t("reminderDeleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteAdmissionReminderAction(r.id, applicationId);
      if (!res.success) {
        toast.error(res.error ?? t("reminderDeleteError"));
        return;
      }
      toast.success(t("reminderDeleteOk"));
      onChanged();
    });
  };

  return (
    <section className="rounded-lg border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          {hasOverdue ? (
            <BellRing className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-[15px] font-[650] tracking-[-0.01em]">
            {t("reminders")}
          </span>
          {open.length > 0 && (
            <span
              className={cn(
                "rounded-full px-[9px] py-0.5 font-mono text-[11px] font-[600] leading-none tabular-nums",
                hasOverdue
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent text-accent-foreground",
              )}
            >
              {open.length}
            </span>
          )}
        </div>
        {canEdit && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={openCreate}
            aria-label={t("reminderNewTitle")}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="p-4">
        {open.length === 0 && completed.length === 0 && (
          <p className="py-1 text-xs italic text-muted-foreground">
            {t("reminderEmpty")}
          </p>
        )}

        {open.length > 0 && (
          <ul className="space-y-1">
            {open
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
              )
              .map((r) => {
                const due = new Date(r.dueAt);
                const overdue = due < now;
                return (
                  <li
                    key={r.id}
                    className="group -mx-1 flex items-start gap-2 rounded px-1 py-1 text-xs transition hover:bg-muted/40"
                  >
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => onToggle(r)}
                        className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-muted-foreground/40 transition hover:border-primary hover:bg-primary/5"
                        aria-label={t("reminderComplete")}
                      />
                    ) : (
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      disabled={!canEdit}
                      className="min-w-0 flex-1 text-left leading-tight disabled:cursor-default"
                    >
                      <div className="truncate font-medium text-foreground">
                        {r.title}
                      </div>
                      <div
                        className={cn(
                          "truncate text-[11px]",
                          overdue
                            ? "font-medium text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatRelative(due, now, "de-CH")} ·{" "}
                        {due.toLocaleString("de-CH", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {r.assignedToName ? ` · ${r.assignedToName}` : ""}
                      </div>
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        className="opacity-0 transition group-hover:opacity-100"
                        onClick={() => onDelete(r)}
                        aria-label={t("reminderDelete")}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>
        )}

        {completed.length > 0 && (
          <details className="mt-2 border-t pt-2 text-xs">
            <summary className="cursor-pointer list-none text-[11px] text-muted-foreground hover:text-foreground">
              {t("reminderCompletedCount", { count: completed.length })}
            </summary>
            <ul className="mt-1 space-y-0.5">
              {completed.map((r) => (
                <li
                  key={r.id}
                  className="group -mx-1 flex items-start gap-2 rounded px-1 py-1 text-xs text-muted-foreground hover:bg-muted/40"
                >
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => onToggle(r)}
                      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary bg-primary/10"
                      aria-label={t("reminderReopen")}
                    >
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </button>
                  ) : (
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  )}
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate line-through">{r.title}</div>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onDelete(r)}
                      className="opacity-0 transition group-hover:opacity-100"
                      aria-label={t("reminderDelete")}
                    >
                      <Trash2 className="h-3 w-3 hover:text-destructive" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {canEdit && (
        <ReminderDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          applicationId={applicationId}
          members={members}
          initial={editing}
          childName={childName}
          onSaved={onChanged}
        />
      )}
    </section>
  );
}
