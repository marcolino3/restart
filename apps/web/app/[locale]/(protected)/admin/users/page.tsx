import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getUsersAction } from "@/features/users/actions/get-users.action";
import { UsersTable } from "@/features/users/components/UsersTable";

const UsersPage = async () => {
  const locale = await getLocale();
  const t = await getTranslations("Common");
  const response = await getUsersAction();

  if (!response.success) {
    return <div>{t("error")}: {response.error}</div>;
  }

  return (
    <div>
      <Link href={ROUTES.admin.usersCreate(locale)}>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          {t("createUser")}
        </Button>
      </Link>
      <UsersTable data={response.data} />
    </div>
  );
};

export default UsersPage;
