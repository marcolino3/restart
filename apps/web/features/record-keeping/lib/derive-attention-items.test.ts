import { describe, expect, it } from "vitest";
import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import { deriveAttentionItems } from "./derive-attention-items";
import { deriveLessonLifecycles } from "./derive-lesson-lifecycle";

const today = new Date("2026-08-02T00:00:00Z");

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

describe("deriveAttentionItems — lesson lifecycle signals", () => {
  it("returns nothing for a lesson with no attention-worthy state", () => {
    const lifecycles = deriveLessonLifecycles(
      [rec({ id: "r1", status: "MASTERED" })],
      "de",
    );
    expect(deriveAttentionItems(lifecycles, undefined, today)).toEqual([]);
  });

  it("flags NEEDS_MORE_CURRENT with severity 1", () => {
    const lifecycles = deriveLessonLifecycles(
      [
        rec({ id: "r1", recordedAt: "2026-01-01", status: "INTRODUCED" }),
        rec({ id: "r2", recordedAt: "2026-07-20", status: "NEEDS_MORE" }),
      ],
      "de",
    );
    const items = deriveAttentionItems(lifecycles, undefined, today);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ reason: "NEEDS_MORE_CURRENT", severity: 1 });
  });

  it("flags REPEATED_NEEDS_MORE once NEEDS_MORE occurs twice and lesson isn't mastered", () => {
    const lifecycles = deriveLessonLifecycles(
      [
        rec({ id: "r1", recordedAt: "2026-01-01", status: "NEEDS_MORE" }),
        rec({ id: "r2", recordedAt: "2026-02-01", status: "NEEDS_MORE" }),
        rec({ id: "r3", recordedAt: "2026-03-01", status: "INTRODUCED" }),
      ],
      "de",
    );
    const items = deriveAttentionItems(lifecycles, undefined, today);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ reason: "REPEATED_NEEDS_MORE", severity: 2 });
  });

  it("sorts multiple lessons by severity ascending", () => {
    const lifecycles = deriveLessonLifecycles(
      [
        rec({
          id: "r1",
          lessonId: "les-practiced",
          recordedAt: "2026-01-01",
          status: "PRACTICED",
        }),
        rec({
          id: "r2",
          lessonId: "les-needs-more",
          recordedAt: "2026-07-20",
          status: "NEEDS_MORE",
        }),
      ],
      "de",
    );
    const items = deriveAttentionItems(lifecycles, undefined, today);
    expect(items.map((i) => i.reason)).toEqual([
      "NEEDS_MORE_CURRENT",
      "STUCK_PRACTICED",
    ]);
  });
});

describe("deriveAttentionItems — observation-driven signals", () => {
  const confidenceRecord = (
    id: string,
    recordedAt: string,
    selfConfidence: StudentLessonRecordItem["selfConfidence"],
  ) => rec({ id, recordedAt, selfConfidence, lessonId: `les-${id}` });

  it("flags LOW_CONFIDENCE once >=60% of the recent window is INSECURE with enough samples", () => {
    const records: StudentLessonRecordItem[] = Array.from(
      { length: 8 },
      (_, i) =>
        confidenceRecord(
          `c${i}`,
          `2026-07-${String(i + 1).padStart(2, "0")}`,
          i < 6 ? "INSECURE" : "CONFIDENT",
        ),
    );
    const items = deriveAttentionItems([], undefined, today, records);
    expect(items.some((i) => i.reason === "LOW_CONFIDENCE")).toBe(true);
  });

  it("does not flag LOW_CONFIDENCE below the minimum sample size", () => {
    const records: StudentLessonRecordItem[] = Array.from(
      { length: 3 },
      (_, i) => confidenceRecord(`c${i}`, `2026-07-0${i + 1}`, "INSECURE"),
    );
    const items = deriveAttentionItems([], undefined, today, records);
    expect(items.some((i) => i.reason === "LOW_CONFIDENCE")).toBe(false);
  });

  it("does not flag LOW_CONFIDENCE when the insecure ratio is below threshold", () => {
    const records: StudentLessonRecordItem[] = Array.from(
      { length: 10 },
      (_, i) =>
        confidenceRecord(
          `c${i}`,
          `2026-07-${String(i + 1).padStart(2, "0")}`,
          i < 3 ? "INSECURE" : "CONFIDENT",
        ),
    );
    const items = deriveAttentionItems([], undefined, today, records);
    expect(items.some((i) => i.reason === "LOW_CONFIDENCE")).toBe(false);
  });

  it("flags MATERIAL_TOO_HARD per area once >=50% of that area's difficulty samples are TOO_HARD", () => {
    const records: StudentLessonRecordItem[] = Array.from(
      { length: 8 },
      (_, i) =>
        rec({
          id: `d${i}`,
          lessonId: `les-d${i}`,
          recordedAt: `2026-07-${String(i + 1).padStart(2, "0")}`,
          difficulty: i < 5 ? "TOO_HARD" : "JUST_RIGHT",
        }),
    );
    const items = deriveAttentionItems([], undefined, today, records);
    expect(items.some((i) => i.reason === "MATERIAL_TOO_HARD")).toBe(true);
  });

  it("returns an empty attention list for an empty record stream", () => {
    expect(deriveAttentionItems([], undefined, today, [])).toEqual([]);
  });
});
