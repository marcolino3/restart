"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import { CATEGORY_ORDER, detectLevel, groupCatalog } from "../permission-catalog";
import { levelBadgeVariant } from "../lib/level-meta";

type RoleComparisonMatrixProps = {
  roles: RoleWithPermissions[];
  availableCodes: Set<string>;
};

export function RoleComparisonMatrix({ roles, availableCodes }: RoleComparisonMatrixProps) {
  const t = useTranslations("Roles");
  const grouped = groupCatalog(availableCodes);
  const categories = CATEGORY_ORDER.filter((category) =>
    grouped.some((c) => c.category === category),
  );

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">{t("comparison.category")}</th>
            {roles.map((role) => (
              <th key={role.id} className="min-w-32 p-3 text-left font-medium">
                {role.name}
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
                  <Link
                    href={`/admin/roles?domain=${category}`}
                    className="font-medium hover:underline"
                  >
                    {t(`category.${category}` as const)}
                  </Link>
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
                    <td key={role.id} className="p-3">
                      <Badge variant={levelBadgeVariant(level)}>
                        {level === null ? t("level.individual") : t(`level.${level}` as const)}
                      </Badge>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
