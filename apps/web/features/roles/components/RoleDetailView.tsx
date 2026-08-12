"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeftIcon, CopyIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/constants/routes";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import type { PermissionItem } from "../actions/get-permissions.action";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { RoleDomainEditor } from "./RoleDomainEditor";
import { RoleFieldPermissionEditor } from "./RoleFieldPermissionEditor";
import { RoleDetailRail } from "./RoleDetailRail";

type RoleDetailViewProps = {
  role: RoleWithPermissions;
  permissions: PermissionItem[];
  expandedCategory?: string;
};

export function RoleDetailView({
  role: initialRole,
  permissions,
  expandedCategory,
}: RoleDetailViewProps) {
  const t = useTranslations("Roles");
  const locale = useLocale();
  const [role, setRole] = useState(initialRole);
  const availableCodes = new Set(permissions.map((p) => p.code));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={ROUTES.admin.roles(locale)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            <ChevronLeftIcon className="size-4" />
            {t("title")}
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold">{role.name}</h1>
            <Badge variant={role.isSystem ? "secondary" : "outline"}>
              {role.isSystem ? t("systemRole") : t("customRole")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t("savingHint")}</p>
        </div>
        <CreateRoleDialog
          duplicateFromRoleId={role.id}
          duplicateFromRoleName={role.name ?? undefined}
          onCreated={() => {}}
          trigger={
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-primary"
            >
              <CopyIcon className="size-4" />
              {t("duplicateRoleTitle")}
            </button>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Tabs defaultValue="domains">
          <TabsList variant="underline">
            <TabsTrigger variant="underline" value="domains">
              {t("detail.tabDomains")}
            </TabsTrigger>
            <TabsTrigger variant="underline" value="fields">
              {t("detail.tabFields")}
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

        <RoleDetailRail role={role} availableCodes={availableCodes} locale={locale} />
      </div>
    </div>
  );
}
