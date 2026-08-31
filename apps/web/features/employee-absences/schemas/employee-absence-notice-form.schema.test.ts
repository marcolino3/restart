import { describe, expect, it } from "vitest";
import {
  absenceNoticeErrorCode,
  checkAbsenceNoticeDates,
  checkAbsenceNoticeTiming,
  allowedAbsenceEntryModes,
} from "./employee-absence-notice-form.schema";

const dayOffset = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

describe("checkAbsenceNoticeDates", () => {
  it("rejects a start date in the past for both category kinds", () => {
    expect(
      checkAbsenceNoticeDates({ startDate: dayOffset(-1) }, false),
    ).toEqual({
      field: "startDate",
      code: "past",
    });
    expect(checkAbsenceNoticeDates({ startDate: dayOffset(-1) }, true)).toEqual(
      {
        field: "startDate",
        code: "past",
      },
    );
  });

  it("allows today and tomorrow for a notice category", () => {
    expect(
      checkAbsenceNoticeDates({ startDate: dayOffset(0) }, false),
    ).toBeNull();
    expect(
      checkAbsenceNoticeDates({ startDate: dayOffset(1) }, false),
    ).toBeNull();
  });

  it("rejects anything beyond tomorrow for a notice category", () => {
    expect(checkAbsenceNoticeDates({ startDate: dayOffset(2) }, false)).toEqual(
      {
        field: "startDate",
        code: "tooFar",
      },
    );
  });

  it("allows far future dates for a request category", () => {
    expect(
      checkAbsenceNoticeDates({ startDate: dayOffset(90) }, true),
    ).toBeNull();
  });

  it("rejects an end date before the start date", () => {
    expect(
      checkAbsenceNoticeDates(
        { startDate: dayOffset(10), endDate: dayOffset(9) },
        true,
      ),
    ).toEqual({ field: "endDate", code: "endBeforeStart" });
  });

  it("rejects a range on a category without date ranges", () => {
    expect(
      checkAbsenceNoticeDates(
        { startDate: dayOffset(10), endDate: dayOffset(11) },
        { requiresApproval: true, allowsDateRange: false },
      ),
    ).toEqual({ field: "endDate", code: "singleDayOnly" });
    expect(
      checkAbsenceNoticeDates(
        { startDate: dayOffset(10), endDate: dayOffset(10) },
        { requiresApproval: true, allowsDateRange: false },
      ),
    ).toBeNull();
  });

  it("enforces maxDaysPerRequest inclusively", () => {
    const rules = {
      requiresApproval: true,
      allowsDateRange: true,
      maxDaysPerRequest: 2,
    };
    expect(
      checkAbsenceNoticeDates(
        { startDate: dayOffset(10), endDate: dayOffset(11) },
        rules,
      ),
    ).toBeNull();
    expect(
      checkAbsenceNoticeDates(
        { startDate: dayOffset(10), endDate: dayOffset(12) },
        rules,
      ),
    ).toEqual({ field: "endDate", code: "tooManyDays" });
  });

  it("maps backend rejections to form error codes", () => {
    expect(
      absenceNoticeErrorCode("ABSENCE_YEARLY_CAP: only 0 of 3 days left"),
    ).toEqual({ field: "endDate", code: "yearlyCap" });
    expect(
      absenceNoticeErrorCode(
        "This absence category only allows single-day absences.",
      ),
    ).toEqual({ field: "endDate", code: "singleDayOnly" });
    expect(
      absenceNoticeErrorCode(
        "This absence category allows at most 2 days per request.",
      ),
    ).toEqual({ field: "endDate", code: "tooManyDays" });
    expect(absenceNoticeErrorCode("boom")).toBeNull();
  });
});

describe("maxDaysAhead", () => {
  it("limits the start independently of the approval flag", () => {
    const rules = { requiresApproval: true, maxDaysAhead: 2 };
    expect(
      checkAbsenceNoticeDates({ startDate: dayOffset(2) }, rules),
    ).toBeNull();
    expect(checkAbsenceNoticeDates({ startDate: dayOffset(3) }, rules)).toEqual(
      { field: "startDate", code: "tooFar" },
    );
    expect(
      checkAbsenceNoticeDates(
        { startDate: dayOffset(30) },
        { requiresApproval: false, maxDaysAhead: null },
      ),
    ).toBeNull();
  });
});

describe("checkAbsenceNoticeTiming", () => {
  const time = { entryPrecision: "TIME" as const };

  it("TIME mode needs a valid start; the end may stay open but must follow", () => {
    expect(checkAbsenceNoticeTiming({ entryMode: "TIME" }, time, 1)).toEqual({
      field: "startTime",
      code: "timeRequired",
    });
    expect(
      checkAbsenceNoticeTiming(
        { entryMode: "TIME", startTime: "14:00", endTime: "13:00" },
        time,
        1,
      ),
    ).toEqual({ field: "endTime", code: "timeOrder" });
    expect(
      checkAbsenceNoticeTiming(
        { entryMode: "TIME", startTime: "15:00" },
        time,
        1,
      ),
    ).toBeNull();
    expect(
      checkAbsenceNoticeTiming(
        { entryMode: "TIME", startTime: "14:00", endTime: "15:30" },
        time,
        2,
      ),
    ).toEqual({ field: "endDate", code: "halfDaySingleDay" });
  });

  it("a TIME category still accepts whole and half days", () => {
    expect(checkAbsenceNoticeTiming({ entryMode: "DAY" }, time, 3)).toBeNull();
    expect(
      checkAbsenceNoticeTiming(
        { entryMode: "HALF_DAY", dayPart: "MORNING" },
        time,
        1,
      ),
    ).toBeNull();
  });

  it("HALF_DAY: a day part is only valid on single days", () => {
    const half = { entryPrecision: "HALF_DAY" as const };
    expect(
      checkAbsenceNoticeTiming(
        { entryMode: "HALF_DAY", dayPart: "MORNING" },
        half,
        1,
      ),
    ).toBeNull();
    expect(
      checkAbsenceNoticeTiming(
        { entryMode: "HALF_DAY", dayPart: "MORNING" },
        half,
        2,
      ),
    ).toEqual({ field: "endDate", code: "halfDaySingleDay" });
  });

  it("lists the entry modes a precision permits", () => {
    expect(allowedAbsenceEntryModes("DAY")).toEqual(["DAY"]);
    expect(allowedAbsenceEntryModes("TIME")).toEqual([
      "DAY",
      "HALF_DAY",
      "TIME",
    ]);
  });

  it("is reached through checkAbsenceNoticeDates", () => {
    expect(
      checkAbsenceNoticeDates(
        { startDate: dayOffset(1), entryMode: "TIME" },
        { requiresApproval: false, entryPrecision: "TIME" },
      ),
    ).toEqual({ field: "startTime", code: "timeRequired" });
  });

  it("maps the backend time rejections", () => {
    expect(
      absenceNoticeErrorCode(
        "This absence category requires a start and end time.",
      ),
    ).toEqual({ field: "startTime", code: "timeRequired" });
    expect(
      absenceNoticeErrorCode("End time must be after start time."),
    ).toEqual({
      field: "endTime",
      code: "timeOrder",
    });
  });
});
