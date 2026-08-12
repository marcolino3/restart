import { notFound } from "next/navigation";

import { getRolesAction } from "@/features/roles/actions/get-roles.action";
import { getPermissionsAction } from "@/features/roles/actions/get-permissions.action";
import { RoleDetailView } from "@/features/roles/components/RoleDetailView";

type RoleDetailPageProps = {
  params: Promise<{ roleId: string }>;
  searchParams: Promise<{ domain?: string }>;
};

const RoleDetailPage = async ({ params, searchParams }: RoleDetailPageProps) => {
  const { roleId } = await params;
  const { domain } = await searchParams;

  const [rolesResult, permissionsResult] = await Promise.all([
    getRolesAction(),
    getPermissionsAction(),
  ]);

  if (!rolesResult.success || !permissionsResult.success) {
    notFound();
  }

  const role = rolesResult.data.find((r) => r.id === roleId);
  if (!role) {
    notFound();
  }

  return (
    <RoleDetailView
      role={role}
      roles={rolesResult.data}
      permissions={permissionsResult.data}
      expandedCategory={domain}
    />
  );
};

export default RoleDetailPage;
