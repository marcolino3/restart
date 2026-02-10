"use client";

import { createContext, useCallback, useContext, useMemo } from "react";

export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  permissions: string[];
  orgId?: string;
  isSuperAdmin: boolean;
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

  return useMemo(
    () => ({ hasPermission, hasRole, hasAnyPermission }),
    [hasPermission, hasRole, hasAnyPermission]
  );
}

type Props = {
  user: CurrentUser | null;
  children: React.ReactNode;
};

export const UserProvider = ({ user, children }: Props) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};
