import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

import { exportOrganizationDataAction } from "./export-organization-data.action";

describe("exportOrganizationDataAction", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("returns the job info on success", async () => {
    const job = { jobId: "job-1", status: "QUEUED" };
    request.mockResolvedValueOnce({ exportOrganizationData: job });

    const result = await exportOrganizationDataAction("org-1");

    expect(result).toEqual({ success: true, data: job });
    expect(request).toHaveBeenCalledWith(expect.anything(), { id: "org-1" });
  });

  it("returns a failure result and does not throw when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await exportOrganizationDataAction("org-1");

    expect(result.success).toBe(false);
  });
});
