"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, Lock, LockOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ensureCurrentPeriodAction,
  setPeriodStatusAction,
  type TimeTrackingPeriodItem,
} from "../actions/periods.action";

interface Props {
  periods: TimeTrackingPeriodItem[];
}

const fmt = (d: string) => format(new Date(d), "dd.MM.yyyy", { locale: de });

export const PeriodsSection = ({ periods }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lockTarget, setLockTarget] = useState<TimeTrackingPeriodItem | null>(
    null
  );

  const createCurrentPeriod = () =>
    startTransition(async () => {
      const r = await ensureCurrentPeriodAction();
      if (r.success) {
        toast.success(tc("success"));
        router.refresh();
      } else {
        toast.error(tc("error"));
      }
    });

  const setStatus = (id: string, status: "OPEN" | "LOCKED") =>
    startTransition(async () => {
      const r = await setPeriodStatusAction(id, status);
      if (r.success) {
        toast.success(tc("success"));
        setLockTarget(null);
        router.refresh();
      } else {
        toast.error(tc("error"));
      }
    });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("periods")}</h2>
        <Button size="sm" onClick={createCurrentPeriod} disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}{" "}
          {t("createCurrentPeriod")}
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("periodLabel")}</TableHead>
              <TableHead>{t("startDate")}</TableHead>
              <TableHead>{t("endDate")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-16 text-center">
                  {t("noPeriods")}
                </TableCell>
              </TableRow>
            ) : (
              periods.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.label}</TableCell>
                  <TableCell>{fmt(p.startDate)}</TableCell>
                  <TableCell>{fmt(p.endDate)}</TableCell>
                  <TableCell>
                    {p.status === "LOCKED" ? (
                      <Badge variant="destructive">{t("statusLocked")}</Badge>
                    ) : (
                      <Badge variant="outline">{t("statusOpen")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "LOCKED" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setStatus(p.id, "OPEN")}
                      >
                        <LockOpen className="size-4" /> {t("unlock")}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setLockTarget(p)}
                      >
                        <Lock className="size-4" /> {t("lock")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Lock confirmation — locking blocks all tracking within the period. */}
      <AlertDialog
        open={lockTarget !== null}
        onOpenChange={(open) => !open && setLockTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("lockPeriodTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("lockPeriodDescription", { label: lockTarget?.label ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                if (lockTarget) setStatus(lockTarget.id, "LOCKED");
              }}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("lock")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
