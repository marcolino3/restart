import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(async () => "de"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

import { reactivateOrganizationAction } from "./reactivate-organization.action";

describe("reactivateOrganizationAction", () => {
  beforeEach(() => {
    request.mockReset();
    revalidatePath.mockReset();
  });

  it("returns the updated organization and revalidates both admin routes on success", async () => {
    const reactivated = {
      id: "org-1",
      lifecycleStatus: "ACTIVE",
      suspendedReason: null,
    };
    request.mockResolvedValueOnce({ reactivateOrganization: reactivated });

    const result = await reactivateOrganizationAction("org-1");

    expect(result).toEqual({ success: true, data: reactivated });
    expect(request).toHaveBeenCalledWith(expect.anything(), { id: "org-1" });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });

  it("returns a failure result and does not throw when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await reactivateOrganizationAction("org-1");

    expect(result.success).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
