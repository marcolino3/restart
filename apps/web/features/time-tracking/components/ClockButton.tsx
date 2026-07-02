"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  startClockAction,
  stopClockAction,
} from "../actions/mutate-time-entry.action";

interface Props {
  employeeId: string;
  isRunning: boolean;
}

export const ClockButton = ({ employeeId, isRunning }: Props) => {
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
