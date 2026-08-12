import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

import { getOrganizationOwnerAction } from "./get-organization-owner.action";

describe("getOrganizationOwnerAction", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("returns the owner scoped to the given organization on success", async () => {
    const owner = {
      userId: "user-1",
      firstName: "Anna",
      lastName: "Meier",
      email: "a.meier@example.ch",
    };
    request.mockResolvedValueOnce({ organizationOwner: owner });

    const result = await getOrganizationOwnerAction("org-1");

    expect(result).toEqual({ success: true, data: owner });
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      organizationId: "org-1",
    });
  });

  it("returns null data when the organization has no owner", async () => {
    request.mockResolvedValueOnce({ organizationOwner: null });

    const result = await getOrganizationOwnerAction("org-1");

    expect(result).toEqual({ success: true, data: null });
  });

  it("returns a failure result and does not throw when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await getOrganizationOwnerAction("org-1");

    expect(result.success).toBe(false);
  });
});
