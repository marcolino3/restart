"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { InitialsAvatar } from "@/components/common/InitialsAvatar";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import { CATEGORY_ORDER, detectLevel, groupCatalog } from "../permission-catalog";
import { levelBadgeVariant } from "../lib/level-meta";

type RoleCardProps = {
  role: RoleWithPermissions;
  availableCodes: Set<string>;
};

export function RoleCard({ role, availableCodes }: RoleCardProps) {
  const t = useTranslations("Roles");
  const grantedCodes = new Set((role.permissions ?? []).map((p) => p.code));
  const categories = CATEGORY_ORDER.filter((category) =>
    groupCatalog(availableCodes).some((c) => c.category === category),
  );

  const totalGranted = grantedCodes.size;
  const fullAccessCount = categories.filter(
    (category) => detectLevel(category, grantedCodes, availableCodes) === 3,
  ).length;
  const lockedCount = categories.filter(
    (category) => detectLevel(category, grantedCodes, availableCodes) === 0,
  ).length;

  const members = role.memberships ?? [];

  return (
    <Link
      href={`/admin/roles/${role.id}`}
      className="flex flex-col gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{role.name}</div>
          <Badge variant={role.isSystem ? "secondary" : "outline"} className="mt-1">
            {role.isSystem ? t("systemRole") : t("customRole")}
          </Badge>
        </div>
      </div>

      <div className="flex gap-1">
        {categories.map((category) => {
          const level = detectLevel(category, grantedCodes, availableCodes);
          return (
            <Badge
              key={category}
              variant={levelBadgeVariant(level)}
              className="h-1.5 flex-1 rounded-full p-0"
              title={t(`category.${category}` as const)}
            />
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        {t("overview.summaryLine", {
          granted: totalGranted,
          categoryCount: categories.length,
          fullAccessCount,
          lockedCount,
        })}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((member) => (
            <InitialsAvatar
              key={member.id}
              firstName={member.user?.firstName}
              lastName={member.user?.lastName}
              className="size-7 border-2 border-card"
            />
          ))}
          {members.length > 4 ? (
            <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-xs text-muted-foreground">
              +{members.length - 4}
            </span>
          ) : null}
        </div>
        <span className="text-sm font-medium text-primary">{t("overview.manageAccess")} →</span>
      </div>
    </Link>
  );
}
