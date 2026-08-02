import { describe, it, expect } from "vitest";
import {
  derivePersistenceOverTime,
  deriveSelfAssessmentCalibration,
} from "./derive-observation-metrics";
import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";

const record = (
  overrides: Partial<StudentLessonRecordItem> &
    Pick<StudentLessonRecordItem, "id" | "recordedAt" | "status">,
): StudentLessonRecordItem => ({
  lessonId: "lesson-1",
  ...overrides,
});

describe("derivePersistenceOverTime", () => {
  it("buckets full ISO timestamps into a real week, not 'Invalid Date'", () => {
    const records: StudentLessonRecordItem[] = [
      record({
        id: "r1",
        recordedAt: "2026-05-18T09:15:00.000Z",
        status: "PRACTICED",
        persistence: "PERSISTS",
      }),
      record({
        id: "r2",
        recordedAt: "2026-05-19T21:45:00.000Z",
        status: "PRACTICED",
        persistence: "SEEKS_HELP",
      }),
    ];

    const result = derivePersistenceOverTime(records);

    expect(result.hasData).toBe(true);
    expect(result.buckets).toHaveLength(1);
    expect(result.buckets[0].weekStart).not.toBe("Invalid Date");
    expect(result.buckets[0].persists).toBe(1);
    expect(result.buckets[0].seeksHelp).toBe(1);
  });
});

describe("deriveSelfAssessmentCalibration", () => {
  it("finds a followup within 60 days when recordedAt carries a time-of-day", () => {
    const records: StudentLessonRecordItem[] = [
      record({
        id: "r1",
        recordedAt: "2026-01-01T08:00:00.000Z",
        status: "INTRODUCED",
        selfAssessment: "UNDERSTOOD",
        selfAssessmentByChild: true,
      }),
      record({
        id: "r2",
        recordedAt: "2026-01-20T18:30:00.000Z",
        status: "MASTERED",
      }),
    ];

    const result = deriveSelfAssessmentCalibration(records);

    expect(result.evaluated).toBe(1);
  });
});
