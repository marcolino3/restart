import { LoginForm } from "@/features/auth/components/LoginForm";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const res = await getCurrentUserAction();
  if (res?.success) {
    const locale = await getLocale();
    redirect(`/${locale}/admin`);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-xs font-bold">R</span>
          </div>
          Restart
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
