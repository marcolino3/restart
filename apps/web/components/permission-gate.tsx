"use client";

import { usePermissions } from "@/features/users/context/current-user.context";

type Props = {
  permission?: string;
  anyPermission?: string[];
  role?: string;
  readField?: { resource: string; field: string };
  writeField?: { resource: string; field: string };
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function PermissionGate({
  permission,
  anyPermission,
  role,
  readField,
  writeField,
  fallback = null,
  children,
}: Props) {
  const { hasPermission, hasAnyPermission, hasRole, canReadField, canWriteField } =
    usePermissions();

  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (anyPermission && anyPermission.length > 0) {
    allowed = hasAnyPermission(...anyPermission);
  } else if (role) {
    allowed = hasRole(role);
  } else if (readField) {
    allowed = canReadField(readField.resource, readField.field);
  } else if (writeField) {
    allowed = canWriteField(writeField.resource, writeField.field);
  }

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
