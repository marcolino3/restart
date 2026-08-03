import { describe, expect, it } from "vitest";
import { resolveContractScheduleFields } from "./resolve-contract-schedule";

describe("resolveContractScheduleFields", () => {
  const windows = {
    mon: [{ start: "08:00", end: "12:00" }],
  };
  const workloads = { mon: 20, tue: 20, wed: 20 };

  it("keeps exact times and clears day shares when both are set", () => {
    expect(
      resolveContractScheduleFields({
        weekdayTimeWindows: windows,
        weekdayWorkloads: workloads,
      }),
    ).toEqual({
      weekdayTimeWindows: windows,
      weekdayWorkloads: null,
    });
  });

  it("keeps day shares when no exact times are present", () => {
    expect(
      resolveContractScheduleFields({
        weekdayTimeWindows: {},
        weekdayWorkloads: workloads,
      }),
    ).toEqual({
      weekdayTimeWindows: null,
      weekdayWorkloads: workloads,
    });
  });

  it("clears both when neither schedule mode has content", () => {
    expect(
      resolveContractScheduleFields({
        weekdayTimeWindows: { mon: [] },
        weekdayWorkloads: { mon: 0, tue: null },
      }),
    ).toEqual({
      weekdayTimeWindows: null,
      weekdayWorkloads: null,
    });
  });

  it("treats null / undefined schedules as cleared", () => {
    expect(
      resolveContractScheduleFields({
        weekdayTimeWindows: null,
        weekdayWorkloads: null,
      }),
    ).toEqual({
      weekdayTimeWindows: null,
      weekdayWorkloads: null,
    });
  });
});
