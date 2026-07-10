"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Mail,
  MoreHorizontal,
  Phone,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { deleteAdmissionActivityAction } from "../actions/delete-admission-activity.action";
import type {
  AdmissionActivity,
  AdmissionActivityType,
} from "../actions/get-admission-activities.action";
import { ActivityComposer } from "./ActivityComposer";

const TYPE_META: Record<
  AdmissionActivityType,
  { icon: typeof Phone; dot: string }
> = {
  CALL: { icon: Phone, dot: "border-blue-500" },
  EMAIL: { icon: Mail, dot: "border-violet-500" },
  MEETING: { icon: CalendarClock, dot: "border-emerald-500" },
  NOTE: { icon: StickyNote, dot: "border-amber-500" },
};

interface Props {
  applicationId: string;
  activities: AdmissionActivity[];
  canEdit: boolean;
  onChanged: () => void;
}

type ActivityTranslator = ReturnType<typeof useTranslations<"Admissions">>;

/** "MORGEN, 09:00" / "HEUTE, 14:20" / "MO, 29. JUNI" (uppercased via CSS). */
function formatEntryTimestamp(
  iso: string,
  locale: string,
  t: ActivityTranslator,
): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round(
    (startOfDay(date) - startOfDay(now)) / 86_400_000,
  );
  const time = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (dayDiff === 0) return `${t("activityTimestampToday")}, ${time}`;
  if (dayDiff === 1) return `${t("activityTimestampTomorrow")}, ${time}`;
  if (dayDiff === -1) return `${t("activityTimestampYesterday")}, ${time}`;

  const dateLabel = date.toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "long",
  });
  return dateLabel;
}

/** Timeline title — a human summary line per activity type. */
function entryTitle(a: AdmissionActivity, t: ActivityTranslator): string {
  if (a.subject) return a.subject;
  return t(
    `activityType${capitalize(a.type)}` as Parameters<ActivityTranslator>[0],
  );
}

/** Timeline subtitle — secondary metadata line under the title. */
function entrySubtitle(
  a: AdmissionActivity,
  t: ActivityTranslator,
): string | null {
  const parts: string[] = [];
  if (a.body) parts.push(a.body);
  if (a.location) parts.push(a.location);
  if (a.durationMinutes != null) parts.push(`${a.durationMinutes} min`);
  if (a.createdByName) parts.push(t("activityBy", { name: a.createdByName }));
  return parts.length ? parts.join(" · ") : null;
}

export function ActivityTimeline({
  applicationId,
  activities,
  canEdit,
  onChanged,
}: Props) {
  const t = useTranslations("Admissions");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (activities.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm italic text-muted-foreground">
        {t("activityEmpty")}
      </p>
    );
  }

  const onDelete = async (a: AdmissionActivity) => {
    if (!confirm(t("activityDeleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteAdmissionActivityAction(a.id, applicationId);
      if (!res.success) {
        toast.error(res.error ?? t("activityDeleteError"));
        return;
      }
      toast.success(t("activityDeleteOk"));
      onChanged();
    });
  };

  return (
    <ul className="space-y-0">
      {activities.map((a, index) => {
        const meta = TYPE_META[a.type];
        const isEdited =
          new Date(a.updatedAt).getTime() - new Date(a.createdAt).getTime() >
          1000;
        const isLast = index === activities.length - 1;

        if (editingId === a.id) {
          return (
            <li key={a.id} className="pb-4">
              <ActivityComposer
                applicationId={applicationId}
                initial={a}
                onSaved={() => {
                  setEditingId(null);
                  onChanged();
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          );
        }

        return (
          <li key={a.id} className="group relative flex gap-3 pb-5">
            {/* Colored dot + connecting line to the next entry. */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-background",
                  meta.dot,
                )}
              />
              {!isLast && (
                <span
                  className="mt-1 w-px flex-1 bg-border"
                  data-testid="timeline-connector"
                  aria-hidden
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                {formatEntryTimestamp(a.occurredAt, "de-CH", t)}
              </div>
              <div className="mt-0.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-foreground">
                      {entryTitle(a, t)}
                    </span>
                    {a.direction && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                        {a.direction === "INBOUND" ? (
                          <ArrowDownLeft className="h-2.5 w-2.5" />
                        ) : (
                          <ArrowUpRight className="h-2.5 w-2.5" />
                        )}
                        {t(
                          a.direction === "INBOUND"
                            ? "activityDirectionInbound"
                            : "activityDirectionOutbound",
                        )}
                      </span>
                    )}
                  </div>
                  {entrySubtitle(a, t) && (
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
                      {entrySubtitle(a, t)}
                      {isEdited && ` · ${t("activityEditedSuffix")}`}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 transition group-hover:opacity-100"
                        aria-label="Actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingId(a.id)}>
                        {t("activityEdit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(a)}
                      >
                        {t("activityDelete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function capitalize(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
