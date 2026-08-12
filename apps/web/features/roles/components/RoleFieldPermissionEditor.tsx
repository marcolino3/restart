"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import {
  getRoleFieldPermissionsAction,
  type RoleFieldPermission,
} from "../actions/get-role-field-permissions.action";
import {
  updateRoleFieldPermissionsAction,
  type RoleFieldPermissionEntry,
} from "../actions/update-role-field-permissions.action";
import { detectLevel } from "../permission-catalog";
import { groupFieldCatalog, isSpecialCategory, type FieldAction } from "../field-catalog";

type FieldLevel = 0 | 1 | 2;

const FIELD_LEVEL_ACTIONS: Record<FieldLevel, FieldAction[]> = {
  0: [],
  1: ["read"],
  2: ["create", "read", "update", "delete"],
};

function detectFieldLevel(actions: FieldAction[]): FieldLevel | null {
  if (actions.length === 0) return 0;
  if (actions.length === 1 && actions[0] === "read") return 1;
  const full: FieldAction[] = ["create", "read", "update", "delete"];
  if (full.every((a) => actions.includes(a))) return 2;
  return null;
}

type RoleFieldPermissionEditorProps = {
  role: RoleWithPermissions;
  availableCodes: Set<string>;
};

export function RoleFieldPermissionEditor({
  role,
  availableCodes,
}: RoleFieldPermissionEditorProps) {
  const t = useTranslations("Roles");
  const groupedFields = useMemo(() => groupFieldCatalog(), []);
  const grantedCodes = new Set((role.permissions ?? []).map((p) => p.code));

  const [entries, setEntries] = useState<RoleFieldPermission[] | null>(null);
  const [pendingResources, setPendingResources] = useState<Set<string>>(new Set());
  const [specialOnly, setSpecialOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRoleFieldPermissionsAction(role.id).then((result) => {
      if (cancelled) return;
      setEntries(result.success ? result.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [role.id]);

  if (entries === null) {
    return <p className="text-xs text-muted-foreground">{t("loadingFields")}</p>;
  }

  const totalFields = groupedFields.reduce((sum, g) => sum + g.fields.length, 0);
  const specialCount = groupedFields.reduce(
    (sum, g) => sum + g.fields.filter(isSpecialCategory).length,
    0,
  );
  const grantedFieldCount = entries.filter((e) => e.actions.length > 0).length;

  function entryFor(resource: string, field: string) {
    return entries!.find((e) => e.resource === resource && e.field === field);
  }

  async function persist(nextEntries: RoleFieldPermissionEntry[], resourceKey: string) {
    const previous = entries!;
    setEntries(nextEntries as RoleFieldPermission[]);
    setPendingResources((prev) => new Set(prev).add(resourceKey));
    try {
      const result = await updateRoleFieldPermissionsAction(role.id, nextEntries);
      if (!result.success) {
        setEntries(previous);
        toast.error(t("saveError"));
      }
    } finally {
      setPendingResources((prev) => {
        const next = new Set(prev);
        next.delete(resourceKey);
        return next;
      });
    }
  }

  function setGroupLevel(resource: string, fields: { field: string; actions: FieldAction[] }[], level: FieldLevel) {
    const withoutResource = entries!.filter((e) => e.resource !== resource);
    const nextForResource = fields
      .map((f) => ({
        resource,
        field: f.field,
        actions: FIELD_LEVEL_ACTIONS[level].filter((a) => f.actions.includes(a)) as FieldAction[],
      }))
      .filter((e) => e.actions.length > 0);
    void persist([...withoutResource, ...nextForResource] as RoleFieldPermissionEntry[], resource);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("fieldPermissionsCount", { granted: grantedFieldCount, total: totalFields })}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={specialOnly} onCheckedChange={setSpecialOnly} />
          {t("fieldPermissionsSpecialOnly", { count: specialCount })}
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {groupedFields
          .filter((group) => !specialOnly || group.fields.some(isSpecialCategory))
          .map((group) => {
            const parentLevel = group.category
              ? detectLevel(group.category, grantedCodes, availableCodes)
              : null;
            const categoryLocked = parentLevel === 0;

            const groupActions = group.fields.map((f) => entryFor(f.resource, f.field)?.actions ?? []);
            const groupLevel = groupActions.every((a) => a.length === 0)
              ? 0
              : groupActions.every((a) => detectFieldLevel(a as FieldAction[]) === 2)
                ? 2
                : groupActions.every((a) => detectFieldLevel(a as FieldAction[]) === 1)
                  ? 1
                  : null;

            return (
              <section
                key={group.resource}
                className={cn(
                  "rounded-lg border bg-card p-4",
                  categoryLocked && "opacity-50",
                )}
              >
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold">
                      {t(`fieldResource.${group.resource}` as const)}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {categoryLocked
                        ? t("fieldGroup.categoryLocked")
                        : t("fieldGroup.fieldCount", {
                            count: group.fields.length,
                            category: group.category
                              ? t(`category.${group.category}` as const)
                              : "",
                          })}
                    </p>
                  </div>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={groupLevel === null ? undefined : String(groupLevel)}
                    onValueChange={(value) => {
                      if (!value || categoryLocked || pendingResources.has(group.resource)) return;
                      setGroupLevel(group.resource, group.fields, Number(value) as FieldLevel);
                    }}
                    disabled={categoryLocked || pendingResources.has(group.resource)}
                  >
                    <ToggleGroupItem value="0">{t("level.0")}</ToggleGroupItem>
                    <ToggleGroupItem value="1">{t("level.1")}</ToggleGroupItem>
                    <ToggleGroupItem value="2">{t("level.2")}</ToggleGroupItem>
                  </ToggleGroup>
                </header>

                <div className="mt-3 flex flex-col gap-1.5">
                  {group.fields.map((f) => (
                    <div
                      key={`${f.resource}.${f.field}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span>{t(`fieldName.${f.resource}.${f.field}` as const)}</span>
                      {isSpecialCategory(f) ? (
                        <Badge variant="rose" className="text-[10px]">
                          {t("fieldGroup.specialCategory")}
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}
