import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { hasAdminRole } from "@/features/users/lib/admin-roles";

// Server guard for /admin pages that are reserved for admin-capable roles
// (ORG_OWNER, ORG_ADMIN, HR_MANAGER, OFFICE) or SuperAdmin. Mirrors the
// backend role-based enforcement in GraphQLAccessGuard / BetterAuthGuard.
export async function requireAdminRole() {
  const res = await getCurrentUserAction();
  const locale = await getLocale();

  if (!res?.success) redirect(`/${locale}/sign-in`);

  const { isSuperAdmin, roles } = res.data;
  if (isSuperAdmin || hasAdminRole(roles)) return;

  redirect(`/${locale}/admin/forbidden`);
}
