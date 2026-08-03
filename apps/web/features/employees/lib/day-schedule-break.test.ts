import { describe, expect, it } from "vitest";
import {
  dayBreakMinutes,
  dayOuterSpan,
  rebuildDayWithBreak,
} from "./day-schedule-break";

describe("dayOuterSpan", () => {
  it("returns null for an empty day", () => {
    expect(dayOuterSpan([])).toBeNull();
  });

  it("spans from the first start to the last end", () => {
    expect(
      dayOuterSpan([
        { start: "08:00", end: "12:00" },
        { start: "13:00", end: "17:00" },
      ]),
    ).toEqual({ start: "08:00", end: "17:00" });
  });
});

describe("dayBreakMinutes", () => {
  it("sums gaps between consecutive windows", () => {
    expect(
      dayBreakMinutes([
        { start: "08:00", end: "12:00" },
        { start: "12:45", end: "17:00" },
      ]),
    ).toBe(45);
  });

  it("is zero for a single continuous window", () => {
    expect(dayBreakMinutes([{ start: "08:00", end: "17:00" }])).toBe(0);
  });
});

describe("rebuildDayWithBreak", () => {
  it("keeps a single window when the break is zero", () => {
    expect(rebuildDayWithBreak("08:00", "17:00", 0)).toEqual([
      { start: "08:00", end: "17:00" },
    ]);
  });

  it("places a 45-minute break at noon when the span covers it", () => {
    expect(rebuildDayWithBreak("08:00", "17:00", 45)).toEqual([
      { start: "08:00", end: "12:00" },
      { start: "12:45", end: "17:00" },
    ]);
  });

  it("yields 8h15 of work for a classic 08–17 day with a 45 min break", () => {
    const windows = rebuildDayWithBreak("08:00", "17:00", 45);
    const work = windows.reduce((sum, w) => {
      const [sh, sm] = w.start.split(":").map(Number);
      const [eh, em] = w.end.split(":").map(Number);
      return sum + (eh * 60 + em - (sh * 60 + sm));
    }, 0);
    expect(work).toBe(8 * 60 + 15);
  });

  it("centers the break when noon does not fit", () => {
    expect(rebuildDayWithBreak("14:00", "18:00", 30)).toEqual([
      { start: "14:00", end: "15:45" },
      { start: "16:15", end: "18:00" },
    ]);
  });

  it("falls back to a single window when the break fills the whole day", () => {
    expect(rebuildDayWithBreak("08:00", "09:00", 60)).toEqual([
      { start: "08:00", end: "09:00" },
    ]);
  });

  it("returns nothing for an inverted span", () => {
    expect(rebuildDayWithBreak("17:00", "08:00", 45)).toEqual([]);
  });
});
