"use client";

import { createContext, useCallback, useContext, useMemo } from "react";

export type FieldAction = "create" | "read" | "update" | "delete";

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

  const hasFieldAction = useCallback(
    (resource: string, field: string, action: FieldAction) => {
      if (user?.isSuperAdmin) return true;
      const entry = user?.fieldPermissions?.find(
        (e) => e.resource === resource && e.field === field
      );
      return entry?.actions?.includes(action) ?? false;
    },
    [user?.fieldPermissions, user?.isSuperAdmin]
  );

  const canReadField = useCallback(
    (resource: string, field: string) => hasFieldAction(resource, field, "read"),
    [hasFieldAction]
  );

  const canWriteField = useCallback(
    (resource: string, field: string) => hasFieldAction(resource, field, "update"),
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
