"use client";

import { useCallback, useOptimistic, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateRolePermissionsAction } from "../actions/update-role-permissions.action";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import type { PermissionItem } from "../actions/get-permissions.action";

type Props = {
  roles: RoleWithPermissions[];
  permissions: PermissionItem[];
};

export function RolePermissionMatrix({ roles, permissions }: Props) {
  const [optimisticRoles, setOptimisticRoles] = useOptimistic(roles);
  const [isPending, startTransition] = useTransition();

  const hasPermission = useCallback(
    (role: RoleWithPermissions, permCode: string) => {
      return role.permissions?.some((p) => p.code === permCode) ?? false;
    },
    []
  );

  const handleToggle = useCallback(
    (role: RoleWithPermissions, permCode: string) => {
      const currentCodes =
        role.permissions?.map((p) => p.code) ?? [];
      const newCodes = currentCodes.includes(permCode)
        ? currentCodes.filter((c) => c !== permCode)
        : [...currentCodes, permCode];

      startTransition(async () => {
        setOptimisticRoles((prev) =>
          prev.map((r) =>
            r.id === role.id
              ? {
                  ...r,
                  permissions: permissions.filter((p) =>
                    newCodes.includes(p.code)
                  ),
                }
              : r
          )
        );

        await updateRolePermissionsAction(role.id, newCodes);
      });
    },
    [permissions, setOptimisticRoles]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rollen & Berechtigungen</CardTitle>
        <CardDescription>
          Verwalten Sie die Berechtigungen pro Rolle in Ihrer Organisation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background min-w-[160px]">
                  Rolle
                </TableHead>
                {permissions.map((perm) => (
                  <TableHead
                    key={perm.code}
                    className="text-center text-xs min-w-[100px]"
                    title={perm.description ?? perm.name}
                  >
                    {perm.code}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimisticRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="sticky left-0 bg-background font-medium">
                    {role.name ?? role.systemCode}
                  </TableCell>
                  {permissions.map((perm) => (
                    <TableCell key={perm.code} className="text-center">
                      <Checkbox
                        checked={hasPermission(role, perm.code)}
                        disabled={isPending}
                        onCheckedChange={() => handleToggle(role, perm.code)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
