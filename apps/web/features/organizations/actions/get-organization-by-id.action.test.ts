import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

import { getOrganizationByIdAction } from "./get-organization-by-id.action";

describe("getOrganizationByIdAction", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("returns the organization on success", async () => {
    const organization = { id: "org-1", name: "Montessori Zürich" };
    request.mockResolvedValueOnce({ organization });

    const result = await getOrganizationByIdAction("org-1");

    expect(result).toEqual({ success: true, data: organization });
    expect(request).toHaveBeenCalledWith(expect.anything(), { id: "org-1" });
  });

  it("returns a failure result and does not throw when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await getOrganizationByIdAction("org-1");

    expect(result.success).toBe(false);
  });
});
