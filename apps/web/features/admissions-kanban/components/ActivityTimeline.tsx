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
  { icon: typeof Phone; tone: string }
> = {
  CALL: {
    icon: Phone,
    tone: "bg-blue-500/10 text-blue-700 ring-blue-500/30",
  },
  EMAIL: {
    icon: Mail,
    tone: "bg-violet-500/10 text-violet-700 ring-violet-500/30",
  },
  MEETING: {
    icon: CalendarClock,
    tone: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30",
  },
  NOTE: {
    icon: StickyNote,
    tone: "bg-amber-500/10 text-amber-700 ring-amber-500/30",
  },
};

interface Props {
  applicationId: string;
  activities: AdmissionActivity[];
  canEdit: boolean;
  onChanged: () => void;
}

function formatDateHeader(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
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

  if (activities.length === 0 && !canEdit) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm italic text-muted-foreground">
        {t("activityEmpty")}
      </p>
    );
  }

  // Group by YYYY-MM-DD bucket.
  const groups: Array<{ day: string; items: AdmissionActivity[] }> = [];
  for (const a of activities) {
    const day = a.occurredAt.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(a);
    else groups.push({ day, items: [a] });
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
    <div className="space-y-6">
      {activities.length === 0 && (
        <p className="rounded-md border border-dashed p-6 text-center text-sm italic text-muted-foreground">
          {t("activityEmpty")}
        </p>
      )}
      {groups.map((group) => (
        <div key={group.day} className="space-y-2">
          <div className="sticky top-0 z-[1] -mx-1 bg-background/95 px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
            {formatDateHeader(group.day, "de-CH")}
          </div>
          <ul className="space-y-2">
            {group.items.map((a) => {
              const meta = TYPE_META[a.type];
              const Icon = meta.icon;
              const isEdited =
                new Date(a.updatedAt).getTime() -
                  new Date(a.createdAt).getTime() >
                1000;
              if (editingId === a.id) {
                return (
                  <li key={a.id}>
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
                <li
                  key={a.id}
                  className="group flex gap-3 rounded-lg border bg-card p-3 text-sm shadow-sm transition hover:shadow-md"
                >
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1",
                      meta.tone,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-medium">
                        {t(`activityType${capitalize(a.type)}`)}
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
                      {a.durationMinutes != null && (
                        <span className="text-[11px] text-muted-foreground">
                          · {a.durationMinutes} min
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-muted-foreground">
                        {formatTime(a.occurredAt, "de-CH")}
                      </span>
                    </div>
                    {a.subject && (
                      <div className="mt-0.5 font-semibold text-foreground">
                        {a.subject}
                      </div>
                    )}
                    {a.location && (
                      <div className="text-[11px] text-muted-foreground">
                        {a.location}
                      </div>
                    )}
                    {a.body && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                        {a.body}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      {a.createdByName && (
                        <span>
                          {t("activityBy", { name: a.createdByName })}
                        </span>
                      )}
                      {isEdited && <span>{t("activityEditedSuffix")}</span>}
                    </div>
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
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(a)}
                        >
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
