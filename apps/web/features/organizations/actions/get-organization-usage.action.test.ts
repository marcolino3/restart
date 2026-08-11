import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

import { getOrganizationUsageAction } from "./get-organization-usage.action";

describe("getOrganizationUsageAction", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("returns usage data scoped to the given organization on success", async () => {
    const usage = { userCount: 5, childCount: 12, storageUsedGb: 1.5 };
    request.mockResolvedValueOnce({ organizationUsage: usage });

    const result = await getOrganizationUsageAction("org-1");

    expect(result).toEqual({ success: true, data: usage });
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      organizationId: "org-1",
    });
  });

  it("returns a failure result and does not throw when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await getOrganizationUsageAction("org-1");

    expect(result.success).toBe(false);
  });
});
