import ContactPersonForm from "@/features/contact-persons/components/ContactPersonForm";
import { getTranslations } from "next-intl/server";

export default async function CreateContactPersonPage() {
  const t = await getTranslations("ContactPersons");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("createContactPerson")}</h1>
      <ContactPersonForm />
    </div>
  );
}
