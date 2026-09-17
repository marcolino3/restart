import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '../actions/get-current-user.action';

export async function requireEmployeeWrite() {
  const result = await getCurrentUserAction();
  const locale = await getLocale();
  if (!result.success) redirect(`/${locale}/sign-in`);
  if (!result.data.orgId || (!result.data.isSuperAdmin && !result.data.permissions.includes('EMPLOYEE_WRITE'))) redirect(`/${locale}/admin/forbidden`);
  return result.data;
}
