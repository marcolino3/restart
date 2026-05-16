import ContactPersonForm from "@/features/contact-persons/components/ContactPersonForm";
import { getActiveOrganizationAction } from "@/features/organizations/actions/get-active-organization.action";
import { getTranslations } from "next-intl/server";

export default async function CreateContactPersonPage() {
  const t = await getTranslations("ContactPersons");
  const orgRes = await getActiveOrganizationAction();
  const orgCountry = orgRes.success ? (orgRes.data?.country ?? null) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("createContactPerson")}</h1>
      <ContactPersonForm orgCountry={orgCountry} />
    </div>
  );
}
