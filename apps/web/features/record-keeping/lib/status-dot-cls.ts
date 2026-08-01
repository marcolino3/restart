import type { LessonRecordStatus } from "../types";

/** Shared status → dot-color map (bulk-entry status select + summary sidebar). */
export const STATUS_DOT_CLS: Record<LessonRecordStatus, string> = {
  PLANNING: "bg-slate-400",
  INTRODUCED: "bg-sky-500",
  PRACTICED: "bg-amber-500",
  MASTERED: "bg-emerald-500",
  NEEDS_MORE: "bg-rose-500",
};
