"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ClockButton } from "./ClockButton";
import type { TimeEntry } from "../types";

interface Props {
  employeeId: string;
  openEntry: TimeEntry | null;
}

const pad = (n: number) => n.toString().padStart(2, "0");

/** Live tickende Anzeige "H:MM:SS" seit `startIso` (rein präsentational). */
const ElapsedSince = ({
  startIso,
  className,
}: {
  startIso: string;
  className?: string;
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSeconds = Math.max(
    0,
    Math.floor((now - new Date(startIso).getTime()) / 1000)
  );
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return (
    <span suppressHydrationWarning className={className}>
      {h}:{pad(m)}:{pad(s)}
    </span>
  );
};

/**
 * Timer-Band aus dem Design-Handoff (`.timer`): laufende Erfassung prominent
 * mit Läuft-seit-Anzeige, Kategorie-Chip und Stop-Button. Ohne laufende
 * Erfassung ein ruhiges Karten-Band mit Einstempeln-Button.
 */
export const TimerBand = ({ employeeId, openEntry }: Props) => {
  const t = useTranslations("TimeTracking");

  if (!openEntry) {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-card border bg-card px-6 py-[18px] shadow-card">
        <span className="text-[13.5px] text-muted-foreground">
          {t("noRunningEntry")}
        </span>
        <div className="ml-auto">
          <ClockButton employeeId={employeeId} isRunning={false} />
        </div>
      </div>
    );
  }

  const startTime = new Date(openEntry.startedAt)
    .toISOString()
    .substring(11, 16);

  return (
    <div className="flex flex-wrap items-center gap-[18px] rounded-card bg-timer px-6 py-[18px] text-timer-foreground">
      <span>
        <span className="block text-[12.5px] opacity-75">
          {t("clockRunningSince", { time: startTime })}
        </span>
        <ElapsedSince
          startIso={openEntry.startedAt}
          className="font-mono text-[28px] font-bold leading-tight tracking-[-0.02em] tabular-nums"
        />
      </span>
      <span className="flex items-center gap-2 rounded-full bg-timer-foreground/15 px-[15px] py-[7px] text-[13px] font-medium">
        <span className="size-2 rounded-full bg-gold" aria-hidden />
        {openEntry.notes || t("clock")}
      </span>
      <ClockButton
        employeeId={employeeId}
        isRunning
        appearance="timer"
        className="ml-auto"
      />
    </div>
  );
};
