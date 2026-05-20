"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Bell,
  BellRing,
  CalendarIcon,
  Check,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { AdmissionReminder } from "../actions/get-admission-reminders.action";
import {
  completeAdmissionReminderAction,
  createAdmissionReminderAction,
  deleteAdmissionReminderAction,
  uncompleteAdmissionReminderAction,
} from "../actions/mutate-admission-reminder.action";

interface Props {
  applicationId: string;
  reminders: AdmissionReminder[];
  canEdit: boolean;
  onChanged: () => void;
}

type PresetKey = "1d" | "3d" | "1w" | "2w";

const PRESETS: Array<{ key: PresetKey; days: number; labelKey: string }> = [
  { key: "1d", days: 1, labelKey: "reminderPreset1d" },
  { key: "3d", days: 3, labelKey: "reminderPreset3d" },
  { key: "1w", days: 7, labelKey: "reminderPreset1w" },
  { key: "2w", days: 14, labelKey: "reminderPreset2w" },
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function atNineAm(date: Date): Date {
  const d = new Date(date);
  d.setHours(9, 0, 0, 0);
  return d;
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
}: Props) {
  const t = useTranslations("Admissions");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [customTime, setCustomTime] = useState("09:00");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const now = new Date();
  const open = reminders.filter((r) => !r.completedAt);
  const completed = reminders.filter((r) => r.completedAt);
  const hasOverdue = open.some((r) => new Date(r.dueAt) < now);

  const reset = () => {
    setTitle("");
    setCustomDate(undefined);
    setCustomTime("09:00");
    setDatePopoverOpen(false);
    setAdding(false);
  };

  const submit = async (dueAt: Date) => {
    if (!title.trim()) {
      toast.error(t("reminderTitleRequired"));
      return;
    }
    setSubmitting(true);
    const res = await createAdmissionReminderAction({
      applicationId,
      dueAt: dueAt.toISOString(),
      title: title.trim(),
    });
    setSubmitting(false);
    if (!res.success) {
      toast.error(res.error ?? t("reminderCreateError"));
      return;
    }
    toast.success(t("reminderCreateOk"));
    reset();
    onChanged();
  };

  const onPreset = (preset: PresetKey) => {
    const days = PRESETS.find((p) => p.key === preset)!.days;
    submit(atNineAm(addDays(new Date(), days)));
  };

  const onCustom = () => {
    if (!customDate) {
      toast.error(t("reminderDueRequired"));
      return;
    }
    const [hh, mm] = customTime.split(":").map(Number);
    const due = new Date(customDate);
    due.setHours(hh || 9, mm || 0, 0, 0);
    submit(due);
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
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("reminders")}
          </span>
          {open.length > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                hasOverdue
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {open.length}
            </span>
          )}
        </div>
        {canEdit && !adding && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setAdding(true)}
            aria-label={t("reminderNew")}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="p-4">
        {/* Composer */}
        {adding && (
          <div className="mb-3 space-y-2.5 rounded-md border bg-muted/30 p-2.5">
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") reset();
                if (e.key === "Enter" && title.trim()) onPreset("3d");
              }}
              placeholder={t("reminderTitlePlaceholder")}
              className="h-8 text-xs"
            />

            <div className="flex flex-wrap items-center gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  disabled={submitting || !title.trim()}
                  onClick={() => onPreset(p.key)}
                  className={cn(
                    "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-medium transition",
                    "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-foreground",
                  )}
                >
                  {t(p.labelKey)}
                </button>
              ))}
              <Popover
                open={datePopoverOpen}
                onOpenChange={setDatePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={submitting || !title.trim()}
                    className={cn(
                      "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium transition",
                      customDate
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    {customDate
                      ? format(customDate, "d. MMM", { locale: de })
                      : t("reminderPresetCustom")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={(d) => setCustomDate(d)}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    locale={de}
                  />
                  <div className="flex items-center justify-between gap-2 border-t p-2">
                    <Input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="h-8 w-24 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setDatePopoverOpen(false);
                        onCustom();
                      }}
                      disabled={!customDate || submitting}
                      className="h-8 gap-1 text-xs"
                    >
                      {submitting && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {t("reminderSubmit")}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <button
                type="button"
                onClick={reset}
                disabled={submitting}
                className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={t("reminderCancel")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Open reminders */}
        {open.length === 0 && completed.length === 0 && !adding && (
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
                    className={cn(
                      "group -mx-1 flex items-start gap-2 rounded px-1 py-1 text-xs transition hover:bg-muted/40",
                    )}
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
                    <div className="min-w-0 flex-1 leading-tight">
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
                      </div>
                    </div>
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

        {/* Completed (collapsed) */}
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
    </section>
  );
}
