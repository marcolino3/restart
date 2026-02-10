"use client";

import { usePermissions } from "@/features/users/context/current-user.context";

type Props = {
  permission?: string;
  anyPermission?: string[];
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function PermissionGate({
  permission,
  anyPermission,
  role,
  fallback = null,
  children,
}: Props) {
  const { hasPermission, hasAnyPermission, hasRole } = usePermissions();

  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (anyPermission && anyPermission.length > 0) {
    allowed = hasAnyPermission(...anyPermission);
  } else if (role) {
    allowed = hasRole(role);
  }

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
