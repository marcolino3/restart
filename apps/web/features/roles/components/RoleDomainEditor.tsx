"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CategoryIcon } from "../lib/category-icon";

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
  const [showAllIndividual, setShowAllIndividual] = useState(false);

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
        toast.error(result.error ?? t("saveError"));
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

  function setAllCategoriesLevel(level: PermissionLevel) {
    const next = new Set(grantedCodes);
    const touched: string[] = [];
    for (const group of groupedCategories) {
      if (isAdminOnlyCategory(group.category) && !role.isSystem && level === 0) continue;
      group.codes.forEach((c) => next.delete(c));
      codesForLevel(group.category, level, availableCodes).forEach((c) => next.add(c));
      touched.push(...group.codes);
    }
    void persist(Array.from(next), touched);
  }

  function toggleCode(code: string) {
    const next = new Set(grantedCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    void persist(Array.from(next), [code]);
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-bold">{t("detail.accessPerAreaTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("detail.accessPerAreaDescription")}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-sm">
          <span className="text-muted-foreground">{t("detail.setAllTo")}</span>
          {LEVEL_ORDER.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setAllCategoriesLevel(l)}
              className="rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {t(`level.${l}` as const)}
            </button>
          ))}
        </div>
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

      <div className="mt-4 flex flex-col gap-3">

      {groupedCategories.map((group) => {
        const level = detectLevel(group.category, grantedCodes, availableCodes);
        const disabled = isAdminOnlyCategory(group.category) && !role.isSystem && level === 0;
        const isOpen = showAllIndividual || openCategories.has(group.category);
        const checkedCount = group.codes.filter((c) => grantedCodes.has(c)).length;

        return (
          <div key={group.category} className="overflow-hidden rounded-xl border">
            <header className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span
                  className={cn(
                    "flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-field text-muted-foreground",
                    level === 0 && "opacity-55",
                  )}
                >
                  <CategoryIcon category={group.category} className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-[13.5px] font-semibold">
                    {t(`category.${group.category}` as const)}
                    {level === null ? (
                      <Badge variant="rose">{t("level.individual")}</Badge>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(`categoryDescription.${group.category}` as const)}
                  </span>
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <Tabs
                  value={level === null ? "" : String(level)}
                  onValueChange={(value) => {
                    if (!value || disabled) return;
                    setCategoryLevel(group.codes, group.category, Number(value) as PermissionLevel);
                  }}
                >
                  <TabsList
                    variant="segment"
                    className={cn(
                      "border-none bg-level-0",
                      disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    {LEVEL_ORDER.map((l) => (
                      <TabsTrigger key={l} value={String(l)} disabled={disabled}>
                        {t(`level.${l}` as const)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <button
                  type="button"
                  onClick={() => toggleOpen(group.category)}
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
                    {checkedCount}/{group.codes.length}
                  </Badge>
                </button>
              </div>
            </header>

            {isOpen ? (
              <div className="border-t bg-muted/40">
                {group.features.map((feature) => (
                  <div
                    key={feature.feature}
                    className="flex items-center gap-5 border-b px-4 py-2.5"
                  >
                    <div className="w-40 shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t(`feature.${feature.feature}` as const)}
                    </div>
                    <div className="flex flex-1 flex-wrap gap-2">
                      {feature.actions.map(({ code, action }) => {
                        const checked = grantedCodes.has(code);
                        return (
                          <label
                            key={code}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                              checked
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-background text-foreground hover:border-primary/40",
                              (pendingCodes.has(code) || disabled) &&
                                "cursor-not-allowed opacity-50",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded-[4px] border-2",
                                checked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input bg-background",
                              )}
                            >
                              {checked ? <CheckIcon className="size-2.5" strokeWidth={3.5} /> : null}
                            </span>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              disabled={pendingCodes.has(code) || disabled}
                              onChange={() => toggleCode(code)}
                            />
                            {t(`action.${action}` as const)}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <p className="px-4 py-3 text-[13px] text-muted-foreground">
                  {t("detail.individualRightsHint")}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
      </div>
    </div>
  );
}
