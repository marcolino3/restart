import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { getCountryInputTemplatesAction } from "@/features/country-input-templates/actions/get-country-input-templates.action";
import { CountryTemplateDetail } from "@/features/country-input-templates/components/CountryTemplateDetail";
import { getCountryName } from "@/features/country-input-templates/lib/countries";

type Props = {
  params: Promise<{ locale: string; countryCode: string }>;
};

const CountryTemplateDetailPage = async ({ params }: Props) => {
  const { countryCode: rawCode } = await params;
  const locale = await getLocale();
  const userRes = await getCurrentUserAction();

  if (!userRes?.success) {
    redirect(`/${locale}/sign-in`);
  }
  if (!userRes.data.isSuperAdmin) {
    redirect(`/${locale}/admin`);
  }

  const countryCode = rawCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    redirect(`/${locale}/admin/settings/country-templates`);
  }

  const templatesRes = await getCountryInputTemplatesAction();
  const forCountry = templatesRes.data.filter(
    (t) => t.countryCode === countryCode,
  );

  return (
    <div className="p-4">
      <CountryTemplateDetail
        countryCode={countryCode}
        countryName={getCountryName(countryCode, locale)}
        locale={locale}
        initial={forCountry}
      />
    </div>
  );
};

export default CountryTemplateDetailPage;
