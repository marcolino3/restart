import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(async () => "de"),
}));

import { getMyTimeTrackingAction } from "./get-my-time-tracking.action";

describe("getMyTimeTrackingAction", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("returns an empty result when the caller has no employee profile", async () => {
    request.mockResolvedValueOnce({ myEmployeeId: null });

    const result = await getMyTimeTrackingAction();

    expect(result.employeeId).toBeNull();
    expect(result.balance).toBeNull();
    expect(result.entries).toEqual([]);
    expect(result.monthlyGroups).toEqual([]);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("derives the open entry as the entry without an endedAt", async () => {
    const entries = [
      { id: "e1", entryDate: "2026-01-10", startedAt: "...", endedAt: "..." },
      { id: "e2", entryDate: "2026-01-11", startedAt: "...", endedAt: null },
    ];
    request
      .mockResolvedValueOnce({ myEmployeeId: "emp-1" })
      .mockResolvedValueOnce({
        myWorkTimeBalance: { employeeId: "emp-1" },
        myVacationBalance: { entitlementDays: 0 },
        myMissingRecordDays: [],
        timeTrackingByEmployeeId: entries,
        myMonthlyTimeTracking: [],
      });

    const result = await getMyTimeTrackingAction();

    expect(result.employeeId).toBe("emp-1");
    expect(result.openEntry?.id).toBe("e2");
    expect(result.entries).toEqual(entries);
  });

  it("returns an empty result and swallows the error when the GraphQL request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await getMyTimeTrackingAction();

    expect(result.employeeId).toBeNull();
    expect(result.monthlyGroups).toEqual([]);
  });
});
