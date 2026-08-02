import { describe, expect, it } from "vitest";

import { lessonRecordsBulkSchema } from "./lesson-records-bulk.schema";

const base = {
  lessonId: "11111111-1111-4111-8111-111111111111",
  studentIds: ["22222222-2222-4222-8222-222222222222"],
  status: "INTRODUCED",
};

describe("lessonRecordsBulkSchema — recordedAt", () => {
  it("accepts a Date coming from the calendar field", () => {
    const recordedAt = new Date("2026-05-16T10:30:00.000Z");
    const parsed = lessonRecordsBulkSchema.parse({ ...base, recordedAt });
    expect(parsed.recordedAt).toEqual(recordedAt);
  });

  it("accepts a full ISO timestamp", () => {
    const parsed = lessonRecordsBulkSchema.parse({
      ...base,
      recordedAt: "2026-05-16T10:30:00.000Z",
    });
    expect(parsed.recordedAt).toBe("2026-05-16T10:30:00.000Z");
  });

  it("rejects a date-only string", () => {
    // Regression: "2026-05-16" parses as midnight UTC, which renders as 02:00
    // in Zurich and silently replaced the time the teacher had picked.
    const result = lessonRecordsBulkSchema.safeParse({
      ...base,
      recordedAt: "2026-05-16",
    });
    expect(result.success).toBe(false);
  });

  it("keeps the picked local time when converted for the mutation", () => {
    // What the submit handler does: Date -> ISO. 10:30 local must not become
    // midnight; the instant has to survive the round trip.
    const picked = new Date(2026, 4, 16, 10, 30, 0, 0);
    const iso = new Date(
      lessonRecordsBulkSchema.parse({ ...base, recordedAt: picked }).recordedAt,
    ).toISOString();

    const backToLocal = new Date(iso);
    expect(backToLocal.getHours()).toBe(10);
    expect(backToLocal.getMinutes()).toBe(30);
  });
});
