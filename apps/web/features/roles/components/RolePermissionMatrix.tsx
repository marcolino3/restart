"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronRightIcon, CopyIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHead } from "@/components/common/PageHead";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
} from "../permission-catalog";
import {
  type FieldAction,
  type GroupedFieldResource,
  groupFieldCatalog,
} from "../field-catalog";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { deleteRoleAction } from "../actions/delete-role.action";
import { getRoleFieldPermissionsAction } from "../actions/get-role-field-permissions.action";
import { updateRoleFieldPermissionsAction } from "../actions/update-role-field-permissions.action";

type Props = {
  roles: RoleWithPermissions[];
  permissions: PermissionItem[];
};

export function RolePermissionMatrix({
  roles: initialRoles,
  permissions,
}: Props) {
  const t = useTranslations("Roles");
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [openRoleIds, setOpenRoleIds] = useState<Set<string>>(new Set());
  const [pendingCodes, setPendingCodes] = useState<Set<string>>(new Set());

  const groupedFields = useMemo(() => groupFieldCatalog(), []);

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
    <>
      <PageHead
        title={t("title")}
        subtitle={t("rolesCount", { count: roles.length })}
        action={<CreateRoleDialog onCreated={() => router.refresh()} />}
      />
      <Card>
        <CardHeader>
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
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                const isOpen = openRoleIds.has(role.id);
                const roleVisibleCodes = new Set(
                  groupedCategories.flatMap((g) => g.codes),
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
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <CreateRoleDialog
                            duplicateFromRoleId={role.id}
                            duplicateFromRoleName={role.name ?? undefined}
                            onCreated={() => router.refresh()}
                            trigger={
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title={t("duplicateRoleTitle")}
                              >
                                <CopyIcon className="size-4" />
                              </Button>
                            }
                          />
                          {!role.isSystem ? (
                            <DeleteConfirmationDialog
                              itemName={role.name ?? ""}
                              onConfirm={async () => {
                                const result = await deleteRoleAction(role.id);
                                return { success: result.success };
                              }}
                              onSuccess={() => router.refresh()}
                            />
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                    {isOpen ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={4} className="bg-muted/30 p-4">
                          <RolePermissionEditor
                            role={role}
                            groupedCategories={groupedCategories}
                            groupedFields={groupedFields}
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
    </>
  );
}

type EditorProps = {
  role: RoleWithPermissions;
  groupedCategories: GroupedCategory[];
  groupedFields: GroupedFieldResource[];
  pendingCodes: Set<string>;
  onTogglePermission: (code: string) => void;
  onToggleCategory: (codes: string[], allChecked: boolean) => void;
};

function RolePermissionEditor({
  role,
  groupedCategories,
  groupedFields,
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
    <div className="space-y-4">
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
    <RoleFieldPermissionSection role={role} groupedFields={groupedFields} />
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

const FIELD_ACTIONS: FieldAction[] = ["create", "read", "update", "delete"];

type FieldSectionProps = {
  role: RoleWithPermissions;
  groupedFields: GroupedFieldResource[];
};

function RoleFieldPermissionSection({ role, groupedFields }: FieldSectionProps) {
  const t = useTranslations("Roles");
  const [entries, setEntries] = useState<
    { resource: string; field: string; actions: FieldAction[] }[] | null
  >(null);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getRoleFieldPermissionsAction(role.id).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setEntries(
          result.data.map((e) => ({
            resource: e.resource,
            field: e.field,
            actions: e.actions as FieldAction[],
          }))
        );
      } else {
        setEntries([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [role.id]);

  if (entries === null) {
    return (
      <p className="text-muted-foreground text-xs">{t("loadingFields")}</p>
    );
  }

  function entryFor(resource: string, field: string) {
    return entries!.find((e) => e.resource === resource && e.field === field);
  }

  async function toggleFieldAction(
    resource: string,
    field: string,
    action: FieldAction
  ) {
    const key = `${resource}.${field}.${action}`;
    const current = entryFor(resource, field);
    const currentActions = current?.actions ?? [];
    const nextActions = currentActions.includes(action)
      ? currentActions.filter((a) => a !== action)
      : [...currentActions, action];

    const nextEntries = entries!.filter(
      (e) => !(e.resource === resource && e.field === field)
    );
    if (nextActions.length > 0) {
      nextEntries.push({ resource, field, actions: nextActions });
    }

    const previous = entries!;
    setEntries(nextEntries);
    setPendingKeys((p) => new Set(p).add(key));
    try {
      const result = await updateRoleFieldPermissionsAction(
        role.id,
        nextEntries
      );
      if (!result.success) {
        setEntries(previous);
        toast.error(t("saveError"));
      }
    } finally {
      setPendingKeys((p) => {
        const next = new Set(p);
        next.delete(key);
        return next;
      });
    }
  }

  if (groupedFields.length === 0) return null;

  return (
    <div className="bg-card rounded-lg border">
      <header className="border-b px-4 py-3">
        <h4 className="text-sm font-semibold">{t("fieldPermissionsTitle")}</h4>
        <p className="text-muted-foreground text-xs">
          {t("fieldPermissionsDescription")}
        </p>
      </header>
      <div className="divide-y">
        {groupedFields.map((group) => (
          <div key={group.resource} className="p-4">
            <div className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
              {t(`fieldResource.${group.resource}` as const)}
            </div>
            <div className="flex flex-col gap-2">
              {group.fields.map((f) => {
                const entry = entryFor(f.resource, f.field);
                const entryActions = entry?.actions ?? [];
                return (
                  <div
                    key={`${f.resource}.${f.field}`}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span className="text-sm">
                      {t(`fieldName.${f.resource}.${f.field}` as const)}
                    </span>
                    <div className="flex gap-1">
                      {FIELD_ACTIONS.filter((a) => f.actions.includes(a)).map(
                        (action) => {
                          const key = `${f.resource}.${f.field}.${action}`;
                          const checked = entryActions.includes(action);
                          return (
                            <Badge
                              key={action}
                              variant={checked ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer text-[10px] uppercase select-none",
                                pendingKeys.has(key) && "opacity-50"
                              )}
                              onClick={() =>
                                !pendingKeys.has(key) &&
                                toggleFieldAction(f.resource, f.field, action)
                              }
                            >
                              {t(`fieldAction.${action}` as const)}
                            </Badge>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
