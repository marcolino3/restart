import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));

import { updateRolePermissionsAction } from "./update-role-permissions.action";

describe("updateRolePermissionsAction", () => {
  beforeEach(() => {
    request.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("sends role id and permission codes as the mutation input", async () => {
    request.mockResolvedValueOnce({ updateRolePermissions: { id: "role-1" } });

    const result = await updateRolePermissionsAction("role-1", [
      "ADDRESS_READ",
      "ADDRESS_WRITE",
    ]);

    expect(result).toEqual({ success: true });
    expect(request).toHaveBeenCalledWith(expect.anything(), {
      input: {
        roleId: "role-1",
        permissionCodes: ["ADDRESS_READ", "ADDRESS_WRITE"],
      },
    });
  });

  it("sends an empty list so an area can be set to no access", async () => {
    request.mockResolvedValueOnce({ updateRolePermissions: { id: "role-1" } });

    await updateRolePermissionsAction("role-1", []);

    expect(request).toHaveBeenCalledWith(expect.anything(), {
      input: { roleId: "role-1", permissionCodes: [] },
    });
  });

  it("surfaces the backend refusal so the toast can explain the failure", async () => {
    request.mockRejectedValueOnce({
      response: {
        errors: [{ message: 'System role "Owner" cannot be renamed' }],
      },
    });

    const result = await updateRolePermissionsAction("role-1", [
      "ADDRESS_READ",
    ]);

    expect(result).toEqual({
      success: false,
      error: 'System role "Owner" cannot be renamed',
    });
  });

  it("returns a failure without a message when the error carries none", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await updateRolePermissionsAction("role-1", [
      "ADDRESS_READ",
    ]);

    expect(result).toEqual({ success: false, error: undefined });
  });
});
