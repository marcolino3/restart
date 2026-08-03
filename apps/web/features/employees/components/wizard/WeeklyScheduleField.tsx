"use client";

import { useEffect, useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  TimeWindow,
  WeekdayTimeWindows,
} from "@restart/shared-schemas/employees/employee-onboarding-form.schema";
import {
  dayBreakMinutes,
  dayOuterSpan,
  rebuildDayWithBreak,
} from "../../lib/day-schedule-break";
import { parseFullTimeWeeklyHours } from "../../lib/workload-from-schedule";
import { isContractFieldVisible } from "@restart/shared-schemas/employees/contract-type-rules";

const START_H = 7;
const END_H = 18;
const SNAP = 15;
const SPAN = (END_H - START_H) * 60;
/** Suggested unpaid break when the user has not entered one yet. */
const DEFAULT_BREAK_MINUTES = 45;

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

/** Day currently open in the precise From/To/Break editor. */
type EditingDay = keyof WeekdayTimeWindows;

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
 * dragging on a row — a compact popup then asks for the unpaid break in
 * minutes. Click an existing window to adjust From / To / Break; × removes it,
 * "+" adds another. The break is stored as the gap between two windows, which
 * the backend engine already ignores when summing planned minutes.
 */
export function WeeklyScheduleField({ name = "weekdayTimeWindows" }: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const { control, watch } = useFormContext();
  const { field } = useController({ name, control });
  const value: WeekdayTimeWindows = field.value ?? {};

  // `weeklyHours` on the contract is the full-time reference (hours at 100 %).
  // Hourly-paid types have no pensum — skip the target/diff footer for them.
  const contractType = watch("contractType") as string | undefined;
  const showsWorkload = isContractFieldVisible(contractType, "workloadPercent");
  const workloadPercent = showsWorkload
    ? Number(watch("workloadPercent")) || 0
    : 0;
  const fullTimeWeeklyHours = parseFullTimeWeeklyHours(watch("weeklyHours"));
  const targetWeeklyHours = (workloadPercent / 100) * fullTimeWeeklyHours;

  const trackRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const breakInputRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [editingDay, setEditingDay] = useState<EditingDay | null>(null);
  /** Draft in the popup — empty until the user types, so the pause is deliberate. */
  const [breakDraft, setBreakDraft] = useState("");
  /** True when the popup opened right after drawing/adding a window. */
  const [breakRequired, setBreakRequired] = useState(false);

  const openDayEditor = (
    key: EditingDay,
    requireBreak: boolean,
    windowsOverride?: TimeWindow[],
  ) => {
    const windows = windowsOverride ?? dayWindows(key);
    const existing = dayBreakMinutes(windows);
    setEditingDay(key);
    setBreakRequired(requireBreak);
    // After a fresh draw the break is still 0 — leave the field empty so the
    // user has to enter a value (0 is allowed once typed). Re-opening an
    // existing day keeps the current break.
    setBreakDraft(requireBreak && existing === 0 ? "" : String(existing));
  };

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
    // Don't dismiss the break prompt by starting another drag on the same day.
    if (!(breakRequired && editingDay === key)) {
      setEditingDay(null);
      setBreakRequired(false);
    }
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
        const existing = dayWindows(key);
        const created: TimeWindow = {
          start: fmt(start),
          end: fmt(end),
        };
        if (existing.length === 0) {
          // First block of the day = outer span; ask for the unpaid break next.
          const next = [created];
          writeDay(key, next, true);
          openDayEditor(key, true, next);
        } else {
          const next = [...existing, created];
          writeDay(key, next, true);
          openDayEditor(key, false, next);
        }
      }
    } else if (drag.curStart === drag.origStart && drag.curEnd === drag.origEnd) {
      // No movement → treat as a click: open the day editor (From / To / Break).
      openDayEditor(key, false);
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
    const next = dayWindows(key).filter((_, i) => i !== index);
    if (next.length === 0) {
      setEditingDay(null);
      setBreakRequired(false);
    }
    writeDay(key, next, true);
  };

  /** Add a window: first defaults to a full day block, then prompts for break. */
  const addWindow = (key: keyof WeekdayTimeWindows) => {
    const existing = dayWindows(key);
    if (existing.length === 0) {
      const next: TimeWindow[] = [{ start: "08:00", end: "17:00" }];
      writeDay(key, next, true);
      openDayEditor(key, true, next);
      return;
    }
    const lastEnd = Math.max(...existing.map((w) => toMin(w.end)));
    const start = clampMin(Math.min(lastEnd + 60, END_H * 60 - 120));
    const next = [
      ...existing,
      { start: fmt(start), end: fmt(clampMin(start + 240)) },
    ];
    writeDay(key, next, true);
    openDayEditor(key, false, next);
  };

  /**
   * Day-level edit: outer From/To plus unpaid break in minutes. Rebuilt as one
   * or two windows so the engine keeps counting only work time.
   */
  const editDaySpan = (
    key: EditingDay,
    patch: { start?: string; end?: string; breakMinutes?: number },
  ) => {
    const windows = dayWindows(key);
    const span = dayOuterSpan(windows) ?? { start: "08:00", end: "17:00" };
    const start = patch.start ?? span.start;
    const end = patch.end ?? span.end;
    const breakMin =
      patch.breakMinutes !== undefined
        ? patch.breakMinutes
        : dayBreakMinutes(windows);
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return;
    writeDay(
      key,
      rebuildDayWithBreak(
        fmt(clampMin(toMin(start))),
        fmt(clampMin(toMin(end))),
        breakMin,
      ),
      true,
    );
  };

  const applyBreakDraft = (key: EditingDay) => {
    if (breakDraft === "") return false;
    const parsed = Number(breakDraft);
    if (!Number.isFinite(parsed) || parsed < 0) return false;
    editDaySpan(key, { breakMinutes: parsed });
    return true;
  };

  const confirmBreakPopup = () => {
    if (!editingDay) return;
    if (breakRequired && breakDraft === "") return;
    if (breakDraft === "") {
      writeDay(editingDay, dayWindows(editingDay), true);
    } else if (!applyBreakDraft(editingDay)) {
      return;
    }
    setEditingDay(null);
    setBreakRequired(false);
    setBreakDraft("");
  };

  const closeEditor = () => {
    // Closing without a break after a fresh draw is not allowed — keep the
    // popup open until the pause is entered (or the day is cleared).
    if (breakRequired && breakDraft === "") {
      breakInputRef.current?.focus();
      return;
    }
    if (editingDay && breakDraft !== "") {
      applyBreakDraft(editingDay);
    }
    setEditingDay(null);
    setBreakRequired(false);
    setBreakDraft("");
  };

  useEffect(() => {
    if (!editingDay) return;
    // Focus the pause field once the popup is mounted.
    const id = window.setTimeout(() => breakInputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [editingDay]);

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
        const isEditing = editingDay === d.key;
        const editingSpan = isEditing ? dayOuterSpan(windows) : null;
        const preview =
          drag?.day === d.key && drag.mode === "create"
            ? {
                start: Math.min(drag.startMin, drag.curMin),
                end: Math.max(drag.startMin, drag.curMin),
              }
            : null;
        return (
          <div key={d.key} className="relative flex flex-col gap-1">
            <div className="flex items-center gap-2">
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
                {hourTicks.slice(1, -1).map((h) => (
                  <span
                    key={h}
                    className="absolute top-0 h-full w-px bg-border/60"
                    style={{ left: `${minToPct(h * 60)}%` }}
                  />
                ))}
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
                    drag?.day === d.key &&
                    drag.mode === "move" &&
                    drag.index === i;
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

            {/* Compact break popup — opens right after drawing the first block */}
            {isEditing && editingSpan && (
              <div
                role="dialog"
                aria-label={t("breakPromptTitle")}
                className="z-20 ml-10 mr-14 rounded-md border border-border bg-popover p-3 text-xs shadow-md"
              >
                <p className="mb-2 font-medium text-foreground">
                  {breakRequired
                    ? t("breakPromptTitle")
                    : `${d.label} · ${t("editTime")}`}
                </p>
                {breakRequired && (
                  <p className="mb-2 text-muted-foreground">
                    {t("breakPromptHint", {
                      from: editingSpan.start,
                      to: editingSpan.end,
                    })}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {!breakRequired && (
                    <>
                      <label className="flex items-center gap-1">
                        {t("from")}
                        <input
                          type="time"
                          step={SNAP * 60}
                          value={editingSpan.start}
                          onChange={(e) =>
                            editDaySpan(d.key, { start: e.target.value })
                          }
                          className="h-8 rounded-ctl border border-input bg-field px-2"
                        />
                      </label>
                      <span>–</span>
                      <label className="flex items-center gap-1">
                        {t("to")}
                        <input
                          type="time"
                          step={SNAP * 60}
                          value={editingSpan.end}
                          onChange={(e) =>
                            editDaySpan(d.key, { end: e.target.value })
                          }
                          className="h-8 rounded-ctl border border-input bg-field px-2"
                        />
                      </label>
                    </>
                  )}
                  <label className="flex items-center gap-1 font-medium">
                    {t("breakMinutes")}
                    <input
                      ref={breakInputRef}
                      type="number"
                      min={0}
                      max={240}
                      step={5}
                      required={breakRequired}
                      placeholder={String(DEFAULT_BREAK_MINUTES)}
                      value={breakDraft}
                      onChange={(e) => setBreakDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          confirmBreakPopup();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          closeEditor();
                        }
                      }}
                      className="h-8 w-20 rounded-ctl border border-input bg-field px-2 tabular-nums"
                    />
                    <span className="font-normal text-muted-foreground">
                      {t("minutesSuffix")}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      writeDay(d.key, [], true);
                      setEditingDay(null);
                      setBreakRequired(false);
                      setBreakDraft("");
                    }}
                    className="text-destructive hover:underline"
                  >
                    {t("clearDay")}
                  </button>
                  <button
                    type="button"
                    onClick={confirmBreakPopup}
                    disabled={breakRequired && breakDraft === ""}
                    className="ml-auto rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {t("done")}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

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
