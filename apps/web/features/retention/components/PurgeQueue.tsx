"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { RefreshCw, Check, X, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleAction } from "@/lib/actions/handle-action";

import { scanRetentionAction } from "../actions/scan-retention.action";
import { reviewPurgeCandidateAction } from "../actions/review-purge-candidate.action";
import { executePurgeCandidateAction } from "../actions/execute-purge-candidate.action";
import type { PurgeCandidate } from "../purge-types";

const NS = "RetentionSettings";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "secondary",
  EXECUTED: "secondary",
  FAILED: "destructive",
};

export function PurgeQueue({ initial }: { initial: PurgeCandidate[] }) {
  const t = useTranslations(NS);
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<PurgeCandidate | null>(null);

  const fmt = (s: string) =>
    new Date(s).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const scan = () =>
    startTransition(async () => {
      const res = await scanRetentionAction();
      if (res.success) {
        toast.success(t("scannedToast", { count: res.data }));
        router.refresh();
      } else {
        toast.error(t("scanFailed"));
      }
    });

  const review = (id: string, approve: boolean) =>
    startTransition(async () => {
      await handleAction({
        action: () => reviewPurgeCandidateAction(id, approve),
        successMessage: approve ? t("approvedToast") : t("rejectedToast"),
      });
      router.refresh();
    });

  const execute = (id: string) =>
    startTransition(async () => {
      await handleAction({
        action: () => executePurgeCandidateAction(id),
        successMessage: t("executedToast"),
      });
      setConfirming(null);
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("purgeTitle")}</h2>
          <p className="text-muted-foreground text-sm">{t("purgeSubtitle")}</p>
        </div>
        <Button size="sm" variant="outline" disabled={pending} onClick={scan}>
          <RefreshCw className="mr-1 h-4 w-4" />
          {t("scan")}
        </Button>
      </div>

      {initial.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          {t("noPurgeCandidates")}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {initial.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.subjectLabel}</span>
                  <Badge variant="outline" className="text-xs">
                    {t(`entity.${c.entityType}`)}
                  </Badge>
                  <Badge
                    variant={c.action === "DELETE" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {t(`action.${c.action}`)}
                  </Badge>
                  <Badge variant={STATUS_VARIANT[c.status]} className="text-xs">
                    {t(`purgeStatus.${c.status}`)}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("dueSince", { date: fmt(c.dueSince) })}
                  {c.note ? ` · ${c.note}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {c.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => review(c.id, true)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      {t("approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => review(c.id, false)}
                    >
                      <X className="mr-1 h-4 w-4" />
                      {t("reject")}
                    </Button>
                  </>
                )}
                {c.status === "APPROVED" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => setConfirming(c)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {t("execute")}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmExecuteTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-muted-foreground text-sm">
              {confirming &&
                t("confirmExecuteBody", {
                  action: t(`action.${confirming.action}`),
                  subject: confirming.subjectLabel,
                })}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => confirming && execute(confirming.id)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t("execute")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
