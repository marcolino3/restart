"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InitialsAvatar } from "@/components/common/InitialsAvatar";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { ROUTES } from "@/constants/routes";
import { deleteRoleAction } from "../actions/delete-role.action";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import { CATEGORY_ORDER, detectLevel, groupCatalog } from "../permission-catalog";
import { NAV_PREVIEW_ENTRIES, isNavEntryVisible } from "../lib/nav-visibility";
import { cn } from "@/lib/utils";

type RoleDetailRailProps = {
  role: RoleWithPermissions;
  availableCodes: Set<string>;
  locale: string;
};

export function RoleDetailRail({ role, availableCodes, locale }: RoleDetailRailProps) {
  const t = useTranslations("Roles");
  const tNav = useTranslations("SiteHeader");
  const router = useRouter();

  const grantedCodes = new Set((role.permissions ?? []).map((p) => p.code));
  const categories = CATEGORY_ORDER.filter((category) =>
    groupCatalog(availableCodes).some((c) => c.category === category),
  );
  const fullAccessCategories = categories.filter(
    (category) => detectLevel(category, grantedCodes, availableCodes) === 3,
  );
  const lockedCategories = categories.filter(
    (category) => detectLevel(category, grantedCodes, availableCodes) === 0,
  );
  const progressValue = availableCodes.size
    ? (grantedCodes.size / availableCodes.size) * 100
    : 0;

  const members = role.memberships ?? [];

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border bg-card p-4">
        <h4 className="text-sm font-semibold">{t("detail.overview")}</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("detail.grantedOfTotal", {
            granted: grantedCodes.size,
            total: availableCodes.size,
          })}
        </p>
        <Progress value={progressValue} className="mt-2" />
        <div className="mt-3 flex flex-wrap gap-1">
          {fullAccessCategories.map((category) => (
            <Badge key={category} variant="green" className="text-[10px]">
              {t(`category.${category}` as const)}
            </Badge>
          ))}
          {lockedCategories.map((category) => (
            <Badge key={category} variant="slate" className="text-[10px]">
              {t(`category.${category}` as const)}
            </Badge>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h4 className="text-sm font-semibold">{t("detail.navPreviewTitle")}</h4>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm">
          {NAV_PREVIEW_ENTRIES.map((entry) => {
            const visible = isNavEntryVisible(entry.permissionCode, grantedCodes);
            return (
              <li
                key={entry.labelKey}
                className={cn(
                  "flex items-center justify-between",
                  !visible && "text-muted-foreground line-through",
                )}
              >
                <span>{tNav(entry.labelKey as never)}</span>
                {!visible ? (
                  <span className="text-xs italic">{t("detail.navHidden")}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h4 className="text-sm font-semibold">{t("detail.assignedPeople")}</h4>
        <div className="mt-2 flex flex-col gap-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-2 text-sm">
              <InitialsAvatar
                firstName={member.user?.firstName}
                lastName={member.user?.lastName}
                className="size-7"
              />
              {member.user ? `${member.user.firstName} ${member.user.lastName}` : null}
            </div>
          ))}
          {members.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("detail.noPeople")}</p>
          ) : null}
        </div>
      </section>

      {!role.isSystem ? (
        <section className="rounded-lg border border-destructive/30 bg-card p-4">
          <h4 className="text-sm font-semibold text-destructive">{t("detail.dangerZone")}</h4>
          <div className="mt-2">
            <DeleteConfirmationDialog
              itemName={role.name ?? ""}
              onConfirm={async () => {
                const result = await deleteRoleAction(role.id);
                return { success: result.success };
              }}
              onSuccess={() => router.push(ROUTES.admin.roles(locale))}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
