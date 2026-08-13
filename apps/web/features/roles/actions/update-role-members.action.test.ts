import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

import { updateRoleMembersAction } from "./update-role-members.action";

describe("updateRoleMembersAction", () => {
  beforeEach(() => {
    request.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("sends role and membership ids as the mutation input", async () => {
    request.mockResolvedValueOnce({ updateRoleMembers: { id: "role-1" } });

    const result = await updateRoleMembersAction("role-1", ["m-1", "m-2"]);

    expect(result).toEqual({ success: true });
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      input: { roleId: "role-1", membershipIds: ["m-1", "m-2"] },
    });
  });

  it("sends an empty list so the last member can be removed", async () => {
    request.mockResolvedValueOnce({ updateRoleMembers: { id: "role-1" } });

    await updateRoleMembersAction("role-1", []);

    expect(request).toHaveBeenCalledWith(expect.anything(), {
      input: { roleId: "role-1", membershipIds: [] },
    });
  });

  it("surfaces the backend message instead of failing silently", async () => {
    request.mockRejectedValueOnce({
      response: { errors: [{ message: "One or more memberships not found" }] },
    });

    const result = await updateRoleMembersAction("role-1", ["m-foreign"]);

    expect(result).toEqual({
      success: false,
      error: "One or more memberships not found",
    });
  });

  it("returns a failure without a message when the error carries none", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await updateRoleMembersAction("role-1", ["m-1"]);

    expect(result).toEqual({ success: false, error: undefined });
  });
});
