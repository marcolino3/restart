import { describe, expect, it } from "vitest";
import { checkAbsenceNoticeDates } from "./employee-absence-notice-form.schema";

const dayOffset = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

describe("checkAbsenceNoticeDates", () => {
  it("rejects a start date in the past for both category kinds", () => {
    expect(checkAbsenceNoticeDates({ startDate: dayOffset(-1) }, false)).toEqual({
      field: "startDate",
      code: "past",
    });
    expect(checkAbsenceNoticeDates({ startDate: dayOffset(-1) }, true)).toEqual({
      field: "startDate",
      code: "past",
    });
  });

  it("allows today and tomorrow for a notice category", () => {
    expect(checkAbsenceNoticeDates({ startDate: dayOffset(0) }, false)).toBeNull();
    expect(checkAbsenceNoticeDates({ startDate: dayOffset(1) }, false)).toBeNull();
  });

  it("rejects anything beyond tomorrow for a notice category", () => {
    expect(checkAbsenceNoticeDates({ startDate: dayOffset(2) }, false)).toEqual({
      field: "startDate",
      code: "tooFar",
    });
  });

  it("allows far future dates for a request category", () => {
    expect(checkAbsenceNoticeDates({ startDate: dayOffset(90) }, true)).toBeNull();
  });

  it("rejects an end date before the start date", () => {
    expect(
      checkAbsenceNoticeDates(
        { startDate: dayOffset(10), endDate: dayOffset(9) },
        true,
      ),
    ).toEqual({ field: "endDate", code: "endBeforeStart" });
  });
});
