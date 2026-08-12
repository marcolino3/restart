"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { stopImpersonatingAction } from "../actions/impersonate-user.action";

interface Props {
  asUserName?: string;
  organizationName?: string;
  /** ISO timestamp — org-support sessions are capped at 30min server-side. */
  expiresAt?: string;
}

const formatRemaining = (expiresAt: string): string | null => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function ImpersonationBanner({
  asUserName,
  organizationName,
  expiresAt,
}: Props) {
  const t = useTranslations("Impersonation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [remaining, setRemaining] = useState<string | null>(
    expiresAt ? formatRemaining(expiresAt) : null
  );

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const next = formatRemaining(expiresAt);
      setRemaining(next);
      // Session hard-expires server-side at this point — refresh so the
      // page picks up the restored admin session instead of erroring on
      // the next request with a dead cookie.
      if (!next) router.refresh();
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, router]);

  const handleStop = () => {
    startTransition(async () => {
      const res = await stopImpersonatingAction();
      if (!res.success) {
        toast.error(t("error"), { description: res.error });
        return;
      }
      // Cookie was restored — refresh so the page re-renders under the
      // original SuperAdmin session.
      router.refresh();
      // Belt-and-suspenders: also force a hard reload after a short delay
      // so any client caches that capture the user identity get wiped.
      setTimeout(() => window.location.reload(), 300);
    });
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-amber-500/95 text-amber-950 border-b border-amber-700/40 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          <span className="font-semibold">{t("bannerTitle")}</span>
          {asUserName && (
            <span className="opacity-80">— {t("loggedInAs", { name: asUserName })}</span>
          )}
          {organizationName && (
            <span className="opacity-80">
              — {t("inOrganization", { name: organizationName })}
            </span>
          )}
          {remaining && (
            <span className="opacity-80">
              — {t("remainingTime", { time: remaining })}
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="bg-white/30 border-amber-900/40 text-amber-950 hover:bg-white/50"
          onClick={handleStop}
          disabled={isPending}
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          {isPending ? "…" : t("backToAdmin")}
        </Button>
      </div>
    </div>
  );
}
