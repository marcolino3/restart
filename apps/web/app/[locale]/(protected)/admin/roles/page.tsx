import { getRolesAction } from "@/features/roles/actions/get-roles.action";
import { getPermissionsAction } from "@/features/roles/actions/get-permissions.action";
import { RolePermissionMatrix } from "@/features/roles/components/RolePermissionMatrix";

const RolesPage = async () => {
  const [rolesResult, permissionsResult] = await Promise.all([
    getRolesAction(),
    getPermissionsAction(),
  ]);

  if (!rolesResult.success || !permissionsResult.success) {
    return <div>Fehler beim Laden der Rollen und Berechtigungen.</div>;
  }

  return (
    <RolePermissionMatrix
      roles={rolesResult.data}
      permissions={permissionsResult.data}
    />
  );
};

export default RolesPage;
