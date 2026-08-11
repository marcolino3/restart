import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

import { getOrganizationsOverviewAction } from "./get-organizations-overview.action";

describe("getOrganizationsOverviewAction", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("returns the overview stats and rows on success", async () => {
    const overview = {
      stats: { activeCount: 2, trialCount: 1, totalUserCount: 10, suspendedCount: 0 },
      rows: [{ organization: { id: "org-1" } }],
    };
    request.mockResolvedValueOnce({ organizationsOverview: overview });

    const result = await getOrganizationsOverviewAction();

    expect(result).toEqual({ success: true, data: overview });
  });

  it("returns a failure result and does not throw when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await getOrganizationsOverviewAction();

    expect(result.success).toBe(false);
  });
});
