"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";

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

import { DataRequestForm } from "./DataRequestForm";
import { createDataRequestAction } from "../actions/create-data-request.action";
import { updateDataRequestAction } from "../actions/update-data-request.action";
import type { DataRequestFormType } from "../schemas/data-request-form.schema";
import type { DataSubjectRequest } from "../types";

const NS = "DataRequests";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  NEW: "outline",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  REJECTED: "destructive",
};

const isTerminal = (s: string) => s === "COMPLETED" || s === "REJECTED";

/** Days from now until the deadline (negative = overdue). */
const daysUntil = (dueDate: string) =>
  Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);

const deadlineDot = (req: DataSubjectRequest): string => {
  if (isTerminal(req.status)) return "bg-muted-foreground";
  const d = daysUntil(req.dueDate);
  if (d < 0) return "bg-red-500";
  if (d <= 7) return "bg-amber-500";
  return "bg-emerald-500";
};

export function DataRequestsList({
  initial,
}: {
  initial: DataSubjectRequest[];
}) {
  const t = useTranslations(NS);
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const onCreate = (values: DataRequestFormType) =>
    startTransition(async () => {
      const res = await handleAction({
        action: () => createDataRequestAction(values),
        successMessage: t("createdToast"),
      });
      if (res.success) {
        setOpen(false);
        router.refresh();
      }
    });

  const setStatus = (id: string, status: DataSubjectRequest["status"]) =>
    startTransition(async () => {
      await handleAction({
        action: () => updateDataRequestAction({ id, status }),
        successMessage: t("updatedToast"),
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
          {t("newRequest")}
        </Button>
      </div>

      {initial.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          {t("noRequests")}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {initial.map((req) => (
            <li key={req.id} className="flex flex-wrap items-center gap-3 p-4">
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  deadlineDot(req),
                )}
                title={t("dueOn", { date: fmtDate(req.dueDate) })}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{req.subjectName}</span>
                  <Badge variant="outline" className="text-xs">
                    {t(`type.${req.type}`)}
                  </Badge>
                  <Badge variant={STATUS_VARIANT[req.status]}>
                    {t(`status.${req.status}`)}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("dueOn", { date: fmtDate(req.dueDate) })}
                  {req.assigneeMembership?.user &&
                    ` · ${req.assigneeMembership.user.firstName ?? ""} ${
                      req.assigneeMembership.user.lastName ?? ""
                    }`.trimEnd()}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending || req.status === "IN_PROGRESS"}
                  onClick={() => setStatus(req.id, "IN_PROGRESS")}
                >
                  {t("actionInProgress")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending || req.status === "COMPLETED"}
                  onClick={() => setStatus(req.id, "COMPLETED")}
                >
                  {t("actionComplete")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending || req.status === "REJECTED"}
                  onClick={() => setStatus(req.id, "REJECTED")}
                >
                  {t("actionReject")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("newRequest")}</DialogTitle>
          </DialogHeader>
          <DataRequestForm submitting={pending} onSubmit={onCreate} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
