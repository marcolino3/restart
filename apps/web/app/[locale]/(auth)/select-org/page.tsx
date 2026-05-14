import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getOrganizationsAction } from "@/features/organizations/actions/get-organizations.action";
import { SelectOrgList } from "@/features/auth/components/SelectOrgList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function SelectOrgPage() {
  const locale = await getLocale();
  const userRes = await getCurrentUserAction();

  if (!userRes?.success) {
    redirect(`/${locale}/sign-in`);
  }

  // Already has an active org → straight to admin
  if (userRes.data.orgId) {
    redirect(`/${locale}/admin`);
  }

  const orgsRes = await getOrganizationsAction();
  const organizations = orgsRes.success ? orgsRes.data : [];

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-xs font-bold">R</span>
          </div>
          Restart
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Organisation auswählen</CardTitle>
            <CardDescription>
              Wähle die Organisation, mit der du arbeiten möchtest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SelectOrgList organizations={organizations} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
