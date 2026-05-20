"use client";

import { Fragment, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { updateRolePermissionsAction } from "../actions/update-role-permissions.action";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import type { PermissionItem } from "../actions/get-permissions.action";
import {
  type ActionKey,
  type FeatureKey,
  type GroupedCategory,
  groupCatalog,
  isAdminOnlyCategory,
} from "../permission-catalog";

// System roles tied to admin personas (ADMIN, HR, OFFICE). These are the
// only system roles for which the org/userManagement/teams categories are
// offered by default. TEAM_LEAD/EMPLOYEE and all custom roles are filtered
// out unless they already hold a permission from such a category — keeps
// TEAM_LEAD's TEAM_MANAGE editable without exposing TEAM_CREATE/_DELETE.
const ADMIN_ROLE_SYSTEM_CODES: ReadonlySet<string> = new Set([
  "ORG_OWNER",
  "ORG_ADMIN",
  "HR_MANAGER",
  "OFFICE",
]);

function isAdminRole(role: RoleWithPermissions): boolean {
  return !!role.systemCode && ADMIN_ROLE_SYSTEM_CODES.has(role.systemCode);
}

function categoriesForRole(
  role: RoleWithPermissions,
  allGrouped: GroupedCategory[],
): GroupedCategory[] {
  const adminRole = isAdminRole(role);
  if (adminRole) return allGrouped;
  const roleCodes = new Set(role.permissions?.map((p) => p.code) ?? []);
  return allGrouped.filter((g) => {
    if (!isAdminOnlyCategory(g.category)) return true;
    return g.codes.some((c) => roleCodes.has(c));
  });
}

type Props = {
  roles: RoleWithPermissions[];
  permissions: PermissionItem[];
};

export function RolePermissionMatrix({
  roles: initialRoles,
  permissions,
}: Props) {
  const t = useTranslations("Roles");
  const [roles, setRoles] = useState(initialRoles);
  const [openRoleIds, setOpenRoleIds] = useState<Set<string>>(new Set());
  const [pendingCodes, setPendingCodes] = useState<Set<string>>(new Set());

  const availableCodes = useMemo(
    () => new Set(permissions.map((p) => p.code)),
    [permissions]
  );

  const groupedCategories = useMemo(
    () => groupCatalog(availableCodes),
    [availableCodes]
  );

  function toggleRow(roleId: string) {
    setOpenRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }

  async function persist(roleId: string, newCodes: string[]) {
    const previous = roles.find((r) => r.id === roleId);
    if (!previous) return;

    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId
          ? {
              ...r,
              permissions: permissions
                .filter((p) => newCodes.includes(p.code))
                .map((p) => ({ id: p.id, code: p.code, name: p.name })),
            }
          : r
      )
    );

    const result = await updateRolePermissionsAction(roleId, newCodes);
    if (!result.success) {
      setRoles((prev) => prev.map((r) => (r.id === roleId ? previous : r)));
      toast.error(t("saveError"));
    }
  }

  async function togglePermission(role: RoleWithPermissions, code: string) {
    const current = new Set(role.permissions?.map((p) => p.code) ?? []);
    if (current.has(code)) current.delete(code);
    else current.add(code);

    setPendingCodes((p) => new Set(p).add(code));
    try {
      await persist(role.id, Array.from(current));
    } finally {
      setPendingCodes((p) => {
        const next = new Set(p);
        next.delete(code);
        return next;
      });
    }
  }

  async function toggleCategory(
    role: RoleWithPermissions,
    codes: string[],
    allChecked: boolean
  ) {
    const current = new Set(role.permissions?.map((p) => p.code) ?? []);
    if (allChecked) codes.forEach((c) => current.delete(c));
    else codes.forEach((c) => current.add(c));

    setPendingCodes((p) => {
      const next = new Set(p);
      codes.forEach((c) => next.add(c));
      return next;
    });
    try {
      await persist(role.id, Array.from(current));
    } finally {
      setPendingCodes((p) => {
        const next = new Set(p);
        codes.forEach((c) => next.delete(c));
        return next;
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-xs">{t("savingHint")}</p>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>{t("columnRole")}</TableHead>
                <TableHead className="w-32 text-right">
                  {t("columnPermissions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                const isOpen = openRoleIds.has(role.id);
                const roleCategories = categoriesForRole(role, groupedCategories);
                const roleVisibleCodes = new Set(
                  roleCategories.flatMap((g) => g.codes),
                );
                const totalPermissions = roleVisibleCodes.size;
                const count =
                  role.permissions?.filter((p) => roleVisibleCodes.has(p.code))
                    .length ?? 0;
                return (
                  <Fragment key={role.id}>
                    <TableRow
                      onClick={() => toggleRow(role.id)}
                      className="hover:bg-muted/50 cursor-pointer"
                      data-state={isOpen ? "open" : "closed"}
                    >
                      <TableCell className="w-10">
                        <ChevronRightIcon
                          className={cn(
                            "text-muted-foreground size-4 transition-transform",
                            isOpen && "rotate-90"
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {role.name ?? role.systemCode}
                          </span>
                          {role.isSystem ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {t("systemRole")}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-[11px]">
                          {count} / {totalPermissions}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {isOpen ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={3} className="bg-muted/30 p-4">
                          <RolePermissionEditor
                            role={role}
                            groupedCategories={roleCategories}
                            pendingCodes={pendingCodes}
                            onTogglePermission={(code) =>
                              togglePermission(role, code)
                            }
                            onToggleCategory={(codes, allChecked) =>
                              toggleCategory(role, codes, allChecked)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

type EditorProps = {
  role: RoleWithPermissions;
  groupedCategories: GroupedCategory[];
  pendingCodes: Set<string>;
  onTogglePermission: (code: string) => void;
  onToggleCategory: (codes: string[], allChecked: boolean) => void;
};

function RolePermissionEditor({
  role,
  groupedCategories,
  pendingCodes,
  onTogglePermission,
  onToggleCategory,
}: EditorProps) {
  const t = useTranslations("Roles");
  const roleCodes = useMemo(
    () => new Set(role.permissions?.map((p) => p.code) ?? []),
    [role.permissions]
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groupedCategories.map((group) => {
        const checkedCount = group.codes.filter((c) =>
          roleCodes.has(c)
        ).length;
        const allChecked = checkedCount === group.codes.length;
        const someChecked = checkedCount > 0 && !allChecked;

        return (
          <section
            key={group.category}
            className="bg-card flex flex-col rounded-lg border"
          >
            <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">
                  {t(`category.${group.category}` as const)}
                </h4>
                <Badge
                  variant={
                    allChecked
                      ? "default"
                      : someChecked
                        ? "secondary"
                        : "outline"
                  }
                  className="text-[10px]"
                >
                  {checkedCount} / {group.codes.length}
                </Badge>
              </div>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => onToggleCategory(group.codes, allChecked)}
              >
                {allChecked
                  ? t("deselectAllInCategory")
                  : t("selectAllInCategory")}
              </Button>
            </header>
            <div className="flex flex-col gap-3 p-4">
              {group.features.map((feature) => (
                <FeatureRow
                  key={feature.feature}
                  feature={feature.feature}
                  actions={feature.actions}
                  roleCodes={roleCodes}
                  pendingCodes={pendingCodes}
                  onToggle={onTogglePermission}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

type FeatureRowProps = {
  feature: FeatureKey;
  actions: { code: string; action: ActionKey }[];
  roleCodes: Set<string>;
  pendingCodes: Set<string>;
  onToggle: (code: string) => void;
};

function FeatureRow({
  feature,
  actions,
  roleCodes,
  pendingCodes,
  onToggle,
}: FeatureRowProps) {
  const t = useTranslations("Roles");
  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {t(`feature.${feature}` as const)}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {actions.map(({ code, action }) => {
          const id = `perm-${code}`;
          const checked = roleCodes.has(code);
          return (
            <div key={code} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={checked}
                disabled={pendingCodes.has(code)}
                onCheckedChange={() => onToggle(code)}
              />
              <Label
                htmlFor={id}
                className="cursor-pointer text-sm font-normal"
              >
                {t(`action.${action}` as const)}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
