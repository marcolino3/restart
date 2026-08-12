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

import { suspendOrganizationAction } from "./suspend-organization.action";

describe("suspendOrganizationAction", () => {
  beforeEach(() => {
    request.mockReset();
    revalidatePath.mockReset();
  });

  it("returns the updated organization and revalidates both admin routes on success", async () => {
    const suspended = {
      id: "org-1",
      lifecycleStatus: "SUSPENDED",
      suspendedReason: "non-payment",
    };
    request.mockResolvedValueOnce({ suspendOrganization: suspended });

    const result = await suspendOrganizationAction("org-1", "non-payment");

    expect(result).toEqual({ success: true, data: suspended });
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      input: { id: "org-1", reason: "non-payment" },
    });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });

  it("returns a failure result and does not throw when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await suspendOrganizationAction("org-1", "non-payment");

    expect(result.success).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
