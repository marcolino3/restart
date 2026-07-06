"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  startClockAction,
  stopClockAction,
} from "../actions/mutate-time-entry.action";

interface Props {
  employeeId: string;
  isRunning: boolean;
  /**
   * `timer`: Stop-Button im Timer-Band aus dem Design-Handoff
   * (Gold-Pille auf dunklem Band) — Logik bleibt identisch.
   */
  appearance?: "default" | "timer";
  className?: string;
}

export const ClockButton = ({
  employeeId,
  isRunning,
  appearance = "default",
  className,
}: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const { success } = isRunning
        ? await stopClockAction(employeeId)
        : await startClockAction(employeeId);
      if (success) {
        toast.success(tc("success"));
        router.refresh();
      } else {
        toast.error(tc("error"));
      }
    });
  };

  return (
    <Button
      variant={isRunning ? "destructive" : "default"}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        appearance === "timer" &&
          "h-10 rounded-full bg-gold px-5 text-[13.5px] font-bold text-gold-foreground hover:bg-gold/90",
        className
      )}
    >
      {isRunning ? (
        <>
          <Square className="size-4" /> {t("stopClock")}
        </>
      ) : (
        <>
          <Play className="size-4" /> {t("startClock")}
        </>
      )}
    </Button>
  );
};
