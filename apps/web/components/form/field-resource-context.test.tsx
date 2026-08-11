import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  UserProvider,
  type CurrentUser,
  type EffectiveFieldPermission,
} from "@/features/users/context/current-user.context";
import {
  FieldResourceProvider,
  useFieldAccess,
} from "./field-resource-context";

const baseUser: CurrentUser = {
  id: "u1",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  roles: [],
  permissions: [],
  fieldPermissions: [],
  isSuperAdmin: false,
  timeTrackingEnabled: false,
  isProjectMember: false,
};

function makeUser(
  fieldPermissions: EffectiveFieldPermission[],
  overrides: Partial<CurrentUser> = {}
): CurrentUser {
  return { ...baseUser, fieldPermissions, ...overrides };
}

function wrapper(
  user: CurrentUser,
  resource?: string,
  mode?: "create" | "update"
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <UserProvider user={user}>
        {resource ? (
          <FieldResourceProvider resource={resource} mode={mode}>
            {children}
          </FieldResourceProvider>
        ) : (
          children
        )}
      </UserProvider>
    );
  }
  return Wrapper;
}

describe("useFieldAccess", () => {
  it("is always accessible when no FieldResourceProvider wraps it", () => {
    const user = makeUser([]);
    const { result } = renderHook(() => useFieldAccess("grossSalary"), {
      wrapper: wrapper(user),
    });
    expect(result.current).toEqual({ visible: true, editable: true });
  });

  it("is always accessible for a field outside the catalog", () => {
    const user = makeUser([]);
    const { result } = renderHook(
      () => useFieldAccess("notInCatalogField"),
      { wrapper: wrapper(user, "employeeContract", "update") }
    );
    expect(result.current).toEqual({ visible: true, editable: true });
  });

  it("hides a catalog field with no read grant", () => {
    const user = makeUser([]);
    const { result } = renderHook(() => useFieldAccess("grossSalary"), {
      wrapper: wrapper(user, "employeeContract", "update"),
    });
    expect(result.current).toEqual({ visible: false, editable: false });
  });

  it("shows but disables a field with read but no write grant in the active mode", () => {
    const user = makeUser([
      { resource: "employeeContract", field: "grossSalary", actions: ["read"] },
    ]);
    const { result } = renderHook(() => useFieldAccess("grossSalary"), {
      wrapper: wrapper(user, "employeeContract", "update"),
    });
    expect(result.current).toEqual({ visible: true, editable: false });
  });

  it("shows and enables a field with read + matching write grant", () => {
    const user = makeUser([
      {
        resource: "employeeContract",
        field: "grossSalary",
        actions: ["read", "update"],
      },
    ]);
    const { result } = renderHook(() => useFieldAccess("grossSalary"), {
      wrapper: wrapper(user, "employeeContract", "update"),
    });
    expect(result.current).toEqual({ visible: true, editable: true });
  });

  it("distinguishes create vs update write grants", () => {
    const user = makeUser([
      {
        resource: "employeeContract",
        field: "grossSalary",
        actions: ["read", "create"],
      },
    ]);
    const { result: createResult } = renderHook(
      () => useFieldAccess("grossSalary"),
      { wrapper: wrapper(user, "employeeContract", "create") }
    );
    expect(createResult.current).toEqual({ visible: true, editable: true });

    const { result: updateResult } = renderHook(
      () => useFieldAccess("grossSalary"),
      { wrapper: wrapper(user, "employeeContract", "update") }
    );
    expect(updateResult.current).toEqual({ visible: true, editable: false });
  });

  it("bypasses all field gating for a SuperAdmin", () => {
    const user = makeUser([], { isSuperAdmin: true });
    const { result } = renderHook(() => useFieldAccess("grossSalary"), {
      wrapper: wrapper(user, "employeeContract", "update"),
    });
    expect(result.current).toEqual({ visible: true, editable: true });
  });
});
