import { describe, expect, it } from "vitest";
import {
  breakMinutes,
  createShiftFormSchema,
  shiftDurationMinutes,
  shiftNetMinutes,
} from "./shift-form.schema";

const schema = createShiftFormSchema((k) => k);

const issueMessages = (input: unknown) => {
  const res = schema.safeParse(input);
  return res.success ? [] : res.error.issues.map((i) => i.message);
};

describe("ShiftFormSchema", () => {
  it("accepts a regular day shift and normalises color and breaks", () => {
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
      breaks: [],
    });
  });

  it("accepts a shift crossing midnight with a break after midnight", () => {
    expect(
      schema.safeParse({
        name: "Nacht",
        startTime: "22:00",
        endTime: "06:00",
        breaks: [{ startTime: "01:30", endTime: "02:00" }],
      }).success,
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

  it("rejects breaks outside the shift, zero-length or overlapping", () => {
    const base = { name: "Tag", startTime: "07:00", endTime: "17:00" };
    expect(
      issueMessages({
        ...base,
        breaks: [{ startTime: "17:00", endTime: "17:30" }],
      }),
    ).toContain("shiftBreakOutsideShift");
    expect(
      issueMessages({
        ...base,
        breaks: [{ startTime: "12:00", endTime: "12:00" }],
      }),
    ).toContain("shiftBreakZeroLength");
    expect(
      issueMessages({
        ...base,
        breaks: [
          { startTime: "12:00", endTime: "12:45" },
          { startTime: "12:30", endTime: "13:00" },
        ],
      }),
    ).toContain("shiftBreaksOverlap");
  });
});

describe("durations", () => {
  it("computes same-day and overnight durations", () => {
    expect(shiftDurationMinutes("07:00", "12:30")).toBe(330);
    expect(shiftDurationMinutes("22:00", "06:00")).toBe(480);
  });

  it("subtracts breaks for the net duration", () => {
    const breaks = [
      { startTime: "12:00", endTime: "12:45" },
      { startTime: "15:00", endTime: "15:15" },
    ];
    expect(breakMinutes(breaks)).toBe(60);
    expect(shiftNetMinutes("07:00", "17:00", breaks)).toBe(540);
  });
});
