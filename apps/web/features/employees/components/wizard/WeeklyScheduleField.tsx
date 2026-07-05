"use client";

import { useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  TimeWindow,
  WeekdayTimeWindows,
} from "@restart/shared-schemas/employees/employee-onboarding-form.schema";

const START_H = 7;
const END_H = 18;
const SNAP = 15;
const SPAN = (END_H - START_H) * 60;
const FULLTIME_WEEKLY_HOURS = 42;

const DAYS: { key: keyof WeekdayTimeWindows; label: string }[] = [
  { key: "mon", label: "Mo" },
  { key: "tue", label: "Di" },
  { key: "wed", label: "Mi" },
  { key: "thu", label: "Do" },
  { key: "fri", label: "Fr" },
  { key: "sat", label: "Sa" },
  { key: "sun", label: "So" },
];

const clampMin = (m: number) =>
  Math.max(START_H * 60, Math.min(END_H * 60, m));
const snapMin = (m: number) => Math.round(m / SNAP) * SNAP;
const fmt = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const toMin = (t: string) => {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
};
const minToPct = (m: number) => ((m - START_H * 60) / SPAN) * 100;
const durationMin = (w: TimeWindow) => Math.max(0, toMin(w.end) - toMin(w.start));

/** Sort by start (no merge) — lets the user keep two separate windows per day. */
function sortWindows(windows: TimeWindow[]): TimeWindow[] {
  return [...windows].sort((a, b) => toMin(a.start) - toMin(b.start));
}

/** Sort + drop zero/negative-length windows (used when leaving an edit). */
function cleanWindows(windows: TimeWindow[]): TimeWindow[] {
  return sortWindows(windows).filter((w) => toMin(w.end) > toMin(w.start));
}

/** Breaks = the gaps between consecutive windows of a day. */
function breaksOf(windows: TimeWindow[]): { start: number; end: number }[] {
  const sorted = sortWindows(windows);
  const out: { start: number; end: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gapStart = toMin(sorted[i - 1].end);
    const gapEnd = toMin(sorted[i].start);
    if (gapEnd > gapStart) out.push({ start: gapStart, end: gapEnd });
  }
  return out;
}

type Drag =
  | {
      day: keyof WeekdayTimeWindows;
      mode: "create";
      startMin: number;
      curMin: number;
    }
  | {
      day: keyof WeekdayTimeWindows;
      mode: "move";
      index: number;
      grabMin: number;
      origStart: number;
      origEnd: number;
      curStart: number;
      curEnd: number;
    };

interface Props {
  name?: string;
}

/**
 * Weekly working-time grid (design handoff `.sched`). Create a window by
 * dragging on a row, move it by dragging, click it to adjust the exact times,
 * × to remove, and "+" to add a second window per day. The gap between two
 * windows is the (unpaid) break — it is not counted as work time. Persists
 * concrete time windows per weekday which the backend engine turns into daily
 * planned minutes.
 */
export function WeeklyScheduleField({ name = "weekdayTimeWindows" }: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const { control, watch } = useFormContext();
  const { field } = useController({ name, control });
  const value: WeekdayTimeWindows = field.value ?? {};

  const workloadPercent = Number(watch("workloadPercent")) || 0;
  const targetWeeklyHours = (workloadPercent / 100) * FULLTIME_WEEKLY_HOURS;

  const trackRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const [editing, setEditing] = useState<{
    day: keyof WeekdayTimeWindows;
    index: number;
  } | null>(null);

  const dayWindows = (key: keyof WeekdayTimeWindows): TimeWindow[] =>
    (value[key] as TimeWindow[] | undefined) ?? [];

  const writeDay = (
    key: keyof WeekdayTimeWindows,
    windows: TimeWindow[],
    clean: boolean,
  ) => {
    const next: WeekdayTimeWindows = { ...value };
    const result = clean ? cleanWindows(windows) : sortWindows(windows);
    if (result.length) next[key] = result;
    else delete next[key];
    field.onChange(next);
  };

  const xToMin = (clientX: number, key: keyof WeekdayTimeWindows) => {
    const el = trackRefs.current[key as string];
    if (!el) return START_H * 60;
    const rect = el.getBoundingClientRect();
    const pct = (clientX - rect.left) / rect.width;
    return clampMin(snapMin(START_H * 60 + pct * SPAN));
  };

  const onTrackPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    key: keyof WeekdayTimeWindows,
  ) => {
    if (e.button !== 0) return;
    setEditing(null);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const m = xToMin(e.clientX, key);
    setDrag({ day: key, mode: "create", startMin: m, curMin: m });
  };

  const onSegmentPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    key: keyof WeekdayTimeWindows,
    index: number,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const w = dayWindows(key)[index];
    const m = xToMin(e.clientX, key);
    setDrag({
      day: key,
      mode: "move",
      index,
      grabMin: m,
      origStart: toMin(w.start),
      origEnd: toMin(w.end),
      curStart: toMin(w.start),
      curEnd: toMin(w.end),
    });
  };

  const onPointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    key: keyof WeekdayTimeWindows,
  ) => {
    if (!drag || drag.day !== key) return;
    const m = xToMin(e.clientX, key);
    if (drag.mode === "create") {
      setDrag({ ...drag, curMin: m });
    } else {
      const delta = m - drag.grabMin;
      const len = drag.origEnd - drag.origStart;
      let start = clampMin(drag.origStart + delta);
      let end = start + len;
      if (end > END_H * 60) {
        end = END_H * 60;
        start = end - len;
      }
      setDrag({ ...drag, curStart: start, curEnd: end });
    }
  };

  const commitDrag = (key: keyof WeekdayTimeWindows) => {
    if (!drag || drag.day !== key) return;
    if (drag.mode === "create") {
      const start = Math.min(drag.startMin, drag.curMin);
      const end = Math.max(drag.startMin, drag.curMin);
      if (end - start >= SNAP) {
        writeDay(key, [...dayWindows(key), { start: fmt(start), end: fmt(end) }], true);
      }
    } else if (drag.curStart === drag.origStart && drag.curEnd === drag.origEnd) {
      // No movement → treat as a click: open the precise-time editor.
      setEditing({ day: key, index: drag.index });
    } else {
      const windows = dayWindows(key).map((w, i) =>
        i === drag.index
          ? { start: fmt(drag.curStart), end: fmt(drag.curEnd) }
          : w,
      );
      writeDay(key, windows, true);
    }
    setDrag(null);
  };

  const removeWindow = (key: keyof WeekdayTimeWindows, index: number) => {
    setEditing(null);
    writeDay(key, dayWindows(key).filter((_, i) => i !== index), true);
  };

  /** Add a window: first defaults to a morning block, then an afternoon
   *  block after a 1h break — so two-per-day (with break) is one click. */
  const addWindow = (key: keyof WeekdayTimeWindows) => {
    const existing = dayWindows(key);
    let candidate: TimeWindow;
    if (existing.length === 0) {
      candidate = { start: "08:00", end: "12:00" };
    } else {
      const lastEnd = Math.max(...existing.map((w) => toMin(w.end)));
      const start = clampMin(Math.min(lastEnd + 60, END_H * 60 - 120));
      candidate = { start: fmt(start), end: fmt(clampMin(start + 240)) };
    }
    writeDay(key, [...existing, candidate], true);
    setEditing({ day: key, index: existing.length });
  };

  /** Live edit of the exact start/end via the time inputs (no clean yet, so
   *  the user can type freely — cleaned when the editor closes). */
  const editTime = (
    key: keyof WeekdayTimeWindows,
    index: number,
    which: "start" | "end",
    val: string,
  ) => {
    if (!/^\d{2}:\d{2}$/.test(val)) return;
    const clamped = fmt(clampMin(toMin(val)));
    const windows = dayWindows(key).map((w, i) =>
      i === index ? { ...w, [which]: clamped } : w,
    );
    writeDay(key, windows, false);
  };

  const closeEditor = () => {
    if (editing) writeDay(editing.day, dayWindows(editing.day), true);
    setEditing(null);
  };

  const totalMin = DAYS.reduce(
    (sum, d) => sum + dayWindows(d.key).reduce((s, w) => s + durationMin(w), 0),
    0,
  );
  const totalHours = totalMin / 60;
  const diff = totalHours - targetWeeklyHours;
  const breakMin = DAYS.reduce(
    (sum, d) =>
      sum + breaksOf(dayWindows(d.key)).reduce((s, b) => s + (b.end - b.start), 0),
    0,
  );

  const hourTicks = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i);

  const editWindow =
    editing && dayWindows(editing.day)[editing.index]
      ? dayWindows(editing.day)[editing.index]
      : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Hour axis */}
      <div className="flex pl-10 pr-14 text-[10px] text-muted-foreground">
        {hourTicks.map((h) => (
          <span key={h} className="flex-1 text-left">
            {String(h).padStart(2, "0")}
          </span>
        ))}
      </div>

      {DAYS.map((d) => {
        const windows = dayWindows(d.key);
        const dayMin = windows.reduce((s, w) => s + durationMin(w), 0);
        const dayBreaks = breaksOf(windows);
        const preview =
          drag?.day === d.key && drag.mode === "create"
            ? {
                start: Math.min(drag.startMin, drag.curMin),
                end: Math.max(drag.startMin, drag.curMin),
              }
            : null;
        return (
          <div key={d.key} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-xs font-medium text-muted-foreground">
              {d.label}
            </span>
            <div
              ref={(el) => {
                trackRefs.current[d.key as string] = el;
              }}
              onPointerDown={(e) => onTrackPointerDown(e, d.key)}
              onPointerMove={(e) => onPointerMove(e, d.key)}
              onPointerUp={() => commitDrag(d.key)}
              className="relative h-9 flex-1 cursor-crosshair touch-none rounded-md border border-border bg-muted/40"
            >
              {/* hour gridlines */}
              {hourTicks.slice(1, -1).map((h) => (
                <span
                  key={h}
                  className="absolute top-0 h-full w-px bg-border/60"
                  style={{ left: `${minToPct(h * 60)}%` }}
                />
              ))}
              {/* break segments (gap between two windows) */}
              {dayBreaks.map((b, i) => (
                <div
                  key={`b${i}`}
                  className="pointer-events-none absolute top-1 flex h-7 items-center justify-center rounded bg-muted-foreground/15 text-[9px] text-muted-foreground"
                  style={{
                    left: `${minToPct(b.start)}%`,
                    width: `${minToPct(b.end) - minToPct(b.start)}%`,
                  }}
                >
                  {b.end - b.start >= 45 ? t("breakLabel") : ""}
                </div>
              ))}
              {windows.map((w, i) => {
                const isMoving =
                  drag?.day === d.key && drag.mode === "move" && drag.index === i;
                const isEditing =
                  editing?.day === d.key && editing.index === i;
                const start = isMoving ? drag.curStart : toMin(w.start);
                const end = isMoving ? drag.curEnd : toMin(w.end);
                return (
                  <div
                    key={i}
                    onPointerDown={(e) => onSegmentPointerDown(e, d.key, i)}
                    className={cn(
                      "absolute top-1 flex h-7 cursor-grab items-center justify-between gap-1 rounded bg-primary px-1.5 text-[10px] font-medium text-primary-foreground",
                      isEditing && "ring-2 ring-ring ring-offset-1",
                    )}
                    style={{
                      left: `${minToPct(start)}%`,
                      width: `${minToPct(end) - minToPct(start)}%`,
                    }}
                  >
                    <span className="truncate">
                      {fmt(start)}–{fmt(end)}
                    </span>
                    <button
                      type="button"
                      aria-label={t("removeWindow")}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => removeWindow(d.key, i)}
                      className="rounded-full p-0.5 hover:bg-primary-foreground/20"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
              {preview && preview.end > preview.start && (
                <div
                  className="pointer-events-none absolute top-1 h-7 rounded bg-primary/50"
                  style={{
                    left: `${minToPct(preview.start)}%`,
                    width: `${minToPct(preview.end) - minToPct(preview.start)}%`,
                  }}
                />
              )}
            </div>
            <button
              type="button"
              aria-label={t("addTime")}
              title={t("addTime")}
              onClick={() => addWindow(d.key)}
              className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {dayMin > 0 ? `${(dayMin / 60).toFixed(1)} h` : "—"}
            </span>
          </div>
        );
      })}

      {/* Precise time editor for the selected window */}
      {editing && editWindow && (
        <div className="ml-10 flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
          <span className="font-medium">
            {DAYS.find((d) => d.key === editing.day)?.label} · {t("editTime")}
          </span>
          <label className="flex items-center gap-1">
            {t("from")}
            <input
              type="time"
              step={SNAP * 60}
              value={editWindow.start}
              onChange={(e) => editTime(editing.day, editing.index, "start", e.target.value)}
              className="h-8 rounded-ctl border border-input bg-field px-2"
            />
          </label>
          <span>–</span>
          <label className="flex items-center gap-1">
            {t("to")}
            <input
              type="time"
              step={SNAP * 60}
              value={editWindow.end}
              onChange={(e) => editTime(editing.day, editing.index, "end", e.target.value)}
              className="h-8 rounded-ctl border border-input bg-field px-2"
            />
          </label>
          <button
            type="button"
            onClick={() => removeWindow(editing.day, editing.index)}
            className="ml-1 text-destructive hover:underline"
          >
            {t("removeWindow")}
          </button>
          <button
            type="button"
            onClick={closeEditor}
            className="ml-auto rounded-md bg-primary px-3 py-1 font-medium text-primary-foreground"
          >
            {t("done")}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pl-10 text-xs text-muted-foreground">
        <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
          {t("hoursTracked", { hours: totalHours.toFixed(1) })}
        </span>
        {breakMin > 0 && (
          <span>{t("breakTotal", { hours: (breakMin / 60).toFixed(1) })}</span>
        )}
        {workloadPercent > 0 && (
          <span>
            {t("targetWeeklyHours", { hours: targetWeeklyHours.toFixed(1) })}
            {" · "}
            {t("difference", {
              diff: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}`,
            })}
          </span>
        )}
      </div>
    </div>
  );
}
