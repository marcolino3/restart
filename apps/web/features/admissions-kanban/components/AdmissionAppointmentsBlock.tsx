"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { cn } from "@/lib/utils";

import type {
  AdmissionAppointment,
  AppointmentStatus,
} from "../actions/get-admission-appointments.action";
import { deleteAdmissionAppointmentAction } from "../actions/mutate-admission-appointment.action";
import type { AdmissionAppointmentType } from "../types";
import type { AppointmentMember } from "./AppointmentForm";
import { AppointmentDialog } from "./AppointmentDialog";

/** Status values that are still "open" — a past date makes them overdue. */
const OPEN_STATUSES: AppointmentStatus[] = ["SCHEDULED", "RESCHEDULING"];

/**
 * An appointment counts as "past" when its end (or start, if no period) lies
 * before now AND it is still in an open status. COMPLETED/CANCELLED are final
 * and never rendered as past.
 */
function isPast(a: AdmissionAppointment, now: number): boolean {
  if (!OPEN_STATUSES.includes(a.status)) return false;
  const end = new Date(a.endsAt ?? a.scheduledAt).getTime();
  return end < now;
}

interface Props {
  applicationId: string;
  appointments: AdmissionAppointment[];
  types: AdmissionAppointmentType[];
  members: AppointmentMember[];
  canEdit: boolean;
  onChanged: () => void;
  childName?: string;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Show up to two assignee names inline, collapsing the rest into "+N". */
function formatAssignees(names: string[]): string {
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

/** Render a period's end: only the time if it's the same calendar day, else the full date+time. */
function formatPeriodEnd(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  return end.toLocaleString("de-CH", {
    ...(sameDay
      ? {}
      : { day: "2-digit", month: "2-digit", year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdmissionAppointmentsBlock({
  applicationId,
  appointments,
  types,
  members,
  canEdit,
  onChanged,
  childName,
}: Props) {
  const t = useTranslations("Admissions");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AdmissionAppointment | null>(null);
  const [deleting, setDeleting] = useState<AdmissionAppointment | null>(null);

  // Snapshot "now" once per mount — stable across renders and keeps the render
  // pure (Date.now() directly in render is flagged by the React compiler).
  const [now] = useState(() => Date.now());
  const scheduledCount = appointments.filter((a) =>
    OPEN_STATUSES.includes(a.status),
  ).length;

  // Newest first (latest scheduled date on top).
  const sorted = appointments
    .slice()
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    );

  const openCreate = () => {
    setSelectedAppointment(null);
    setDialogOpen(true);
  };
  const openEdit = (a: AdmissionAppointment) => {
    if (!canEdit) return;
    setSelectedAppointment(a);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return { success: false as const };
    const res = await deleteAdmissionAppointmentAction(
      deleting.id,
      applicationId,
    );
    return { success: res.success, error: res.success ? undefined : res.error };
  };

  return (
    <section className="rounded-lg border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[15px] font-[650] tracking-[-0.01em]">
            {t("appointments")}
          </span>
          {scheduledCount > 0 && (
            <span className="rounded-full bg-accent px-[9px] py-0.5 font-mono text-[11px] font-[600] leading-none tabular-nums text-accent-foreground">
              {scheduledCount}
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
            aria-label={t("appointmentNew")}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="p-4">
        {sorted.length === 0 && (
          <p className="py-1 text-xs italic text-muted-foreground">
            {t("appointmentEmpty")}
          </p>
        )}

        {sorted.length > 0 && (
          <ul className="space-y-0.5">
            {sorted.map((a) => {
              const cancelled = a.status === "CANCELLED";
              const past = isPast(a, now);
              // Meta line: duration · location · assignees — only the parts present.
              const meta = [
                a.durationMinutes
                  ? `${a.durationMinutes} ${t("appointmentMinutesAbbr")}`
                  : null,
                a.location || null,
                a.assignedNames.length > 0
                  ? formatAssignees(a.assignedNames)
                  : null,
              ].filter(Boolean);
              return (
                <li key={a.id}>
                  <div
                    className={cn(
                      "group relative flex items-start gap-2 rounded-md border border-transparent px-2 py-1.5",
                      "transition-colors hover:border-border hover:bg-muted/50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      disabled={!canEdit}
                      className="min-w-0 flex-1 space-y-0.5 text-left disabled:cursor-default"
                    >
                      {/* Line 1: dot + type + status — dot centred to this line */}
                      <div className="flex items-center gap-1.5">
                        <span
                          aria-hidden
                          className="size-2 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                          style={{
                            backgroundColor:
                              a.appointmentTypeColor ??
                              "var(--muted-foreground)",
                          }}
                        />
                        <span
                          className={cn(
                            "truncate text-xs font-medium text-foreground",
                            cancelled && "text-muted-foreground line-through",
                          )}
                        >
                          {a.appointmentTypeLabel ??
                            a.title ??
                            t("appointmentTypeNone")}
                        </span>
                        {/* Title as a secondary label when a type is also set. */}
                        {a.appointmentTypeLabel && a.title && (
                          <span className="truncate text-[11px] text-muted-foreground">
                            {a.title}
                          </span>
                        )}
                        <StatusBadge status={a.status} past={past} t={t} />
                      </div>
                      {/* Line 2: date / period */}
                      <div
                        className={cn(
                          "truncate font-mono text-[11px] tabular-nums text-muted-foreground",
                          cancelled && "line-through",
                        )}
                      >
                        {formatDateTime(a.scheduledAt)}
                        {a.endsAt
                          ? ` – ${formatPeriodEnd(a.scheduledAt, a.endsAt)}`
                          : ""}
                      </div>
                      {/* Line 3 (optional): duration · location · assignees */}
                      {meta.length > 0 && (
                        <div className="truncate text-[11px] text-muted-foreground/80">
                          {meta.join(" · ")}
                        </div>
                      )}
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        className="mt-[3px] shrink-0 rounded p-0.5 text-muted-foreground/60 opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                        onClick={() => setDeleting(a)}
                        aria-label={t("appointmentDelete")}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {canEdit && (
        <AppointmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          applicationId={applicationId}
          types={types}
          members={members}
          initial={selectedAppointment}
          childName={childName}
          onSaved={onChanged}
        />
      )}

      <DeleteConfirmationDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("appointmentDeleteTitle")}
        description={
          deleting
            ? t("appointmentDeleteDescription", {
                label:
                  deleting.appointmentTypeLabel ??
                  deleting.title ??
                  t("appointmentTypeNone"),
                when: formatDateTime(deleting.scheduledAt),
              })
            : undefined
        }
        onConfirm={confirmDelete}
        onSuccess={onChanged}
      />
    </section>
  );
}

// Status → Design-Handoff status-pill palette (theme-aware --status-* tokens).
// Each status maps to a distinct shade so the states read as one graded system:
//   sky = active/planned · green = done · rose = cancelled ·
//   amber = needs rescheduling / past (attention).
const STATUS_BADGE: Record<
  AppointmentStatus,
  { variant: string; labelKey: string }
> = {
  SCHEDULED: { variant: "sky", labelKey: "appointmentStatusScheduled" },
  COMPLETED: { variant: "green", labelKey: "appointmentStatusCompleted" },
  CANCELLED: { variant: "rose", labelKey: "appointmentStatusCancelled" },
  RESCHEDULING: {
    variant: "amber",
    labelKey: "appointmentStatusRescheduling",
  },
};

function StatusBadge({
  status,
  past,
  t,
}: {
  status: AppointmentStatus;
  past: boolean;
  t: (key: string) => string;
}) {
  // A past, still-open appointment reads as "Vergangen" (amber) — a nudge to
  // set a final status — instead of its literal open status.
  if (past) {
    return (
      <Badge variant="amber" className="shrink-0 text-[9px]">
        {t("appointmentStatusPast")}
      </Badge>
    );
  }
  const { variant, labelKey } = STATUS_BADGE[status];
  return (
    <Badge
      variant={variant as never}
      className="shrink-0 text-[9px]"
    >
      {t(labelKey)}
    </Badge>
  );
}
