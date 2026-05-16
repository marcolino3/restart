import { Globe } from "lucide-react";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getCountryInputTemplatesAction } from "@/features/country-input-templates/actions/get-country-input-templates.action";
import { CountryTemplatesList } from "@/features/country-input-templates/components/CountryTemplatesList";

const CountryTemplatesPage = async () => {
  const locale = await getLocale();
  const userRes = await getCurrentUserAction();

  if (!userRes?.success) {
    redirect(`/${locale}/sign-in`);
  }
  if (!userRes.data.isSuperAdmin) {
    redirect(`/${locale}/admin`);
  }

  const templatesRes = await getCountryInputTemplatesAction();

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2">
          <Globe className="text-primary h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Country Input Templates</h1>
          <p className="text-muted-foreground text-sm">
            Länderliste — wähle ein Land, um Masken für Telefon, SSN und PLZ zu
            pflegen. IBAN ist global standardisiert und hartcodiert.
          </p>
        </div>
      </div>

      <CountryTemplatesList initial={templatesRes.data} locale={locale} />
    </div>
  );
};

export default CountryTemplatesPage;
