"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bell, BellRing, Check, ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
  AdmissionReminderListFilter,
  OrgAdmissionReminder,
} from "../actions/get-org-admission-reminders.action";
import { getOrgAdmissionRemindersAction } from "../actions/get-org-admission-reminders.action";
import {
  completeAdmissionReminderAction,
  uncompleteAdmissionReminderAction,
} from "../actions/mutate-admission-reminder.action";

interface Props {
  initialFilter: AdmissionReminderListFilter;
  initialReminders: OrgAdmissionReminder[];
  canEdit: boolean;
}

const FILTERS: AdmissionReminderListFilter[] = [
  "OVERDUE",
  "TODAY",
  "WEEK",
  "OPEN",
  "COMPLETED",
];

const FILTER_LABELS: Record<AdmissionReminderListFilter, string> = {
  OVERDUE: "remindersFilterOverdue",
  TODAY: "remindersFilterToday",
  WEEK: "remindersFilterWeek",
  OPEN: "remindersFilterOpen",
  COMPLETED: "remindersFilterCompleted",
};

export function RemindersListPage({
  initialFilter,
  initialReminders,
  canEdit,
}: Props) {
  const t = useTranslations("Admissions");
  const router = useRouter();
  const [filter, setFilter] =
    useState<AdmissionReminderListFilter>(initialFilter);
  const [reminders, setReminders] =
    useState<OrgAdmissionReminder[]>(initialReminders);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const isFirstRender = useRef(true);

  // Refetch when the filter changes. Skip only the very first render — the
  // initial tab's data is already server-fetched. Returning to the initial
  // filter after viewing another tab must still refetch (state holds the
  // previous tab's reminders).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    getOrgAdmissionRemindersAction(filter).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.success) setReminders(res.data);
      else toast.error(res.error ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const refresh = () => {
    startTransition(async () => {
      const res = await getOrgAdmissionRemindersAction(filter);
      if (res.success) setReminders(res.data);
    });
  };

  const onToggle = (r: OrgAdmissionReminder) => {
    startTransition(async () => {
      const res = r.completedAt
        ? await uncompleteAdmissionReminderAction(r.id, r.applicationId)
        : await completeAdmissionReminderAction(r.id, r.applicationId);
      if (!res.success) {
        toast.error(res.error ?? t("reminderUpdateError"));
        return;
      }
      refresh();
    });
  };

  const now = new Date();

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bell className="h-6 w-6 text-muted-foreground" />
          {t("remindersPageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("remindersPageSubtitle")}
        </p>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as AdmissionReminderListFilter)}
      >
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f} value={f} className="gap-1.5">
              {f === "OVERDUE" && <BellRing className="h-3.5 w-3.5" />}
              {t(FILTER_LABELS[f])}
            </TabsTrigger>
          ))}
        </TabsList>

        {FILTERS.map((f) => (
          <TabsContent key={f} value={f} className="pt-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loading")}
              </div>
            ) : reminders.length === 0 ? (
              <p className="rounded-md border border-dashed p-8 text-center text-sm italic text-muted-foreground">
                {t("remindersEmptyFilter")}
              </p>
            ) : (
              <ul className="space-y-2">
                {reminders.map((r) => {
                  const due = new Date(r.dueAt);
                  const overdue = !r.completedAt && due < now;
                  return (
                    <li
                      key={r.id}
                      className={cn(
                        "group flex items-start gap-3 rounded-lg border bg-card p-3 text-sm shadow-sm transition hover:shadow-md",
                        overdue && "border-destructive/40 bg-destructive/5",
                      )}
                    >
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onToggle(r)}
                          className={cn(
                            "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition",
                            r.completedAt
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/40 hover:border-primary",
                          )}
                          aria-label={t(
                            r.completedAt
                              ? "reminderReopen"
                              : "reminderComplete",
                          )}
                        >
                          {r.completedAt && <Check className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "font-medium",
                            r.completedAt && "text-muted-foreground line-through",
                          )}
                        >
                          {r.title}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span
                            className={cn(
                              overdue && "font-medium text-destructive",
                            )}
                          >
                            {due.toLocaleString("de-CH", {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span aria-hidden>·</span>
                          <span>
                            {t("remindersForChild", {
                              name: r.applicationChildName,
                            })}
                          </span>
                          {r.assignedToName && (
                            <>
                              <span aria-hidden>·</span>
                              <span>{r.assignedToName}</span>
                            </>
                          )}
                        </div>
                        {r.note && (
                          <p className="mt-1 whitespace-pre-wrap text-xs text-foreground/90">
                            {r.note}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() =>
                          router.push(`/admin/admissions/${r.applicationId}`)
                        }
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t("remindersOpenApplication")}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
