"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { InitialsAvatar } from "@/components/common/InitialsAvatar";
import { ROUTES } from "@/constants/routes";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import { CATEGORY_ORDER, detectLevel, groupCatalog } from "../permission-catalog";
import { levelBadgeVariant } from "../lib/level-meta";
import { RoleIcon } from "../lib/role-icon";
import { roleDisplayName } from "../lib/role-display-name";

type RoleCardProps = {
  role: RoleWithPermissions;
  availableCodes: Set<string>;
};

export function RoleCard({ role, availableCodes }: RoleCardProps) {
  const t = useTranslations("Roles");
  const locale = useLocale();
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
  const displayName = roleDisplayName(t, role);
  const description = role.systemCode
    ? t.has(`systemRoleDescription.${role.systemCode}`)
      ? t(`systemRoleDescription.${role.systemCode}` as const)
      : null
    : null;

  return (
    <Link
      href={ROUTES.admin.roleDetail(locale, role.id)}
      className="flex flex-col gap-3 rounded-2xl border bg-card px-5 pb-4 pt-[18px] transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
            <RoleIcon systemCode={role.systemCode} className="size-4.5" />
          </span>
          <div>
            <div className="font-medium">{displayName}</div>
            {role.systemCode ? (
              <div className="font-mono text-xs text-muted-foreground">{role.systemCode}</div>
            ) : null}
          </div>
        </div>
        <Badge variant={role.isSystem ? "sky" : "slate"}>
          {role.isSystem ? t("systemRole") : t("customRole")}
        </Badge>
      </div>

      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}

      <div className="flex gap-[3px]">
        {categories.map((category) => {
          const level = detectLevel(category, grantedCodes, availableCodes);
          return (
            <Badge
              key={category}
              variant={levelBadgeVariant(level)}
              className="h-[26px] flex-1 rounded-[6px] p-0"
              title={t(`category.${category}` as const)}
            />
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        {t.rich(lockedCount > 0 ? "overview.summaryLineLocked" : "overview.summaryLine", {
          granted: totalGranted,
          totalCount: availableCodes.size,
          fullAccessCount,
          lockedCount,
          strong: (chunks) => (
            <span className="font-semibold text-foreground">{chunks}</span>
          ),
        })}
      </p>

      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          {members.length > 0 ? (
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
          ) : null}
          <span className="text-sm text-muted-foreground">
            {members.length === 0
              ? t("overview.noMembers")
              : t("overview.membersCount", { count: members.length })}
          </span>
        </div>
        <span className="text-sm font-medium text-primary">{t("overview.manageAccess")} →</span>
      </div>
    </Link>
  );
}
