import {
  consecutiveWorkdaysForPensum,
  dailyWorkMinutesForDays,
  formatExactTimesPlanLines,
  formatWorkdaysPlanLabel,
  hasWeekdayWorkloads,
  selectedDaysFromWorkloads,
  suggestDayWindows,
  suggestScheduleWindows,
  workdayCountForPensum,
  workloadsFromSelectedDays,
} from "./workday-schedule";

describe("formatExactTimesPlanLines", () => {
  it("returns empty when no windows are set", () => {
    expect(formatExactTimesPlanLines({})).toEqual([]);
    expect(formatExactTimesPlanLines(null)).toEqual([]);
  });

  it("collapses identical consecutive days", () => {
    const windows = {
      mon: [{ start: "08:00", end: "12:00" }],
      tue: [{ start: "08:00", end: "12:00" }],
      wed: [{ start: "08:00", end: "12:00" }],
    };
    expect(formatExactTimesPlanLines(windows)).toEqual([
      "Mo–Mi 08:00–12:00",
    ]);
  });

  it("keeps separate lines for different windows", () => {
    const windows = {
      mon: [
        { start: "08:00", end: "12:00" },
        { start: "13:00", end: "17:00" },
      ],
      wed: [{ start: "09:00", end: "12:00" }],
    };
    expect(formatExactTimesPlanLines(windows)).toEqual([
      "Mo 08:00–12:00 · 13:00–17:00",
      "Mi 09:00–12:00",
    ]);
  });
});

describe("formatWorkdaysPlanLabel", () => {
  it("lists selected days", () => {
    expect(formatWorkdaysPlanLabel({ mon: 20, wed: 20, fri: 20 })).toBe(
      "Mo, Mi, Fr",
    );
  });

  it("returns undefined when empty", () => {
    expect(formatWorkdaysPlanLabel({})).toBeUndefined();
  });
});

describe("workloadsFromSelectedDays", () => {
  it("splits 60 % evenly across three days", () => {
    expect(workloadsFromSelectedDays(["mon", "tue", "wed"], 60)).toEqual({
      mon: 20,
      tue: 20,
      wed: 20,
    });
  });

  it("puts the rounding remainder on the last day", () => {
    expect(workloadsFromSelectedDays(["mon", "tue", "wed"], 50)).toEqual({
      mon: 16.7,
      tue: 16.7,
      wed: 16.6,
    });
  });

  it("returns an empty object when no days are selected", () => {
    expect(workloadsFromSelectedDays([], 80)).toEqual({});
  });
});

describe("consecutiveWorkdaysForPensum", () => {
  it("maps 10 % steps to consecutive Mon… days (~20 % per day)", () => {
    expect(workdayCountForPensum(10)).toBe(1);
    expect(consecutiveWorkdaysForPensum(10)).toEqual(["mon"]);
    expect(consecutiveWorkdaysForPensum(20)).toEqual(["mon"]);
    expect(consecutiveWorkdaysForPensum(30)).toEqual(["mon", "tue"]);
    expect(consecutiveWorkdaysForPensum(60)).toEqual(["mon", "tue", "wed"]);
    expect(consecutiveWorkdaysForPensum(80)).toEqual([
      "mon",
      "tue",
      "wed",
      "thu",
    ]);
    expect(consecutiveWorkdaysForPensum(100)).toEqual([
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
    ]);
  });
});

describe("selectedDaysFromWorkloads / hasWeekdayWorkloads", () => {
  it("reads only positive shares", () => {
    const workloads = { mon: 20, wed: 20, fri: 0, sat: null };
    expect(selectedDaysFromWorkloads(workloads)).toEqual(["mon", "wed"]);
    expect(hasWeekdayWorkloads(workloads)).toBe(true);
    expect(hasWeekdayWorkloads({})).toBe(false);
  });
});

describe("suggestDayWindows", () => {
  it("builds an 08:00 day with a 45 min noon break for a full workday", () => {
    // 42 h / 5 = 8.4 h = 504 min work → 08:00–17:09 with 45 min break
    expect(suggestDayWindows(504)).toEqual([
      { start: "08:00", end: "12:00" },
      { start: "12:45", end: "17:09" },
    ]);
  });

  it("skips the break for short days", () => {
    expect(suggestDayWindows(180)).toEqual([{ start: "08:00", end: "11:00" }]);
  });
});

describe("suggestScheduleWindows", () => {
  it("returns an empty plan when no days are chosen", () => {
    expect(
      suggestScheduleWindows({
        selectedDays: [],
        workloadPercent: 100,
        weeklyHoursRaw: 42,
      }),
    ).toEqual({});
    expect(
      suggestScheduleWindows({
        selectedDays: [],
        workloadPercent: 60,
        weeklyHoursRaw: 42,
      }),
    ).toEqual({});
  });

  it("fills only the selected days for part-time pensums", () => {
    const windows = suggestScheduleWindows({
      selectedDays: ["mon", "wed", "fri"],
      workloadPercent: 60,
      weeklyHoursRaw: 42,
    });
    expect(Object.keys(windows)).toEqual(["mon", "wed", "fri"]);
    expect(dailyWorkMinutesForDays(3, 60, 42)).toBe(504);
    expect(windows.mon).toEqual([
      { start: "08:00", end: "12:00" },
      { start: "12:45", end: "17:09" },
    ]);
  });
});
