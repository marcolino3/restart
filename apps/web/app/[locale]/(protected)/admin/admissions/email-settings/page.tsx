import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

/**
 * SMTP is an organization-wide setting, not an admissions one — it now lives in
 * the settings tabs. Kept as a redirect so bookmarks and existing links survive.
 */
export default async function EmailSettingsRoute() {
  const locale = await getLocale();
  redirect(`/${locale}/admin/settings/smtp`);
}
