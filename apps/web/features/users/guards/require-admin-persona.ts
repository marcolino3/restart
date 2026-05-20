import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { isAdminPersona } from "@/features/users/lib/admin-persona";

// Server guard for /admin pages that are reserved for admin personas
// (ADMIN, HR, OFFICE) or SuperAdmin. Teacher/Student/Parent/Employee
// personas are redirected back to the admin root regardless of which
// permissions their role happens to grant — mirrors the backend persona
// hard-block in GraphQLAccessGuard / BetterAuthGuard.
export async function requireAdminPersona() {
  const res = await getCurrentUserAction();
  const locale = await getLocale();

  if (!res?.success) redirect(`/${locale}/sign-in`);

  const { isSuperAdmin, persona } = res.data;
  if (isSuperAdmin || isAdminPersona(persona)) return;

  redirect(`/${locale}/admin/forbidden`);
}
