"use client";

import { useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

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

/** Merge overlapping/adjacent windows and sort by start. */
function normalize(windows: TimeWindow[]): TimeWindow[] {
  const sorted = [...windows]
    .filter((w) => toMin(w.end) > toMin(w.start))
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  const out: TimeWindow[] = [];
  for (const w of sorted) {
    const last = out[out.length - 1];
    if (last && toMin(w.start) <= toMin(last.end)) {
      if (toMin(w.end) > toMin(last.end)) last.end = w.end;
    } else {
      out.push({ ...w });
    }
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
 * Drag-based weekly working-time grid (design handoff `.sched`). Drag on an
 * empty row to create a window, drag a window to move it, × to remove. Times
 * snap to 15 min and are clamped to 07:00–18:00. Persists concrete time windows
 * per weekday (WeekdayTimeWindows) which the backend work-time engine turns
 * into daily planned minutes.
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

  const dayWindows = (key: keyof WeekdayTimeWindows): TimeWindow[] =>
    (value[key] as TimeWindow[] | undefined) ?? [];

  const setDayWindows = (
    key: keyof WeekdayTimeWindows,
    windows: TimeWindow[],
  ) => {
    const next: WeekdayTimeWindows = { ...value };
    const normalized = normalize(windows);
    if (normalized.length) next[key] = normalized;
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
        setDayWindows(key, [
          ...dayWindows(key),
          { start: fmt(start), end: fmt(end) },
        ]);
      }
    } else {
      const windows = dayWindows(key).map((w, i) =>
        i === drag.index
          ? { start: fmt(drag.curStart), end: fmt(drag.curEnd) }
          : w,
      );
      setDayWindows(key, windows);
    }
    setDrag(null);
  };

  const removeWindow = (key: keyof WeekdayTimeWindows, index: number) => {
    setDayWindows(
      key,
      dayWindows(key).filter((_, i) => i !== index),
    );
  };

  const totalMin = DAYS.reduce(
    (sum, d) => sum + dayWindows(d.key).reduce((s, w) => s + durationMin(w), 0),
    0,
  );
  const totalHours = totalMin / 60;
  const diff = totalHours - targetWeeklyHours;

  const hourTicks = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i);

  return (
    <div className="flex flex-col gap-3">
      {/* Hour axis */}
      <div className="flex pl-10 pr-8 text-[10px] text-muted-foreground">
        {hourTicks.map((h) => (
          <span key={h} className="flex-1 text-left">
            {String(h).padStart(2, "0")}
          </span>
        ))}
      </div>

      {DAYS.map((d) => {
        const windows = dayWindows(d.key);
        const dayMin = windows.reduce((s, w) => s + durationMin(w), 0);
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
              {windows.map((w, i) => {
                const isMoving = drag?.day === d.key && drag.mode === "move" && drag.index === i;
                const start = isMoving ? drag.curStart : toMin(w.start);
                const end = isMoving ? drag.curEnd : toMin(w.end);
                return (
                  <div
                    key={i}
                    onPointerDown={(e) => onSegmentPointerDown(e, d.key, i)}
                    className="absolute top-1 flex h-7 cursor-grab items-center justify-between gap-1 rounded bg-primary px-1.5 text-[10px] font-medium text-primary-foreground"
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
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {dayMin > 0 ? `${(dayMin / 60).toFixed(1)} h` : "—"}
            </span>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2 pl-10 text-xs text-muted-foreground">
        <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
          {t("hoursTracked", { hours: totalHours.toFixed(1) })}
        </span>
        {workloadPercent > 0 && (
          <span>
            {t("targetWeeklyHours", {
              hours: targetWeeklyHours.toFixed(1),
            })}
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
