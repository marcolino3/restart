"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck, CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { handleAction } from "@/lib/actions/handle-action";

import { recertifyAccessAction } from "../actions/recertify-access.action";
import type { AccessReviewEntry } from "../types";

const NS = "AccessReview";

/** A review older than ~12 months (or never done) is considered stale. */
const isStale = (lastReviewedAt?: string | null): boolean => {
  if (!lastReviewedAt) return true;
  const oneYearMs = 365 * 86_400_000;
  return Date.now() - new Date(lastReviewedAt).getTime() > oneYearMs;
};

export function AccessReviewList({
  initial,
}: {
  initial: AccessReviewEntry[];
}) {
  const t = useTranslations(NS);
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const fmt = (s: string) =>
    new Date(s).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const recertify = (membershipId: string) =>
    startTransition(async () => {
      await handleAction({
        action: () => recertifyAccessAction(membershipId),
        successMessage: t("recertifiedToast"),
      });
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {initial.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          {t("noEntries")}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {initial.map((entry) => {
            const stale = isStale(entry.lastReviewedAt);
            return (
              <li
                key={entry.membershipId}
                className="flex flex-wrap items-center gap-3 p-4"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    stale ? "bg-amber-500" : "bg-emerald-500",
                  )}
                  title={
                    entry.lastReviewedAt
                      ? t("reviewedOn", { date: fmt(entry.lastReviewedAt) })
                      : t("never")
                  }
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{entry.memberName}</span>
                    {entry.roles.map((r) => (
                      <Badge key={r} variant="outline" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {entry.sensitivePermissions.map((p) => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        {t(`perm.${p}`)}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {entry.lastReviewedAt
                      ? t("reviewedOn", { date: fmt(entry.lastReviewedAt) })
                      : t("never")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={stale ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => recertify(entry.membershipId)}
                >
                  <CircleCheck className="mr-1 h-4 w-4" />
                  {t("recertify")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
