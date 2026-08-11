import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

import { getOrganizationAuditLogAction } from "./get-organization-audit-log.action";

describe("getOrganizationAuditLogAction", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("uses default pagination when not provided", async () => {
    const page = { total: 0, items: [] };
    request.mockResolvedValueOnce({ organizationAuditLog: page });

    await getOrganizationAuditLogAction("org-1");

    expect(request).toHaveBeenCalledWith(expect.anything(), {
      organizationId: "org-1",
      limit: 25,
      offset: 0,
    });
  });

  it("passes explicit pagination through and returns the page on success", async () => {
    const page = { total: 3, items: [{ id: "log-1" }] };
    request.mockResolvedValueOnce({ organizationAuditLog: page });

    const result = await getOrganizationAuditLogAction("org-1", 10, 20);

    expect(result).toEqual({ success: true, data: page });
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      organizationId: "org-1",
      limit: 10,
      offset: 20,
    });
  });

  it("returns a failure result and does not throw when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await getOrganizationAuditLogAction("org-1");

    expect(result.success).toBe(false);
  });
});
