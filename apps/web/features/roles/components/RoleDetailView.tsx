"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeftIcon, CopyIcon } from "lucide-react";

import { Tabs, TabsBadge, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHead } from "@/components/common/PageHead";
import { ROUTES } from "@/constants/routes";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import type { PermissionItem } from "../actions/get-permissions.action";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { RoleDomainEditor } from "./RoleDomainEditor";
import { RoleFieldPermissionEditor } from "./RoleFieldPermissionEditor";
import { RoleDetailRail } from "./RoleDetailRail";
import { CATEGORY_ORDER, groupCatalog } from "../permission-catalog";
import { groupFieldCatalog } from "../field-catalog";
import { roleDisplayName } from "../lib/role-display-name";
import { cn } from "@/lib/utils";

type RoleDetailViewProps = {
  role: RoleWithPermissions;
  roles: RoleWithPermissions[];
  permissions: PermissionItem[];
  expandedCategory?: string;
};

export function RoleDetailView({
  role: initialRole,
  roles,
  permissions,
  expandedCategory,
}: RoleDetailViewProps) {
  const t = useTranslations("Roles");
  const locale = useLocale();
  const [role, setRole] = useState(initialRole);
  const [tab, setTab] = useState("domains");
  const availableCodes = new Set(permissions.map((p) => p.code));

  const categoryCount = CATEGORY_ORDER.filter((category) =>
    groupCatalog(availableCodes).some((c) => c.category === category),
  ).length;
  const fieldCount = groupFieldCatalog().reduce((sum, g) => sum + g.fields.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={ROUTES.admin.roles(locale)}
          className="mb-[3px] inline-flex items-center gap-0.5 text-[12.5px] font-[550] text-muted-foreground hover:text-accent-foreground"
        >
          <ChevronLeftIcon className="size-3.5" />
          {t("title")}
        </Link>

        <PageHead
          className="mb-3"
          title={roleDisplayName(t, role)}
          subtitle={
            <>
              {role.systemCode ? <span>{role.systemCode}</span> : null}
              {role.systemCode ? " · " : ""}
              {role.isSystem ? t("systemRole") : t("customRole")}
            </>
          }
          action={
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <span className="size-2 rounded-full bg-level-3" />
                {t("savingHint")}
              </span>
              <CreateRoleDialog
                duplicateFromRoleId={role.id}
                duplicateFromRoleName={role.name ?? undefined}
                onCreated={() => {}}
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-full border bg-card px-[14px] py-[5px] text-[12.5px] font-semibold transition-colors hover:border-primary/50"
                  >
                    <CopyIcon className="size-3.5" />
                    {t("duplicateRoleTitle")}
                  </button>
                }
              />
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("selectRole")}
          </span>
          {roles.map((r) => (
            <Link
              key={r.id}
              href={ROUTES.admin.roleDetail(locale, r.id)}
              className={cn(
                "rounded-full border bg-card px-[14px] py-[5px] text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
                r.id === role.id &&
                  "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
              )}
            >
              {roleDisplayName(t, r)}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="segment" className="mb-4">
            <TabsTrigger variant="segment" value="domains" className="group gap-1.5">
              {t("detail.tabDomains")}
              <TabsBadge className="ml-0 bg-level-0 text-[10.5px] text-muted-foreground group-data-[state=active]:bg-primary-foreground/25 group-data-[state=active]:text-primary-foreground">
                {categoryCount}
              </TabsBadge>
            </TabsTrigger>
            <TabsTrigger variant="segment" value="fields" className="group gap-1.5">
              {t("detail.tabFields")}
              <TabsBadge className="ml-0 bg-level-0 text-[10.5px] text-muted-foreground group-data-[state=active]:bg-primary-foreground/25 group-data-[state=active]:text-primary-foreground">
                {fieldCount}
              </TabsBadge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            <RoleDomainEditor
              role={role}
              permissions={permissions}
              expandedCategory={expandedCategory}
              onRoleChange={setRole}
            />
          </TabsContent>

          <TabsContent value="fields">
            <RoleFieldPermissionEditor role={role} availableCodes={availableCodes} />
          </TabsContent>
        </Tabs>

        <RoleDetailRail
          role={role}
          availableCodes={availableCodes}
          locale={locale}
          onCheckFields={() => setTab("fields")}
        />
      </div>
    </div>
  );
}
