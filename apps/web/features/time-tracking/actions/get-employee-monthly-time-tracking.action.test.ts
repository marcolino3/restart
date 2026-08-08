import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));
vi.mock("next-intl/server", () => ({ getLocale: vi.fn(async () => "de") }));

import { getEmployeeMonthlyTimeTrackingAction } from "./get-employee-monthly-time-tracking.action";

describe("getEmployeeMonthlyTimeTrackingAction", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("returns monthly groups and requests uppercased locale plus current-year range", async () => {
    const groups = [
      {
        year: 2026,
        month: 1,
        workedMinutes: 100,
        plannedMinutes: 120,
        days: [],
      },
    ];
    request.mockResolvedValueOnce({ employeeMonthlyTimeTracking: groups });

    const year = new Date().getFullYear();
    const result = await getEmployeeMonthlyTimeTrackingAction("emp-1");

    expect(result).toEqual({
      monthlyGroups: groups,
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    });
    expect(request.mock.calls[0][1]).toEqual({
      employeeId: "emp-1",
      from: `${year}-01-01`,
      to: `${year}-12-31`,
      locale: "DE",
    });
  });

  it("defaults to empty array when data is nullish", async () => {
    request.mockResolvedValueOnce({ employeeMonthlyTimeTracking: null });

    const result = await getEmployeeMonthlyTimeTrackingAction("emp-1");

    expect(result.monthlyGroups).toEqual([]);
  });

  it("returns empty groups with the year range on request failure", async () => {
    request.mockRejectedValueOnce(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const year = new Date().getFullYear();
    const result = await getEmployeeMonthlyTimeTrackingAction("emp-1");

    expect(result).toEqual({
      monthlyGroups: [],
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    });
  });
});
