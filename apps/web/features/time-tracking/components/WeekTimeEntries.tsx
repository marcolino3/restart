"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useSheet } from "@/components/providers/sheet-provider";
import { formatDurationMinutes } from "@/lib/formatting/duration";
import { TimeEntryForm } from "./TimeEntryForm";
import type { TimeEntry } from "../types";

interface Props {
  employeeId: string;
  entries: TimeEntry[];
}

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const timeStr = (iso?: string | null) =>
  iso ? new Date(iso).toISOString().substring(11, 16) : "–";

/**
 * Farbcodierung der Blöcke (Design-Handoff `.te`): mangels Kategorie-Daten
 * deterministisch nach Quelle — Stempeluhr grün, manuelle Einträge sky.
 */
const sourceColor: Record<TimeEntry["source"], string> = {
  CLOCK:
    "border-status-green-foreground bg-status-green text-status-green-foreground",
  MANUAL:
    "border-status-sky-foreground bg-status-sky text-status-sky-foreground",
};

/**
 * Wochen-Spalten-Ansicht aus dem Design-Handoff (`.week`/`.day`): Mo–Fr der
 * aktuellen Woche, Einträge als farbcodierte Blöcke, Tagessumme in Mono,
 * heutiger Tag hervorgehoben, "+ Eintrag" pro Tag öffnet den bestehenden
 * Eintrag-Dialog.
 */
export const WeekTimeEntries = ({ employeeId, entries }: Props) => {
  const t = useTranslations("TimeTracking");
  const locale = useLocale();
  const { open } = useSheet();

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const todayKey = dateKey(today);

  const byDay = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    const list = byDay.get(e.entryDate) ?? [];
    list.push(e);
    byDay.set(e.entryDate, list);
  }

  const openForm = (entry?: TimeEntry, defaultDate?: Date) =>
    open({
      title: entry ? t("editEntry") : t("addEntry"),
      content: (
        <TimeEntryForm
          employeeId={employeeId}
          entry={entry}
          defaultDate={defaultDate}
        />
      ),
      side: "right",
    });

  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
      {days.map((day) => {
        const key = dateKey(day);
        const isToday = key === todayKey;
        const dayEntries = (byDay.get(key) ?? [])
          .slice()
          .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
        const sumMinutes = dayEntries.reduce((acc, e) => {
          if (e.workMinutes != null) return acc + e.workMinutes;
          if (!e.endedAt) {
            return (
              acc +
              Math.max(
                0,
                Math.floor((Date.now() - new Date(e.startedAt).getTime()) / 60000)
              )
            );
          }
          return acc;
        }, 0);

        return (
          <div
            key={key}
            className={cn(
              "flex min-h-[250px] flex-col gap-2 rounded-card border bg-card p-[13px] shadow-xs",
              isToday && "border-primary ring-1 ring-primary"
            )}
          >
            <div className="flex items-baseline gap-1.5 px-[3px] pb-[3px]">
              <span className="text-[13.5px] font-[650] capitalize">
                {weekdayFmt.format(day)}
              </span>
              <span className="text-[11.5px] text-muted-foreground">
                {isToday ? t("today") : dateFmt.format(day)}
              </span>
              <span
                suppressHydrationWarning
                className="ml-auto font-mono text-[11.5px] font-semibold tabular-nums text-muted-foreground"
              >
                {sumMinutes > 0 ? formatDurationMinutes(sumMinutes) : "–"}
              </span>
            </div>
            {dayEntries.map((e) => {
              const isOpen = !e.endedAt;
              const label =
                e.notes || (e.source === "CLOCK" ? t("clock") : t("manual"));
              const times = isOpen
                ? `${timeStr(e.startedAt)} – ${t("running")}`
                : `${timeStr(e.startedAt)} – ${timeStr(e.endedAt)}${
                    e.workMinutes != null
                      ? ` · ${formatDurationMinutes(e.workMinutes)}`
                      : ""
                  }`;
              const inner = (
                <>
                  <span className="block truncate text-[12.5px] font-semibold">
                    {label}
                    {isOpen && (
                      <span className="ml-1" aria-hidden>
                        ●
                      </span>
                    )}
                  </span>
                  <span className="block font-mono text-[10.5px] tabular-nums opacity-75">
                    {times}
                  </span>
                </>
              );
              // Laufende Einträge sind nicht editierbar → kein Klick-Ziel.
              return isOpen ? (
                <div
                  key={e.id}
                  className={cn(
                    "rounded-md border-l-[3.5px] px-[11px] py-2",
                    sourceColor[e.source]
                  )}
                  title={t("openEntryNotEditable")}
                >
                  {inner}
                </div>
              ) : (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => openForm(e)}
                  className={cn(
                    "rounded-md border-l-[3.5px] px-[11px] py-2 text-left transition-opacity hover:opacity-85",
                    sourceColor[e.source]
                  )}
                >
                  {inner}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => openForm(undefined, day)}
              className="mt-auto rounded-md border-[1.5px] border-dashed p-[7px] text-center text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {t("addEntryShort")}
            </button>
          </div>
        );
      })}
    </div>
  );
};
