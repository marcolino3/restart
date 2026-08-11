import { getTranslations } from "next-intl/server";

import { getRolesAction } from "@/features/roles/actions/get-roles.action";
import { getPermissionsAction } from "@/features/roles/actions/get-permissions.action";
import { RolesOverview } from "@/features/roles/components/RolesOverview";

const RolesPage = async () => {
  const [rolesResult, permissionsResult, t] = await Promise.all([
    getRolesAction(),
    getPermissionsAction(),
    getTranslations("Roles"),
  ]);

  if (!rolesResult.success || !permissionsResult.success) {
    return <div>{t("loadError")}</div>;
  }

  return (
    <RolesOverview roles={rolesResult.data} permissions={permissionsResult.data} />
  );
};

export default RolesPage;
