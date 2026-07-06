import { getContactPersonsAction } from "@/features/contact-persons/actions/get-contact-persons.action";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { ContactPersonsTable } from "@/features/contact-persons/components/ContactPersonsTable";
import { ContactPersonsCsvUpload } from "@/features/contact-persons/components/ContactPersonsCsvUpload";
import { ROUTES } from "@/constants/routes";
import { PageHead } from "@/components/common/PageHead";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

const ContactPersonsPage = async () => {
  const t = await getTranslations("ContactPersons");
  const tS = await getTranslations("Students");
  const locale = await getLocale();
  const userRes = await getCurrentUserAction();

  if (!userRes?.data?.orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p>{tS("selectOrganizationFirst")}</p>
      </div>
    );
  }

  const { success, data } = await getContactPersonsAction();

  return (
    <div>
      <PageHead
        title={t("contactPersons")}
        subtitle={
          success && data
            ? t("contactPersonsCount", { count: data.length })
            : undefined
        }
        action={
          <div className="flex items-center gap-2">
            <ContactPersonsCsvUpload />
            <Button asChild>
              <Link href={ROUTES.admin.contactPersonsCreate(locale)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                {t("createContactPerson")}
              </Link>
            </Button>
          </div>
        }
      />
      {success && data && data.length > 0 ? (
        <ContactPersonsTable data={data} />
      ) : (
        <p className="text-muted-foreground">{t("noContactPersonsFound")}</p>
      )}
    </div>
  );
};

export default ContactPersonsPage;
