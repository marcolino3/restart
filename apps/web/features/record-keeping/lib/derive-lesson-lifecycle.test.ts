import { describe, it, expect } from "vitest";
import { deriveLessonLifecycles } from "./derive-lesson-lifecycle";
import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";

const record = (
  overrides: Partial<StudentLessonRecordItem> &
    Pick<StudentLessonRecordItem, "id" | "recordedAt" | "status">,
): StudentLessonRecordItem => ({
  lessonId: "lesson-1",
  ...overrides,
});

describe("deriveLessonLifecycles", () => {
  it("computes day deltas from full ISO timestamps with time-of-day", () => {
    // recordedAt now carries a time component (timestamptz), not just a
    // bare YYYY-MM-DD date — this must not turn the deltas into NaN.
    const records: StudentLessonRecordItem[] = [
      record({
        id: "r1",
        recordedAt: "2026-05-16T09:15:00.000Z",
        status: "INTRODUCED",
      }),
      record({
        id: "r2",
        recordedAt: "2026-05-18T21:45:00.000Z",
        status: "PRACTICED",
      }),
      record({
        id: "r3",
        recordedAt: "2026-05-20T00:05:00.000Z",
        status: "MASTERED",
      }),
    ];

    const [lifecycle] = deriveLessonLifecycles(records, "de");

    expect(lifecycle.daysIntroToPracticed).toBe(2);
    expect(lifecycle.daysPracticedToMastered).toBe(2);
    expect(lifecycle.daysIntroToMastered).toBe(4);
    expect(lifecycle.daysIntroToPracticed).not.toBeNaN();
  });

  it("still works with bare date-only recordedAt strings", () => {
    const records: StudentLessonRecordItem[] = [
      record({ id: "r1", recordedAt: "2026-05-16", status: "INTRODUCED" }),
      record({ id: "r2", recordedAt: "2026-05-19", status: "MASTERED" }),
    ];

    const [lifecycle] = deriveLessonLifecycles(records, "de");

    expect(lifecycle.daysIntroToMastered).toBe(3);
  });

  it("treats same-day records with different times as zero days apart", () => {
    const records: StudentLessonRecordItem[] = [
      record({
        id: "r1",
        recordedAt: "2026-05-16T08:00:00.000Z",
        status: "INTRODUCED",
      }),
      record({
        id: "r2",
        recordedAt: "2026-05-16T17:00:00.000Z",
        status: "PRACTICED",
      }),
    ];

    const [lifecycle] = deriveLessonLifecycles(records, "de");

    expect(lifecycle.daysIntroToPracticed).toBe(0);
  });
});
