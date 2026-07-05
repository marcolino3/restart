"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { handleAction } from "@/lib/actions/handle-action";

import { DataBreachForm } from "./DataBreachForm";
import { createDataBreachAction } from "../actions/create-data-breach.action";
import { updateDataBreachAction } from "../actions/update-data-breach.action";
import type { DataBreachFormType } from "../schemas/data-breach-form.schema";
import type { DataBreachIncident } from "../types";

const NS = "DataBreaches";

const RISK_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = { LOW: "outline", MEDIUM: "secondary", HIGH: "destructive" };

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  OPEN: "destructive",
  INVESTIGATING: "default",
  CONTAINED: "secondary",
  CLOSED: "outline",
};

/** Authority-deadline dot: green once notified, red if overdue, amber while pending. */
const deadlineDot = (b: DataBreachIncident): string => {
  if (b.authorityNotifiedAt) return "bg-emerald-500";
  return new Date(b.authorityNotificationDueAt).getTime() < Date.now()
    ? "bg-red-500"
    : "bg-amber-500";
};

export function DataBreachesList({
  initial,
}: {
  initial: DataBreachIncident[];
}) {
  const t = useTranslations(NS);
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const fmt = (s: string) =>
    new Date(s).toLocaleString(locale === "de" ? "de-CH" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const onCreate = (values: DataBreachFormType) =>
    startTransition(async () => {
      const res = await handleAction({
        action: () => createDataBreachAction(values),
        successMessage: t("createdToast"),
      });
      if (res.success) {
        setOpen(false);
        router.refresh();
      }
    });

  const update = (
    args: Parameters<typeof updateDataBreachAction>[0],
    message: string,
  ) =>
    startTransition(async () => {
      await handleAction({
        action: () => updateDataBreachAction(args),
        successMessage: message,
      });
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("listTitle")}</h2>
          <p className="text-muted-foreground text-sm">{t("listSubtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("newIncident")}
        </Button>
      </div>

      {initial.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          {t("noIncidents")}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {initial.map((b) => (
            <li key={b.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    deadlineDot(b),
                  )}
                  title={t("authorityDueOn", {
                    date: fmt(b.authorityNotificationDueAt),
                  })}
                />
                <span className="font-medium">{b.title}</span>
                <Badge variant={RISK_VARIANT[b.riskLevel]} className="text-xs">
                  {t(`risk.${b.riskLevel}`)}
                </Badge>
                <Badge variant={STATUS_VARIANT[b.status]} className="text-xs">
                  {t(`status.${b.status}`)}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {t("detectedOn", { date: fmt(b.detectedAt) })}
                </span>
              </div>

              {b.description && (
                <p className="text-muted-foreground text-sm">{b.description}</p>
              )}

              {/* Notification checklist (Art. 33/34) */}
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant={b.authorityNotifiedAt ? "default" : "outline"}
                  disabled={pending}
                  onClick={() =>
                    update(
                      { id: b.id, authorityNotified: !b.authorityNotifiedAt },
                      t("updatedToast"),
                    )
                  }
                >
                  {b.authorityNotifiedAt && <Check className="mr-1 h-4 w-4" />}
                  {t("authorityNotified")}
                </Button>
                <Button
                  size="sm"
                  variant={b.subjectsNotifiedAt ? "default" : "outline"}
                  disabled={pending}
                  onClick={() =>
                    update(
                      { id: b.id, subjectsNotified: !b.subjectsNotifiedAt },
                      t("updatedToast"),
                    )
                  }
                >
                  {b.subjectsNotifiedAt && <Check className="mr-1 h-4 w-4" />}
                  {t("subjectsNotified")}
                </Button>

                <span className="mx-1 self-center text-muted-foreground">·</span>

                {(["INVESTIGATING", "CONTAINED", "CLOSED"] as const).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="ghost"
                    disabled={pending || b.status === s}
                    onClick={() =>
                      update({ id: b.id, status: s }, t("updatedToast"))
                    }
                  >
                    {t(`status.${s}`)}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("newIncident")}</DialogTitle>
          </DialogHeader>
          <DataBreachForm submitting={pending} onSubmit={onCreate} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
