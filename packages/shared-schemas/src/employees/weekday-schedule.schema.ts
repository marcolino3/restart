import { z } from "zod";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const TimeWindowSchema = z.object({
  start: z.string().regex(HHMM),
  end: z.string().regex(HHMM),
});
export type TimeWindow = z.infer<typeof TimeWindowSchema>;

export const WEEKDAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export const WeekdayTimeWindowsSchema = z.object({
  mon: z.array(TimeWindowSchema).optional(),
  tue: z.array(TimeWindowSchema).optional(),
  wed: z.array(TimeWindowSchema).optional(),
  thu: z.array(TimeWindowSchema).optional(),
  fri: z.array(TimeWindowSchema).optional(),
  sat: z.array(TimeWindowSchema).optional(),
  sun: z.array(TimeWindowSchema).optional(),
});
export type WeekdayTimeWindows = z.infer<typeof WeekdayTimeWindowsSchema>;

export const WeekdayWorkloadsSchema = z.object({
  mon: z.number().min(0).max(100).nullable().optional(),
  tue: z.number().min(0).max(100).nullable().optional(),
  wed: z.number().min(0).max(100).nullable().optional(),
  thu: z.number().min(0).max(100).nullable().optional(),
  fri: z.number().min(0).max(100).nullable().optional(),
  sat: z.number().min(0).max(100).nullable().optional(),
  sun: z.number().min(0).max(100).nullable().optional(),
});
export type WeekdayWorkloads = z.infer<typeof WeekdayWorkloadsSchema>;
