"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { AdmissionAppointment } from "../actions/get-admission-appointments.action";
import { deleteAdmissionAppointmentAction } from "../actions/mutate-admission-appointment.action";
import type { AdmissionAppointmentType } from "../types";
import type { AppointmentMember } from "./AppointmentForm";
import { AppointmentDialog } from "./AppointmentDialog";

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
  const [, startTransition] = useTransition();

  const scheduledCount = appointments.filter(
    (a) => a.status === "SCHEDULED",
  ).length;

  const sorted = appointments
    .slice()
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
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

  const onDelete = (a: AdmissionAppointment) => {
    if (!confirm(t("appointmentDeleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteAdmissionAppointmentAction(a.id, applicationId);
      if (!res.success) {
        toast.error(res.error ?? t("appointmentDeleteError"));
        return;
      }
      toast.success(t("appointmentDeleteOk"));
      onChanged();
    });
  };

  return (
    <section className="rounded-lg border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("appointments")}
          </span>
          {scheduledCount > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
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
          <ul className="space-y-1">
            {sorted.map((a) => {
              const cancelled = a.status === "CANCELLED";
              return (
                <li
                  key={a.id}
                  className="group -mx-1 flex items-start gap-2 rounded px-1 py-1 text-xs transition hover:bg-muted/40"
                >
                  <span
                    aria-hidden
                    className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-border"
                    style={{
                      backgroundColor:
                        a.appointmentTypeColor ?? "var(--muted)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    disabled={!canEdit}
                    className="min-w-0 flex-1 text-left leading-tight disabled:cursor-default"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5 truncate font-medium text-foreground",
                        cancelled && "line-through text-muted-foreground",
                      )}
                    >
                      <span className="truncate">
                        {a.appointmentTypeLabel ?? t("appointmentTypeNone")}
                      </span>
                      <StatusBadge status={a.status} t={t} />
                    </div>
                    <div
                      className={cn(
                        "truncate text-[11px] text-muted-foreground",
                        cancelled && "line-through",
                      )}
                    >
                      {formatDateTime(a.scheduledAt)}
                      {a.endsAt
                        ? ` – ${formatPeriodEnd(a.scheduledAt, a.endsAt)}`
                        : ""}
                      {a.durationMinutes
                        ? ` · ${a.durationMinutes} ${t("appointmentMinutesAbbr")}`
                        : ""}
                      {a.location ? ` · ${a.location}` : ""}
                      {a.assignedNames.length > 0
                        ? ` · ${formatAssignees(a.assignedNames)}`
                        : ""}
                    </div>
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      className="opacity-0 transition group-hover:opacity-100"
                      onClick={() => onDelete(a)}
                      aria-label={t("appointmentDelete")}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
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
    </section>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: AdmissionAppointment["status"];
  t: (key: string) => string;
}) {
  if (status === "COMPLETED") {
    return (
      <Badge variant="green" className="shrink-0 text-[9px]">
        {t("appointmentStatusCompleted")}
      </Badge>
    );
  }
  if (status === "CANCELLED") {
    return (
      <Badge variant="secondary" className="shrink-0 text-[9px]">
        {t("appointmentStatusCancelled")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="shrink-0 text-[9px]">
      {t("appointmentStatusScheduled")}
    </Badge>
  );
}
