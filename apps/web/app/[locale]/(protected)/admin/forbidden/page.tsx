import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { IconShieldLock } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

const ForbiddenPage = async () => {
  const t = await getTranslations("Forbidden");
  const locale = await getLocale();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-xl border p-8 text-center shadow-sm">
        <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
          <IconShieldLock className="size-7" />
        </div>
        <div className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
          {t("code")}
        </div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
        <Button asChild className="mt-2">
          <Link href={ROUTES.admin.dashboard(locale)}>
            {t("backToDashboard")}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ForbiddenPage;
