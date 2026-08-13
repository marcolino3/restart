"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CategoryIcon } from "../lib/category-icon";

type FieldLevel = 0 | 1 | 2;

const FIELD_LEVEL_ORDER: FieldLevel[] = [0, 1, 2];

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
  const [openResources, setOpenResources] = useState<Set<string>>(new Set());
  const [showAllIndividual, setShowAllIndividual] = useState(false);

  function toggleOpen(resource: string) {
    setOpenResources((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) next.delete(resource);
      else next.add(resource);
      return next;
    });
  }

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

  function setFieldLevel(resource: string, field: { field: string; actions: FieldAction[] }, level: FieldLevel) {
    const withoutField = entries!.filter((e) => !(e.resource === resource && e.field === field.field));
    const actions = FIELD_LEVEL_ACTIONS[level].filter((a) => field.actions.includes(a)) as FieldAction[];
    const next = actions.length > 0 ? [...withoutField, { resource, field: field.field, actions }] : withoutField;
    void persist(next as RoleFieldPermissionEntry[], `${resource}.${field.field}`);
  }

  function setAllGroupsLevel(level: FieldLevel) {
    const next: RoleFieldPermissionEntry[] = [];
    for (const group of groupedFields) {
      const parentLevel = group.category
        ? detectLevel(group.category, grantedCodes, availableCodes)
        : null;
      if (parentLevel === 0) continue;
      for (const f of group.fields) {
        const actions = FIELD_LEVEL_ACTIONS[level].filter((a) => f.actions.includes(a)) as FieldAction[];
        if (actions.length > 0) next.push({ resource: f.resource, field: f.field, actions });
      }
    }
    void persist(next, "all");
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-bold">{t("fieldPermissionsTitle")}</h3>
          <p className="text-sm text-muted-foreground">{t("fieldPermissionsDescription")}</p>
        </div>
        <Badge variant="outline" className="font-mono">
          {t("fieldPermissionsCount", { granted: grantedFieldCount, total: totalFields })}
        </Badge>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-sm">
          <span className="text-muted-foreground">{t("detail.setAllTo")}</span>
          {FIELD_LEVEL_ORDER.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setAllGroupsLevel(l)}
              className="rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {t(`level.${l}` as const)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSpecialOnly((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
              specialOnly && "border-primary bg-primary/10 text-primary",
            )}
          >
            {specialOnly ? <CheckIcon className="size-3.5" /> : null}
            {t("fieldPermissionsSpecialOnly", { count: specialCount })}
          </button>
          <button
            type="button"
            onClick={() => setShowAllIndividual((v) => !v)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
              showAllIndividual &&
                "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
            )}
          >
            {t("detail.showAllIndividual")}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
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

            const visibleFields = group.fields.filter((f) => !specialOnly || isSpecialCategory(f));
            const grantedFieldsInGroup = group.fields.filter(
              (f) => (entryFor(f.resource, f.field)?.actions ?? []).length > 0,
            ).length;
            const isOpen = showAllIndividual || openResources.has(group.resource);

            return (
              <div
                key={group.resource}
                className={cn(
                  "overflow-hidden rounded-xl border",
                  categoryLocked && "opacity-50",
                )}
              >
                <header className="flex flex-wrap items-center gap-4 px-4 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-field text-muted-foreground">
                      {group.category ? (
                        <CategoryIcon category={group.category} className="size-4" />
                      ) : null}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[13.5px] font-semibold">
                        {t(`fieldResource.${group.resource}` as const)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {categoryLocked
                          ? t("fieldGroup.categoryLocked")
                          : t("fieldGroup.fieldCount", {
                              count: group.fields.length,
                              category: group.category
                                ? t(`category.${group.category}` as const)
                                : "",
                            })}
                      </span>
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <Tabs
                      value={groupLevel === null ? "" : String(groupLevel)}
                      onValueChange={(value) => {
                        if (!value || categoryLocked || pendingResources.has(group.resource)) return;
                        setGroupLevel(group.resource, group.fields, Number(value) as FieldLevel);
                      }}
                    >
                      <TabsList
                        variant="segment"
                        className={cn(
                          "border-none bg-level-0",
                          (categoryLocked || pendingResources.has(group.resource)) &&
                            "pointer-events-none opacity-50",
                        )}
                      >
                        {FIELD_LEVEL_ORDER.map((l) => (
                          <TabsTrigger key={l} value={String(l)}>
                            {t(`level.${l}` as const)}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                    <button
                      type="button"
                      onClick={() => toggleOpen(group.resource)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border border-transparent px-2.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                        isOpen && "border-status-amber-foreground text-foreground",
                      )}
                    >
                      {t("detail.individualRights")}
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-level-0 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {grantedFieldsInGroup}/{group.fields.length}
                      </Badge>
                    </button>
                  </div>
                </header>

                {isOpen ? (
                <div className="border-t bg-muted/40">
                  {visibleFields.map((f) => {
                    const fieldLevel = detectFieldLevel(
                      (entryFor(f.resource, f.field)?.actions ?? []) as FieldAction[],
                    );
                    const fieldKey = `${f.resource}.${f.field}`;
                    return (
                      <div
                        key={fieldKey}
                        className="flex items-center justify-between gap-4 border-b px-4 py-2.5"
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="break-words text-[13px]">
                            {t(`fieldName.${f.resource}.${f.field}` as const)}
                          </span>
                          {isSpecialCategory(f) ? (
                            <Badge variant="rose" className="shrink-0 text-[10px]">
                              {t("fieldGroup.specialCategory")}
                            </Badge>
                          ) : null}
                        </span>
                        <Tabs
                          value={fieldLevel === null ? "" : String(fieldLevel)}
                          onValueChange={(value) => {
                            if (!value || categoryLocked || pendingResources.has(fieldKey)) return;
                            setFieldLevel(f.resource, f, Number(value) as FieldLevel);
                          }}
                        >
                          <TabsList
                            variant="segment"
                            className={cn(
                              "shrink-0 border-none bg-level-0",
                              (categoryLocked || pendingResources.has(fieldKey)) &&
                                "pointer-events-none opacity-50",
                            )}
                          >
                            {FIELD_LEVEL_ORDER.map((l) => (
                              <TabsTrigger key={l} value={String(l)}>
                                {t(`level.${l}` as const)}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      </div>
                    );
                  })}
                </div>
                ) : null}
              </div>
            );
          })}
      </div>
    </div>
  );
}
