import { describe, expect, it } from "vitest";

import { TimeEntryFormSchema, minutesOfDay } from "./time-entry-form.schema";

const iso = (hh: number, mm: number) =>
  `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

const today = () => new Date();

describe("minutesOfDay", () => {
  it("extracts hours/minutes from an HH:mm string", () => {
    expect(minutesOfDay(iso(8, 30))).toBe(8 * 60 + 30);
  });
});

describe("TimeEntryFormSchema", () => {
  it("accepts a valid entry", () => {
    const result = TimeEntryFormSchema.safeParse({
      date: today(),
      startTime: iso(8, 0),
      endTime: iso(16, 30),
      breakMinutes: 30,
      notes: "ok",
    });
    expect(result.success).toBe(true);
  });

  it("applies defaults for breakMinutes and notes", () => {
    const result = TimeEntryFormSchema.safeParse({
      date: today(),
      startTime: iso(8, 0),
      endTime: iso(16, 0),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.breakMinutes).toBe(0);
      expect(result.data.notes).toBe("");
    }
  });

  it("rejects endTime before startTime", () => {
    const result = TimeEntryFormSchema.safeParse({
      date: today(),
      startTime: iso(16, 0),
      endTime: iso(8, 0),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("endBeforeStart");
      expect(result.error.issues[0]?.path).toEqual(["endTime"]);
    }
  });

  it("rejects endTime equal to startTime", () => {
    const result = TimeEntryFormSchema.safeParse({
      date: today(),
      startTime: iso(8, 0),
      endTime: iso(8, 0),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a date more than 7 days in the past", () => {
    const tooOld = new Date();
    tooOld.setDate(tooOld.getDate() - 8);
    const result = TimeEntryFormSchema.safeParse({
      date: tooOld,
      startTime: iso(8, 0),
      endTime: iso(16, 0),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("dateOutOfRange");
    }
  });

  it("rejects a future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const result = TimeEntryFormSchema.safeParse({
      date: future,
      startTime: iso(8, 0),
      endTime: iso(16, 0),
    });
    expect(result.success).toBe(false);
  });

  it("rejects breakMinutes above 600", () => {
    const result = TimeEntryFormSchema.safeParse({
      date: today(),
      startTime: iso(8, 0),
      endTime: iso(16, 0),
      breakMinutes: 601,
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes above 500 chars", () => {
    const result = TimeEntryFormSchema.safeParse({
      date: today(),
      startTime: iso(8, 0),
      endTime: iso(16, 0),
      notes: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
