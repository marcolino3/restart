"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/common/InitialsAvatar";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { ROUTES } from "@/constants/routes";
import { deleteRoleAction } from "../actions/delete-role.action";
import { getRoleFieldPermissionsAction } from "../actions/get-role-field-permissions.action";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import { CATEGORY_ORDER, detectLevel, groupCatalog } from "../permission-catalog";
import { groupFieldCatalog, isSpecialCategory } from "../field-catalog";
import { NAV_PREVIEW_ENTRIES, isNavEntryVisible } from "../lib/nav-visibility";
import { ManageRoleMembersDialog } from "./ManageRoleMembersDialog";
import { cn } from "@/lib/utils";

type RoleDetailRailProps = {
  role: RoleWithPermissions;
  availableCodes: Set<string>;
  locale: string;
  onCheckFields: () => void;
};

type StatRowProps = {
  label: string;
  count: number;
  total: number;
  colorClassName: string;
};

function StatRow({ label, count, total, colorClassName }: StatRowProps) {
  const value = total ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("size-3.5 shrink-0 rounded", colorClassName)} />
      <span className="w-[88px] shrink-0 truncate text-[13px] text-muted-foreground">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-level-0">
        <div
          className={cn("h-full rounded-full", colorClassName)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-5 shrink-0 text-right text-[13px] font-semibold tabular-nums">
        {count}
      </span>
    </div>
  );
}

export function RoleDetailRail({
  role,
  availableCodes,
  locale,
  onCheckFields,
}: RoleDetailRailProps) {
  const t = useTranslations("Roles");
  const tNav = useTranslations("SiteHeader");
  const router = useRouter();

  const grantedCodes = new Set((role.permissions ?? []).map((p) => p.code));
  const categories = CATEGORY_ORDER.filter((category) =>
    groupCatalog(availableCodes).some((c) => c.category === category),
  );
  const levelCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const category of categories) {
    const level = detectLevel(category, grantedCodes, availableCodes);
    if (level !== null) levelCounts[level] += 1;
  }

  const [fieldEntries, setFieldEntries] = useState<
    { resource: string; field: string; actions: string[] }[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    getRoleFieldPermissionsAction(role.id).then((result) => {
      if (cancelled) return;
      setFieldEntries(result.success ? result.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [role.id]);

  const groupedFields = groupFieldCatalog();
  const allFields = groupedFields.flatMap((g) => g.fields);
  const totalFields = allFields.length;
  const specialFields = allFields.filter(isSpecialCategory);
  const visibleFieldCount =
    fieldEntries?.filter((e) => e.actions.length > 0).length ?? 0;
  const editableFieldCount =
    fieldEntries?.filter((e) => e.actions.includes("update")).length ?? 0;
  const visibleSpecialCount = fieldEntries
    ? specialFields.filter((f) =>
        fieldEntries.some(
          (e) => e.resource === f.resource && e.field === f.field && e.actions.length > 0,
        ),
      ).length
    : 0;

  const members = role.memberships ?? [];

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border bg-card p-5">
        <h4 className="text-[15px] font-bold">{t("detail.overview")}</h4>
        <div className="mt-4 flex flex-col">
          <div className="flex items-center justify-between border-t py-2.5 text-[13px]">
            <span className="text-muted-foreground">{t("detail.activeRights")}</span>
            <span className="text-sm font-bold tabular-nums">
              {t("detail.activeRightsOfTotal", {
                granted: grantedCodes.size,
                total: availableCodes.size,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between border-t py-2.5 text-[13px]">
            <span className="text-muted-foreground">{t("detail.areasWithFullAccess")}</span>
            <span className="text-sm font-bold tabular-nums">
              {t("detail.areasWithFullAccessOfTotal", {
                count: levelCounts[3],
                total: categories.length,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between border-t py-2.5 text-[13px]">
            <span className="text-muted-foreground">{t("detail.areasWithoutAccess")}</span>
            <span className="text-sm font-bold tabular-nums">{levelCounts[0]}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-t pt-3.5">
          <StatRow
            label={t("detail.fullAccessCount")}
            count={levelCounts[3]}
            total={categories.length}
            colorClassName="bg-level-3"
          />
          <StatRow
            label={t("detail.editableCount")}
            count={levelCounts[2]}
            total={categories.length}
            colorClassName="bg-level-2"
          />
          <StatRow
            label={t("detail.areaReadOnlyCount")}
            count={levelCounts[1]}
            total={categories.length}
            colorClassName="bg-level-1"
          />
          <StatRow
            label={t("detail.noAccessCount")}
            count={levelCounts[0]}
            total={categories.length}
            colorClassName="bg-level-0"
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h4 className="text-[15px] font-bold">{t("detail.fieldAccessTitle")}</h4>
        <div className="mt-4 flex flex-col">
          <div className="flex items-center justify-between border-t py-2.5 text-[13px]">
            <span className="text-muted-foreground">{t("detail.visibleFields")}</span>
            <span className="text-sm font-bold tabular-nums">
              {t("detail.activeRightsOfTotal", { granted: visibleFieldCount, total: totalFields })}
            </span>
          </div>
          <div className="flex items-center justify-between border-t py-2.5 text-[13px]">
            <span className="text-muted-foreground">{t("detail.editableFields")}</span>
            <span className="text-sm font-bold tabular-nums">{editableFieldCount}</span>
          </div>
          <div className="flex items-center justify-between border-t py-2.5 text-[13px]">
            <span className="text-muted-foreground">{t("detail.specialFields")}</span>
            <span className="text-sm font-bold tabular-nums">
              {t("detail.specialFieldsOfTotal", {
                visible: visibleSpecialCount,
                total: specialFields.length,
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-t pt-3.5">
          <StatRow
            label={t("detail.editableCount")}
            count={editableFieldCount}
            total={totalFields}
            colorClassName="bg-level-2"
          />
          <StatRow
            label={t("detail.readOnlyCount")}
            count={Math.max(visibleFieldCount - editableFieldCount, 0)}
            total={totalFields}
            colorClassName="bg-level-1"
          />
          <StatRow
            label={t("detail.noAccessCount")}
            count={Math.max(totalFields - visibleFieldCount, 0)}
            total={totalFields}
            colorClassName="bg-level-0"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5 w-full rounded-full"
          onClick={onCheckFields}
        >
          {t("detail.checkFields")}
        </Button>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h4 className="text-[15px] font-bold">{t("detail.navPreviewTitle")}</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("detail.navPreviewDescription")}
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {NAV_PREVIEW_ENTRIES.map((entry) => {
            const visible = isNavEntryVisible(entry.permissionCode, grantedCodes);
            const EntryIcon = entry.icon;
            return (
              <li
                key={entry.labelKey}
                className={cn(
                  "flex items-center justify-between",
                  !visible && "text-muted-foreground line-through",
                )}
              >
                <span className="flex items-center gap-2">
                  <EntryIcon className="size-4 shrink-0" />
                  {tNav(entry.labelKey as never)}
                </span>
                {!visible ? (
                  <span className="text-xs italic">{t("detail.navHidden")}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2">
          <h4 className="text-[15px] font-bold">{t("detail.assignedPeople")}</h4>
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
            {members.length}
          </span>
        </div>
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
        <ManageRoleMembersDialog
          roleId={role.id}
          roleName={role.name ?? ""}
          currentMembers={members}
          onUpdated={() => router.refresh()}
          trigger={
            <Button type="button" variant="outline" size="sm" className="mt-3 w-full">
              {t("detail.manageMembers")}
            </Button>
          }
        />
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h4 className="text-[15px] font-bold">{t("detail.dangerZone")}</h4>
        {role.isSystem ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("detail.systemRoleDeleteHint")}
          </p>
        ) : null}
        <div className="mt-3">
          <DeleteConfirmationDialog
            itemName={role.name ?? ""}
            disabled={role.isSystem}
            trigger={
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={role.isSystem}
                className="w-full text-destructive hover:text-destructive"
              >
                {t("detail.deleteRole")}
              </Button>
            }
            onConfirm={async () => {
              const result = await deleteRoleAction(role.id);
              return { success: result.success };
            }}
            onSuccess={() => router.push(ROUTES.admin.roles(locale))}
          />
        </div>
      </section>
    </div>
  );
}
