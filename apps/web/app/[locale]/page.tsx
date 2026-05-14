import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

export default async function Home() {
  const locale = await getLocale();
  const res = await getCurrentUserAction();
  redirect(res?.success ? `/${locale}/admin` : `/${locale}/sign-in`);
}
