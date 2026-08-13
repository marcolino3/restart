"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import { CATEGORY_ORDER, detectLevel, groupCatalog } from "../permission-catalog";
import { levelBadgeVariant } from "../lib/level-meta";
import { roleDisplayName } from "../lib/role-display-name";

type RoleComparisonMatrixProps = {
  roles: RoleWithPermissions[];
  availableCodes: Set<string>;
};

export function RoleComparisonMatrix({ roles, availableCodes }: RoleComparisonMatrixProps) {
  const t = useTranslations("Roles");
  const locale = useLocale();
  const grouped = groupCatalog(availableCodes);
  const categories = CATEGORY_ORDER.filter((category) =>
    grouped.some((c) => c.category === category),
  );

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("comparison.category")}
            </th>
            {roles.map((role) => (
              <th
                key={role.id}
                className="min-w-32 p-3 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase"
              >
                {roleDisplayName(t, role)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const codeCount =
              grouped.find((c) => c.category === category)?.codes.length ?? 0;
            return (
              <tr key={category} className="border-b last:border-0">
                <td className="p-3">
                  <div className="font-medium">{t(`category.${category}` as const)}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("comparison.permissionCount", { count: codeCount })}
                  </div>
                </td>
                {roles.map((role) => {
                  const grantedCodes = new Set(
                    (role.permissions ?? []).map((p) => p.code),
                  );
                  const level = detectLevel(category, grantedCodes, availableCodes);
                  return (
                    <td key={role.id} className="p-3 text-center">
                      <Link href={`${ROUTES.admin.roleDetail(locale, role.id)}?domain=${category}`}>
                        <Badge variant={levelBadgeVariant(level)} className="cursor-pointer">
                          {level === null ? t("level.individual") : t(`level.${level}` as const)}
                        </Badge>
                      </Link>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/50">
            <td className="p-3 font-medium text-muted-foreground">
              {t("comparison.totalLabel")}
            </td>
            {roles.map((role) => {
              const grantedCount = (role.permissions ?? []).length;
              return (
                <td key={role.id} className="p-3 text-center font-medium">
                  {grantedCount} / {availableCodes.size}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
