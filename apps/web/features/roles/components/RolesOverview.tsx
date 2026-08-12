"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHead } from "@/components/common/PageHead";
import { InitialsAvatar } from "@/components/common/InitialsAvatar";
import type { RoleWithPermissions } from "../actions/get-roles.action";
import type { PermissionItem } from "../actions/get-permissions.action";
import { RoleCard } from "./RoleCard";
import { RoleComparisonMatrix } from "./RoleComparisonMatrix";
import { RoleLevelLegend } from "./RoleLevelLegend";
import { CreateRoleDialog } from "./CreateRoleDialog";

type RolesOverviewProps = {
  roles: RoleWithPermissions[];
  permissions: PermissionItem[];
};

export function RolesOverview({ roles, permissions }: RolesOverviewProps) {
  const t = useTranslations("Roles");
  const router = useRouter();
  const availableCodes = new Set(permissions.map((p) => p.code));

  const people = roles.flatMap((role) =>
    (role.memberships ?? []).map((member) => ({
      member,
      roleName: role.name,
    })),
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title={t("title")}
        subtitle={t("rolesCount", { count: roles.length })}
        action={
          <CreateRoleDialog
            availableSourceRoles={roles}
            onCreated={() => router.refresh()}
          />
        }
      />
      <RoleLevelLegend />

      <Tabs defaultValue="roles">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="roles">
            {t("overview.tabRoles")}
          </TabsTrigger>
          <TabsTrigger variant="underline" value="comparison">
            {t("overview.tabComparison")}
          </TabsTrigger>
          <TabsTrigger variant="underline" value="people">
            {t("overview.tabPeople")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <RoleCard key={role.id} role={role} availableCodes={availableCodes} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <RoleComparisonMatrix roles={roles} availableCodes={availableCodes} />
        </TabsContent>

        <TabsContent value="people">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">{t("overview.person")}</th>
                  <th className="p-3 text-left font-medium">{t("overview.role")}</th>
                </tr>
              </thead>
              <tbody>
                {people.map(({ member, roleName }) => (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <InitialsAvatar
                          firstName={member.user?.firstName}
                          lastName={member.user?.lastName}
                          className="size-7"
                        />
                        {member.user
                          ? `${member.user.firstName} ${member.user.lastName}`
                          : null}
                      </div>
                    </td>
                    <td className="p-3">{roleName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
