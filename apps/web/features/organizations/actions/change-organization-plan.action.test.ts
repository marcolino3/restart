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

import { changeOrganizationPlanAction } from "./change-organization-plan.action";

describe("changeOrganizationPlanAction", () => {
  beforeEach(() => {
    request.mockReset();
    revalidatePath.mockReset();
  });

  it("returns the updated organization and revalidates the edit route on success", async () => {
    const updated = { id: "org-1", plan: "ENTERPRISE", userLicenseLimit: 500 };
    request.mockResolvedValueOnce({ changeOrganizationPlan: updated });

    const params = { id: "org-1", plan: "ENTERPRISE", userLicenseLimit: 500 };
    const result = await changeOrganizationPlanAction(params);

    expect(result).toEqual({ success: true, data: updated });
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      input: params,
    });
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });

  it("returns a failure result and does not throw when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await changeOrganizationPlanAction({
      id: "org-1",
      plan: "ENTERPRISE",
    });

    expect(result.success).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
