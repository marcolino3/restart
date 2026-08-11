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

import { bulkUpdateOrganizationFeatureTogglesAction } from "./bulk-update-organization-feature-toggles.action";

describe("bulkUpdateOrganizationFeatureTogglesAction", () => {
  beforeEach(() => {
    request.mockReset();
    revalidatePath.mockReset();
  });

  it("returns all updated toggles and revalidates the organizations route on success", async () => {
    const updated = [
      { featureKey: "TIME_TRACKING", enabled: true },
      { featureKey: "CHATS", enabled: false },
    ];
    request.mockResolvedValueOnce({
      bulkUpdateOrganizationFeatureToggles: updated,
    });

    const params = {
      organizationId: "org-1",
      updates: [
        { featureKey: "TIME_TRACKING", enabled: true },
        { featureKey: "CHATS", enabled: false },
      ],
    };
    const result = await bulkUpdateOrganizationFeatureTogglesAction(params);

    expect(result).toEqual({ success: true, data: updated });
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      input: params,
    });
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });

  it("returns a failure result and does not throw when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await bulkUpdateOrganizationFeatureTogglesAction({
      organizationId: "org-1",
      updates: [],
    });

    expect(result.success).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
