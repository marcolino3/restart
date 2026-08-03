import { describe, expect, it } from "vitest";
import {
  DEFAULT_FULLTIME_WEEKLY_HOURS,
  deriveWorkloadPercent,
  matchesDerivedWorkload,
  parseFullTimeWeeklyHours,
  scheduleWeeklyMinutes,
} from "./workload-from-schedule";

describe("scheduleWeeklyMinutes", () => {
  it("sums all windows across the week", () => {
    expect(
      scheduleWeeklyMinutes({
        mon: [
          { start: "08:00", end: "12:00" },
          { start: "13:00", end: "17:30" },
        ],
        wed: [{ start: "08:00", end: "12:30" }],
      }),
    ).toBe(240 + 270 + 270);
  });

  it("returns 0 for an empty or missing plan", () => {
    expect(scheduleWeeklyMinutes(null)).toBe(0);
    expect(scheduleWeeklyMinutes({})).toBe(0);
  });

  it("ignores reversed windows", () => {
    expect(scheduleWeeklyMinutes({ mon: [{ start: "12:00", end: "08:00" }] })).toBe(0);
  });
});

describe("deriveWorkloadPercent", () => {
  it("derives 100% from a full-time plan", () => {
    const plan = {
      mon: [{ start: "08:00", end: "16:24" }],
      tue: [{ start: "08:00", end: "16:24" }],
      wed: [{ start: "08:00", end: "16:24" }],
      thu: [{ start: "08:00", end: "16:24" }],
      fri: [{ start: "08:00", end: "16:24" }],
    };
    expect(deriveWorkloadPercent(plan, 42)).toBe(100);
  });

  it("derives a decimal workload", () => {
    // 22 h 20 min of 42 h → 53.17 % → 53.2 %
    const plan = {
      mon: [{ start: "08:00", end: "16:00" }],
      tue: [{ start: "08:00", end: "16:00" }],
      wed: [{ start: "08:00", end: "14:20" }],
    };
    expect(deriveWorkloadPercent(plan, 42)).toBe(53.2);
  });

  it("respects a different full-time reference", () => {
    const plan = { mon: [{ start: "08:00", end: "16:00" }] };
    expect(deriveWorkloadPercent(plan, 40)).toBe(20);
    expect(deriveWorkloadPercent(plan, 20)).toBe(40);
  });

  it("returns null for an empty plan rather than 0%", () => {
    expect(deriveWorkloadPercent({}, 42)).toBeNull();
    expect(deriveWorkloadPercent(null, 42)).toBeNull();
  });

  it("caps at 100% when the plan exceeds full time", () => {
    const plan = {
      mon: [{ start: "07:00", end: "18:00" }],
      tue: [{ start: "07:00", end: "18:00" }],
      wed: [{ start: "07:00", end: "18:00" }],
      thu: [{ start: "07:00", end: "18:00" }],
      fri: [{ start: "07:00", end: "18:00" }],
    };
    expect(deriveWorkloadPercent(plan, 42)).toBe(100);
  });
});

describe("parseFullTimeWeeklyHours", () => {
  it("falls back to the default for empty or invalid input", () => {
    for (const value of ["", null, undefined, "abc", 0, -5]) {
      expect(parseFullTimeWeeklyHours(value)).toBe(DEFAULT_FULLTIME_WEEKLY_HOURS);
    }
  });

  it("accepts numeric strings", () => {
    expect(parseFullTimeWeeklyHours("40")).toBe(40);
    expect(parseFullTimeWeeklyHours("41.5")).toBe(41.5);
  });
});

describe("matchesDerivedWorkload", () => {
  it("treats a missing stored value as still following the plan", () => {
    expect(matchesDerivedWorkload(null, 50)).toBe(true);
    expect(matchesDerivedWorkload(undefined, 50)).toBe(true);
  });

  it("detects a manual deviation", () => {
    expect(matchesDerivedWorkload(60, 50)).toBe(false);
    expect(matchesDerivedWorkload(50, 50)).toBe(true);
  });

  it("never follows a plan that does not exist", () => {
    expect(matchesDerivedWorkload(50, null)).toBe(false);
  });
});
