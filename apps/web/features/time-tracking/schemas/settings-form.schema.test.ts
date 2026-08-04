import { describe, expect, it } from "vitest";

import {
  HolidayFormSchema,
  createCompanyVacationFormSchema,
} from "./settings-form.schema";

describe("HolidayFormSchema", () => {
  it("accepts a valid one-off holiday", () => {
    const result = HolidayFormSchema.safeParse({
      date: new Date(2026, 7, 1),
      name: "Nationalfeiertag",
      paidPercentage: 100,
      repeatsYearly: false,
    });

    expect(result.success).toBe(true);
  });

  it("accepts a yearly holiday and applies defaults", () => {
    const result = HolidayFormSchema.safeParse({
      date: new Date(2020, 7, 1),
      name: "Nationalfeiertag",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paidPercentage).toBe(100);
      expect(result.data.repeatsYearly).toBe(false);
    }
  });

  it("rejects an empty name", () => {
    const result = HolidayFormSchema.safeParse({
      date: new Date(2026, 7, 1),
      name: "",
      paidPercentage: 100,
      repeatsYearly: false,
    });

    expect(result.success).toBe(false);
  });

  it("rejects paidPercentage outside 0–100", () => {
    const tooHigh = HolidayFormSchema.safeParse({
      date: new Date(2026, 7, 1),
      name: "X",
      paidPercentage: 101,
      repeatsYearly: false,
    });
    const tooLow = HolidayFormSchema.safeParse({
      date: new Date(2026, 7, 1),
      name: "X",
      paidPercentage: -1,
      repeatsYearly: false,
    });

    expect(tooHigh.success).toBe(false);
    expect(tooLow.success).toBe(false);
  });
});

describe("createCompanyVacationFormSchema", () => {
  const t = (key: string) => key;
  const schema = createCompanyVacationFormSchema(t);

  it("accepts a valid date range", () => {
    const result = schema.safeParse({
      name: "Sommerferien",
      startDate: new Date(2026, 6, 1),
      endDate: new Date(2026, 7, 15),
    });

    expect(result.success).toBe(true);
  });

  it("accepts a single-day vacation", () => {
    const day = new Date(2026, 11, 24);
    const result = schema.safeParse({
      name: "Heiligabend",
      startDate: day,
      endDate: day,
    });

    expect(result.success).toBe(true);
  });

  it("rejects endDate before startDate", () => {
    const result = schema.safeParse({
      name: "Sommerferien",
      startDate: new Date(2026, 7, 1),
      endDate: new Date(2026, 6, 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("endBeforeStart");
      expect(result.error.issues[0]?.path).toEqual(["endDate"]);
    }
  });

  it("rejects an empty name", () => {
    const result = schema.safeParse({
      name: "",
      startDate: new Date(2026, 6, 1),
      endDate: new Date(2026, 7, 15),
    });

    expect(result.success).toBe(false);
  });
});
