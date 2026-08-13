import { describe, expect, it } from "vitest";

import { ReportSickLeaveFormSchema } from "./schemas/report-sick-leave-form.schema";

describe("ReportSickLeaveFormSchema", () => {
  it("defaults to a whole-day report for today", () => {
    const parsed = ReportSickLeaveFormSchema.parse({});

    expect(parsed.hasStartTime).toBe(false);
    expect(parsed.startTime).toBe("");
    expect(parsed.comment).toBe("");
    expect(parsed.date).toBeInstanceOf(Date);
  });

  it("accepts a whole-day report without a time", () => {
    const result = ReportSickLeaveFormSchema.safeParse({
      date: new Date(2026, 2, 2),
      hasStartTime: false,
      startTime: "",
      comment: "",
    });

    expect(result.success).toBe(true);
  });

  it("ignores a leftover time while the toggle is off", () => {
    // The form keeps the previously typed value in state; with the toggle off
    // it must not block submission.
    const result = ReportSickLeaveFormSchema.safeParse({
      date: new Date(2026, 2, 2),
      hasStartTime: false,
      startTime: "not-a-time",
      comment: "",
    });

    expect(result.success).toBe(true);
  });

  it("requires a valid time once the toggle is on", () => {
    const result = ReportSickLeaveFormSchema.safeParse({
      date: new Date(2026, 2, 2),
      hasStartTime: true,
      startTime: "",
      comment: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["startTime"]);
      expect(result.error.issues[0].message).toBe("invalidTime");
    }
  });

  it.each(["13:00", "00:00", "23:59", "09:05"])(
    "accepts the valid time %s",
    (startTime) => {
      const result = ReportSickLeaveFormSchema.safeParse({
        date: new Date(2026, 2, 2),
        hasStartTime: true,
        startTime,
        comment: "",
      });

      expect(result.success).toBe(true);
    },
  );

  it.each(["24:00", "23:60", "9:05", "1300", "13:0", "13:00:00", "ab 13:00"])(
    "rejects the malformed time %s",
    (startTime) => {
      const result = ReportSickLeaveFormSchema.safeParse({
        date: new Date(2026, 2, 2),
        hasStartTime: true,
        startTime,
        comment: "",
      });

      expect(result.success).toBe(false);
    },
  );

  it("accepts a comment at the 500 character limit", () => {
    const result = ReportSickLeaveFormSchema.safeParse({
      date: new Date(2026, 2, 2),
      hasStartTime: false,
      startTime: "",
      comment: "x".repeat(500),
    });

    expect(result.success).toBe(true);
  });

  it("rejects a comment beyond 500 characters", () => {
    const result = ReportSickLeaveFormSchema.safeParse({
      date: new Date(2026, 2, 2),
      hasStartTime: false,
      startTime: "",
      comment: "x".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing date", () => {
    const result = ReportSickLeaveFormSchema.safeParse({
      date: "2026-03-02",
      hasStartTime: false,
      startTime: "",
      comment: "",
    });

    expect(result.success).toBe(false);
  });
});
