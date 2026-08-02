import { describe, expect, it } from "vitest";
import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import {
  deriveLessonLifecycles,
  deriveLifecycleAggregates,
} from "./derive-lesson-lifecycle";

const rec = (
  over: Partial<StudentLessonRecordItem>,
): StudentLessonRecordItem => ({
  id: "r1",
  lessonId: "les-1",
  recordedAt: "2026-01-01",
  status: "INTRODUCED",
  lesson: {
    id: "les-1",
    position: 0,
    translations: [{ locale: "DE", name: "Perlenmaterial" }],
    ancestors: [
      {
        id: "area-1",
        nodeType: "AREA",
        position: 0,
        translations: [{ locale: "DE", name: "Mathematik" }],
      },
    ],
  },
  ...over,
});

describe("deriveLessonLifecycles", () => {
  it("groups records by lesson and picks the latest as currentStatus", () => {
    const lifecycles = deriveLessonLifecycles(
      [
        rec({ id: "r1", recordedAt: "2026-01-01", status: "INTRODUCED" }),
        rec({ id: "r2", recordedAt: "2026-02-01", status: "PRACTICED" }),
      ],
      "de",
    );
    expect(lifecycles).toHaveLength(1);
    expect(lifecycles[0].currentStatus).toBe("PRACTICED");
    expect(lifecycles[0].currentStatusAt).toBe("2026-02-01");
    expect(lifecycles[0].history).toHaveLength(2);
  });

  it("keeps the earliest date of each progression status even if re-recorded", () => {
    const lifecycles = deriveLessonLifecycles(
      [
        rec({ id: "r1", recordedAt: "2026-01-01", status: "INTRODUCED" }),
        rec({ id: "r2", recordedAt: "2026-03-01", status: "INTRODUCED" }),
        rec({ id: "r3", recordedAt: "2026-04-01", status: "PRACTICED" }),
      ],
      "de",
    );
    expect(lifecycles[0].introducedAt).toBe("2026-01-01");
    expect(lifecycles[0].practicedAt).toBe("2026-04-01");
  });

  it("flags needsMore only when NEEDS_MORE is the latest record", () => {
    const stillNeedsMore = deriveLessonLifecycles(
      [
        rec({ id: "r1", recordedAt: "2026-01-01", status: "INTRODUCED" }),
        rec({ id: "r2", recordedAt: "2026-02-01", status: "NEEDS_MORE" }),
      ],
      "de",
    );
    expect(stillNeedsMore[0].needsMore).toBe(true);
    expect(stillNeedsMore[0].lastNeedsMoreAt).toBe("2026-02-01");

    const resolved = deriveLessonLifecycles(
      [
        rec({ id: "r1", recordedAt: "2026-01-01", status: "NEEDS_MORE" }),
        rec({ id: "r2", recordedAt: "2026-02-01", status: "PRACTICED" }),
      ],
      "de",
    );
    expect(resolved[0].needsMore).toBe(false);
    expect(resolved[0].lastNeedsMoreAt).toBe("2026-01-01");
  });

  it("computes day deltas between milestones", () => {
    const lifecycles = deriveLessonLifecycles(
      [
        rec({ id: "r1", recordedAt: "2026-01-01", status: "INTRODUCED" }),
        rec({ id: "r2", recordedAt: "2026-01-11", status: "PRACTICED" }),
        rec({ id: "r3", recordedAt: "2026-01-21", status: "MASTERED" }),
      ],
      "de",
    );
    expect(lifecycles[0].daysIntroToPracticed).toBe(10);
    expect(lifecycles[0].daysPracticedToMastered).toBe(10);
    expect(lifecycles[0].daysIntroToMastered).toBe(20);
  });

  it("leaves day deltas null when a milestone hasn't been reached", () => {
    const lifecycles = deriveLessonLifecycles(
      [rec({ id: "r1", recordedAt: "2026-01-01", status: "INTRODUCED" })],
      "de",
    );
    expect(lifecycles[0].daysIntroToPracticed).toBeNull();
    expect(lifecycles[0].daysPracticedToMastered).toBeNull();
  });

  it("resolves lesson/area/topic/group names via translations for the given locale", () => {
    const lifecycles = deriveLessonLifecycles(
      [
        rec({
          id: "r1",
          lesson: {
            id: "les-1",
            position: 0,
            translations: [
              { locale: "DE", name: "Perlenmaterial" },
              { locale: "EN", name: "Bead Material" },
            ],
            ancestors: [
              {
                id: "area-1",
                nodeType: "AREA",
                position: 0,
                translations: [{ locale: "EN", name: "Math" }],
              },
            ],
          },
        }),
      ],
      "en",
    );
    expect(lifecycles[0].lessonName).toBe("Bead Material");
    expect(lifecycles[0].areaName).toBe("Math");
  });

  it("keeps separate lifecycles for records of different lessons", () => {
    const lifecycles = deriveLessonLifecycles(
      [
        rec({ id: "r1", lessonId: "les-1" }),
        rec({ id: "r2", lessonId: "les-2" }),
      ],
      "de",
    );
    expect(lifecycles).toHaveLength(2);
  });
});

describe("deriveLifecycleAggregates", () => {
  it("counts lessons by current status and needsMore", () => {
    const lifecycles = deriveLessonLifecycles(
      [
        rec({ id: "r1", lessonId: "les-1", status: "MASTERED" }),
        rec({ id: "r2", lessonId: "les-2", status: "PRACTICED" }),
        rec({ id: "r3", lessonId: "les-3", status: "INTRODUCED" }),
        rec({ id: "r4", lessonId: "les-4", status: "NEEDS_MORE" }),
      ],
      "de",
    );
    const agg = deriveLifecycleAggregates(lifecycles);
    expect(agg.trackedCount).toBe(4);
    expect(agg.masteredCount).toBe(1);
    expect(agg.practicedCount).toBe(1);
    expect(agg.introducedCount).toBe(1);
    expect(agg.needsMoreCount).toBe(1);
  });

  it("finds the fastest and slowest mastery among lessons that reached MASTERED", () => {
    const lifecycles = deriveLessonLifecycles(
      [
        rec({ id: "r1", lessonId: "les-fast", recordedAt: "2026-01-01", status: "INTRODUCED" }),
        rec({ id: "r2", lessonId: "les-fast", recordedAt: "2026-01-05", status: "MASTERED" }),
        rec({ id: "r3", lessonId: "les-slow", recordedAt: "2026-01-01", status: "INTRODUCED" }),
        rec({ id: "r4", lessonId: "les-slow", recordedAt: "2026-03-01", status: "MASTERED" }),
      ],
      "de",
    );
    const agg = deriveLifecycleAggregates(lifecycles);
    expect(agg.fastestMastery?.days).toBe(4);
    expect(agg.slowestMastery?.days).toBe(59);
  });

  it("returns null aggregates and empty averages for an empty lifecycle list", () => {
    const agg = deriveLifecycleAggregates([]);
    expect(agg.trackedCount).toBe(0);
    expect(agg.avgDaysIntroToPracticed).toBeNull();
    expect(agg.fastestMastery).toBeNull();
    expect(agg.slowestMastery).toBeNull();
  });
});
