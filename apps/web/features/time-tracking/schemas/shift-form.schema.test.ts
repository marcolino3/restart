import { describe, expect, it } from "vitest";
import {
  createShiftFormSchema,
  shiftDurationMinutes,
} from "./shift-form.schema";

const schema = createShiftFormSchema((k) => k);

describe("ShiftFormSchema", () => {
  it("accepts a regular day shift and normalises color to null", () => {
    const parsed = schema.parse({
      name: " Früh ",
      startTime: "07:00",
      endTime: "12:00",
    });
    expect(parsed).toEqual({
      name: "Früh",
      startTime: "07:00",
      endTime: "12:00",
      color: null,
    });
  });

  it("accepts a shift crossing midnight", () => {
    expect(
      schema.safeParse({ name: "Nacht", startTime: "22:00", endTime: "06:00" })
        .success,
    ).toBe(true);
  });

  it("rejects a zero-length shift", () => {
    const res = schema.safeParse({
      name: "X",
      startTime: "08:00",
      endTime: "08:00",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].path).toEqual(["endTime"]);
      expect(res.error.issues[0].message).toBe("shiftZeroLength");
    }
  });

  it("rejects malformed times and colors", () => {
    expect(
      schema.safeParse({ name: "X", startTime: "7:00", endTime: "12:00" })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({
        name: "X",
        startTime: "07:00",
        endTime: "12:00",
        color: "red",
      }).success,
    ).toBe(false);
  });
});

describe("shiftDurationMinutes", () => {
  it("computes same-day and overnight durations", () => {
    expect(shiftDurationMinutes("07:00", "12:30")).toBe(330);
    expect(shiftDurationMinutes("22:00", "06:00")).toBe(480);
  });
});
