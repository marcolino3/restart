"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { updateRolePermissionsAction } from "../actions/update-role-permissions.action";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import type { PermissionItem } from "../actions/get-permissions.action";
import {
  codesForLevel,
  detectLevel,
  groupCatalog,
  isAdminOnlyCategory,
  type CategoryKey,
  type PermissionLevel,
} from "../permission-catalog";
import { LEVEL_ORDER } from "../lib/level-meta";

type RoleDomainEditorProps = {
  role: RoleWithPermissions;
  permissions: PermissionItem[];
  expandedCategory?: string;
  onRoleChange: (role: RoleWithPermissions) => void;
};

export function RoleDomainEditor({
  role,
  permissions,
  expandedCategory,
  onRoleChange,
}: RoleDomainEditorProps) {
  const t = useTranslations("Roles");
  const availableCodes = new Set(permissions.map((p) => p.code));
  const groupedCategories = groupCatalog(availableCodes);
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(expandedCategory ? [expandedCategory] : []),
  );
  const [pendingCodes, setPendingCodes] = useState<Set<string>>(new Set());

  const grantedCodes = new Set((role.permissions ?? []).map((p) => p.code));

  function toggleOpen(category: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  async function persist(newCodes: string[], touchedCodes: string[]) {
    const previous = role;
    setPendingCodes((prev) => new Set([...prev, ...touchedCodes]));
    onRoleChange({
      ...role,
      permissions: permissions
        .filter((p) => newCodes.includes(p.code))
        .map((p) => ({ id: p.id, code: p.code, name: p.name })),
    });

    try {
      const result = await updateRolePermissionsAction(role.id, newCodes);
      if (!result.success) {
        onRoleChange(previous);
        toast.error(t("saveError"));
      }
    } finally {
      setPendingCodes((prev) => {
        const next = new Set(prev);
        touchedCodes.forEach((c) => next.delete(c));
        return next;
      });
    }
  }

  function setCategoryLevel(categoryCodes: string[], category: CategoryKey, level: PermissionLevel) {
    const next = new Set(grantedCodes);
    categoryCodes.forEach((c) => next.delete(c));
    codesForLevel(category, level, availableCodes).forEach((c) => next.add(c));
    void persist(Array.from(next), categoryCodes);
  }

  function toggleCode(code: string) {
    const next = new Set(grantedCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    void persist(Array.from(next), [code]);
  }

  return (
    <div className="flex flex-col gap-3">
      {groupedCategories.map((group) => {
        const level = detectLevel(group.category, grantedCodes, availableCodes);
        const disabled = isAdminOnlyCategory(group.category) && !role.isSystem && level === 0;
        const isOpen = openCategories.has(group.category);
        const checkedCount = group.codes.filter((c) => grantedCodes.has(c)).length;

        return (
          <section key={group.category} className="rounded-lg border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-3 p-4">
              <button
                type="button"
                onClick={() => toggleOpen(group.category)}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <ChevronRightIcon
                  className={cn("size-4 transition-transform", isOpen && "rotate-90")}
                />
                {t(`category.${group.category}` as const)}
                <span className="text-xs font-normal text-muted-foreground">
                  {checkedCount} / {group.codes.length}
                </span>
                {level === null ? (
                  <Badge variant="rose">{t("level.individual")}</Badge>
                ) : null}
              </button>

              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={level === null ? undefined : String(level)}
                onValueChange={(value) => {
                  if (!value || disabled) return;
                  setCategoryLevel(group.codes, group.category, Number(value) as PermissionLevel);
                }}
                disabled={disabled}
              >
                {LEVEL_ORDER.map((l) => (
                  <ToggleGroupItem key={l} value={String(l)}>
                    {t(`level.${l}` as const)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </header>

            {isOpen ? (
              <div className="flex flex-col gap-3 border-t p-4">
                {group.features.map((feature) => (
                  <div key={feature.feature} className="flex flex-col gap-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t(`feature.${feature.feature}` as const)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {feature.actions.map(({ code, action }) => {
                        const id = `perm-${code}`;
                        return (
                          <div key={code} className="flex items-center gap-2">
                            <Checkbox
                              id={id}
                              checked={grantedCodes.has(code)}
                              disabled={pendingCodes.has(code) || disabled}
                              onCheckedChange={() => toggleCode(code)}
                            />
                            <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
                              {t(`action.${action}` as const)}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
