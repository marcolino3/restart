"use client";

import { createContext, useContext, useMemo, useCallback } from "react";

import {
  protectedFieldKey,
  type FieldAction,
} from "@restart/shared-schemas/rbac/field-catalog";

export type { FieldAction };

export type EffectiveFieldPermission = {
  resource: string;
  field: string;
  actions: string[];
};

export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  permissions: string[];
  fieldPermissions: EffectiveFieldPermission[];
  orgId?: string;
  orgName?: string;
  /** IANA zone of the active org -- all timestamps render school-local. */
  orgTimezone?: string;
  isSuperAdmin: boolean;
  // Eigenes Employee-Flag — steuert die Sichtbarkeit des Zeiterfassungs-Menüs.
  timeTrackingEnabled: boolean;
  // Mitglied in mindestens einem aktiven Projekt — steuert das Projekte-Menü.
  isProjectMember: boolean;
};

const UserContext = createContext<CurrentUser | null>(null);

export function useUser() {
  return useContext(UserContext);
}

export function usePermissions() {
  const user = useContext(UserContext);

  const hasPermission = useCallback(
    (permission: string) => {
      if (user?.isSuperAdmin) return true;
      return user?.permissions?.includes(permission) ?? false;
    },
    [user?.permissions, user?.isSuperAdmin]
  );

  const hasRole = useCallback(
    (role: string) => {
      if (user?.isSuperAdmin) return true;
      return user?.roles?.includes(role) ?? false;
    },
    [user?.roles, user?.isSuperAdmin]
  );

  const hasAnyPermission = useCallback(
    (...permissions: string[]) => {
      if (user?.isSuperAdmin) return true;
      return permissions.some((p) => user?.permissions?.includes(p));
    },
    [user?.permissions, user?.isSuperAdmin]
  );

  // Mirrors the Map<"resource.field", Set<FieldAction>> the backend builds
  // in get-auth-context.util.ts — O(1) lookup instead of a per-render
  // linear .find() over the whole fieldPermissions array.
  const fieldPermissionMap = useMemo(() => {
    const map = new Map<string, Set<FieldAction>>();
    for (const entry of user?.fieldPermissions ?? []) {
      map.set(
        protectedFieldKey(entry.resource, entry.field),
        new Set(entry.actions as FieldAction[])
      );
    }
    return map;
  }, [user?.fieldPermissions]);

  const hasFieldAction = useCallback(
    (resource: string, field: string, action: FieldAction) => {
      if (user?.isSuperAdmin) return true;
      const actions = fieldPermissionMap.get(protectedFieldKey(resource, field));
      return actions?.has(action) ?? false;
    },
    [fieldPermissionMap, user?.isSuperAdmin]
  );

  const canReadField = useCallback(
    (resource: string, field: string) => hasFieldAction(resource, field, "read"),
    [hasFieldAction]
  );

  // `mode` picks the write action: create-forms need a `create` grant,
  // edit-forms/upsert-tabs need `update`. Defaults to "update" since most
  // call sites are edit contexts.
  const canWriteField = useCallback(
    (resource: string, field: string, mode: "create" | "update" = "update") =>
      hasFieldAction(resource, field, mode),
    [hasFieldAction]
  );

  return useMemo(
    () => ({
      hasPermission,
      hasRole,
      hasAnyPermission,
      hasFieldAction,
      canReadField,
      canWriteField,
    }),
    [hasPermission, hasRole, hasAnyPermission, hasFieldAction, canReadField, canWriteField]
  );
}

type Props = {
  user: CurrentUser | null;
  children: React.ReactNode;
};

export const UserProvider = ({ user, children }: Props) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};
